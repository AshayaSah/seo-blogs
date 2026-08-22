import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/src/db";
import { posts } from "@/src/db/schema";
import { blogPayloadSchema } from "@/src/lib/validation";
import {
  runQualityGate,
  decideStatus,
  QUALITY_GATE_THRESHOLDS,
  type ExistingPostRef,
} from "@/src/lib/quality-gate";
import { onPublish } from "@/src/lib/publish-hooks";
import { getAutoPublishEnabled } from "@/src/lib/settings";
import { rehostImage, rehostImages, type ImageShape } from "@/src/lib/images";
import { slugify } from "@/src/lib/site";

/**
 * GET /api/blogs  — validation criteria + patterns for the JSON payload, so
 *                    an agent can self-check a draft before submitting it.
 * POST /api/blogs — ingest endpoint for the content agent.
 *
 * POST contract:
 *   1. Authenticate with a shared key (`x-api-key` or `Authorization: Bearer`).
 *   2. Validate the payload shape (Zod).
 *   3. Run the quality gate against existing posts.
 *   4. Persist with a decided status: `published` (clean + not a draft) or
 *      `flagged` (anything a reviewer should see first).
 */

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.INGEST_API_KEY;
  if (!expected) return false; // fail closed if the server isn't configured

  const headerKey = request.headers.get("x-api-key");
  const auth = request.headers.get("authorization");
  const bearer = auth?.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : undefined;

  return headerKey === expected || bearer === expected;
}

const { titleLength, metaDescriptionLength, minContentWords, maxKeywordDifficulty } =
  QUALITY_GATE_THRESHOLDS;

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    endpoint: "POST /api/blogs",
    authentication: {
      methods: [
        "x-api-key: <key>",
        "Authorization: Bearer <key>",
      ],
    },
    request_schema: z.toJSONSchema(blogPayloadSchema),
    quality_gate: {
      description:
        "Every submission is scored against these automated checks. A " +
        "submission that passes all of them, and was not submitted with " +
        "status \"draft\", is auto-published; otherwise it's inserted as " +
        "\"flagged\" and queued for human review in the admin panel. The " +
        "decided status and the full check report are returned in the " +
        "POST response as `status` and `quality_report`. Submissions may " +
        "be queued for manual review regardless of quality-gate result, at " +
        "the operator's discretion.",
      checks: [
        {
          name: "title_length",
          rule: `title must be ${titleLength.min}–${titleLength.max} characters (plain-text length; markdown syntax is stripped before measuring)`,
        },
        {
          name: "meta_description_length",
          rule: `meta_description must be ${metaDescriptionLength.min}–${metaDescriptionLength.max} characters`,
        },
        {
          name: "primary_keyword_placement",
          rule:
            "primary_keyword must (case-insensitively) appear in title, " +
            "in the first paragraph of content_body or content_sections, " +
            "and in featured_image.alt_text",
        },
        {
          name: "content_word_count",
          rule: `combined content (content_body or content_sections[].content) must be at least ${minContentWords} words`,
        },
        {
          name: "slug_and_title_unique",
          rule:
            "slug must not already exist, and title must not " +
            "near-duplicate (case/punctuation-insensitive) an existing post's title",
        },
        {
          name: "aeo_extractability",
          rule: "key_takeaways and faq must each have at least 1 entry",
        },
        {
          name: "keyword_difficulty_guard",
          rule:
            `if source_trend_reference.keyword_difficulty is present, it ` +
            `must be ≤ ${maxKeywordDifficulty} (omit source_trend_reference ` +
            "entirely to skip this check)",
        },
        {
          name: "section_heading_discipline",
          rule:
            "when content_sections is used, section content must not " +
            "contain top-level (# or ##) headings — use ###+ for sub-headings " +
            "since the section title already becomes the H2",
        },
      ],
    },
    responses: {
      "201": {
        description: "Post created.",
        body: {
          id: "uuid",
          slug: "string",
          status: '"published" | "flagged"',
          quality_report: "{ passed: boolean, checks: QualityCheck[] }",
        },
      },
      "401": "Missing or incorrect API key.",
      "409": "agent_content_id or slug already exists.",
      "422": {
        description: "Payload failed schema validation.",
        body: { error: "string", issues: "{ field: string, message: string }[]" },
      },
    },
  });
}

