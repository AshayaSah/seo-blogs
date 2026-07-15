import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/src/db";
import { posts } from "@/src/db/schema";
import { blogPayloadSchema } from "@/src/lib/validation";
import {
  runQualityGate,
  decideStatus,
  type ExistingPostRef,
} from "@/src/lib/quality-gate";
import { onPublish } from "@/src/lib/publish-hooks";

/**
 * POST /api/blogs — ingest endpoint for the content agent.
 *
 * Contract:
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

  // Quality gate needs the existing corpus for slug/title uniqueness.
  const existing: ExistingPostRef[] = await db
    .select({ slug: posts.slug, title: posts.title })
    .from(posts);

  const report = runQualityGate(payload, existing);
  const status = decideStatus(payload, report);

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
        featuredImage: payload.featured_image,
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
    // Unique violation on agent_content_id or slug (Postgres 23505).
    const code = (err as { code?: string })?.code;
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