// timestamptz columns take Date objects; payload sends ISO strings or null.
const toDate = (v: string | null | undefined): Date | null =>
  v ? new Date(v) : null;

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = blogPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 422 },
    );
  }
  const payload = parsed.data;

  // Quality gate needs the existing corpus; settings决定 auto-publish toggle.
  // Fetch both in parallel.
  const [existing, autoPublishEnabled] = await Promise.all([
    db
      .select({ slug: posts.slug, title: posts.title })
      .from(posts) as Promise<ExistingPostRef[]>,
    getAutoPublishEnabled(),
  ]);

  // Re-host agent-submitted images through Cloudinary (fail-open).
  const [rehostedFeatured, rehostedGallery] = await Promise.all([
    rehostImage(payload.featured_image as ImageShape),
    rehostImages((payload.images as ImageShape[] | undefined) ?? []),
  ]);

  // Re-host section images and server-generate collision-free ids.
  const sectionSeen = new Map<string, number>();
  const contentSections = payload.content_sections?.map((s) => {
    let id = slugify(s.title);
    const count = sectionSeen.get(id) ?? 0;
    sectionSeen.set(id, count + 1);
    if (count > 0) id = `${id}-${count + 1}`;

    const rehImg = s.image ? rehostImage(s.image as ImageShape) : undefined;
    return rehImg
      ? rehImg.then((img) => ({ ...s, id, image: img }))
      : Promise.resolve({ ...s, id });
  });
  const resolvedSections = contentSections
    ? await Promise.all(contentSections)
    : undefined;

  const report = runQualityGate(payload, existing);
  const status = decideStatus(payload, report, autoPublishEnabled);

  const publishedAt =
    status === "published"
      ? (toDate(payload.published_at) ?? new Date())
      : toDate(payload.published_at);

  try {
    const [created] = await db
      .insert(posts)
      .values({
        agentContentId: payload.agent_content_id,
        status,
        title: payload.title,
        slug: payload.slug,
        metaDescription: payload.meta_description,
        primaryKeyword: payload.primary_keyword,
        secondaryKeywords: payload.secondary_keywords,
        category: payload.category,
        tags: payload.tags,
        authorId: payload.author_id,
        featuredImage: rehostedFeatured,
        contentFormat: payload.content_format,
        contentBody: payload.content_body,
        readTimeMinutes: payload.read_time_minutes,
        faq: payload.faq,
        keyTakeaways: payload.key_takeaways,
        internalLinkSuggestions: payload.internal_link_suggestions,
        canonicalUrl: payload.canonical_url,
        og: payload.og,
        structuredDataType: payload.structured_data_type,
        language: payload.language,
        qualityReport: report,
        sourceTrendReference: payload.source_trend_reference,
        publishedAt,
        scheduledAt: toDate(payload.scheduled_at),
        images: rehostedGallery.length > 0 ? rehostedGallery : null,
        externalLinks: payload.external_links ?? null,
        contentSections: resolvedSections ?? null,
      })
      .returning({ id: posts.id, slug: posts.slug, status: posts.status });

    // Auto-publish path: fire the same post-publish automation as admin approve.
    if (created.status === "published") {
      onPublish({
        slug: created.slug,
        tags: payload.tags,
        category: payload.category,
      });
    }

    return NextResponse.json(
      {
        id: created.id,
        slug: created.slug,
        status: created.status,
        quality_report: report,
      },
      { status: 201 },
    );
  } catch (err) {
    // Unique violation on agent_content_id or slug (Postgres 23505). The Neon
    // driver wraps the actual pg error under `.cause` rather than throwing it
    // directly, so check both shapes.
    type PgError = { code?: string; cause?: { code?: string } };
    const pgErr = err as PgError;
    const code = pgErr?.code ?? pgErr?.cause?.code;
    if (code === "23505") {
      return NextResponse.json(
        { error: "A post with this agent_content_id or slug already exists" },
        { status: 409 },
      );
    }
    console.error("POST /api/blogs failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
