import type { BlogPayload } from "./validation";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QualityCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface QualityReport {
  passed: boolean;
  checks: QualityCheck[];
}

/**
 * Minimal shape the gate needs from already-stored posts. Compatible with
 * `SelectPost` from the Drizzle schema (title is nullable there), so callers
 * can pass query results straight through.
 */
export interface ExistingPostRef {
  slug: string;
  title: string | null;
}

// ---------------------------------------------------------------------------
// Helpers (pure)
// ---------------------------------------------------------------------------

const includesCI = (haystack: string, needle: string): boolean =>
  haystack.toLowerCase().includes(needle.toLowerCase());

/** First non-empty block, treating blank lines as paragraph separators. */
function firstParagraph(body: string): string {
  const blocks = body
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  return blocks[0] ?? "";
}

function wordCount(body: string): number {
  const trimmed = body.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

/** Lowercase, collapse any non-alphanumeric run to a single space, trim. */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------
// Quality gate
// ---------------------------------------------------------------------------

export function runQualityGate(
  payload: BlogPayload,
  existingPosts: ExistingPostRef[],
): QualityReport {
  const checks: QualityCheck[] = [];

  // 1. Title length 50–60 chars.
  const titleLen = payload.title.length;
  checks.push({
    name: "title_length",
    passed: titleLen >= 50 && titleLen <= 60,
    detail: `title is ${titleLen} chars (want 50–60)`,
  });

  // 2. Meta description length 140–160 chars.
  const metaLen = payload.meta_description.length;
  checks.push({
    name: "meta_description_length",
    passed: metaLen >= 140 && metaLen <= 160,
    detail: `meta_description is ${metaLen} chars (want 140–160)`,
  });

  // 3. primary_keyword appears in title, first paragraph, and an image alt.
  const kw = payload.primary_keyword;
  const inTitle = includesCI(payload.title, kw);
  const para = firstParagraph(payload.content_body);
  const inFirstParagraph = includesCI(para, kw);
  const inImageAlt = includesCI(payload.featured_image.alt_text, kw);
  const missing = [
    !inTitle && "title",
    !inFirstParagraph && "first paragraph",
    !inImageAlt && "image alt",
  ].filter(Boolean);
  checks.push({
    name: "primary_keyword_placement",
    passed: inTitle && inFirstParagraph && inImageAlt,
    detail:
      missing.length === 0
        ? `"${kw}" found in title, first paragraph, and image alt`
        : `"${kw}" missing from: ${missing.join(", ")}`,
  });

  // 4. Word count of content_body ≥ 800.
  const words = wordCount(payload.content_body);
  checks.push({
    name: "content_word_count",
    passed: words >= 800,
    detail: `content_body has ${words} words (want ≥ 800)`,
  });

  // 5. Slug unused and title not a near-duplicate of an existing post.
  const slugTaken = existingPosts.some((p) => p.slug === payload.slug);
  const normNew = normalizeTitle(payload.title);
  const dupTitle = existingPosts.find(
    (p) => p.title != null && normalizeTitle(p.title) === normNew,
  );
  const uniquePassed = !slugTaken && !dupTitle;
  checks.push({
    name: "slug_and_title_unique",
    passed: uniquePassed,
    detail: slugTaken
      ? `slug "${payload.slug}" already exists`
      : dupTitle
        ? `title near-duplicates existing post "${dupTitle.slug}"`
        : "slug and title are unique",
  });

  // 6. At least one key_takeaway AND one faq entry (AEO extractability).
  const takeaways = payload.key_takeaways?.length ?? 0;
  const faqs = payload.faq?.length ?? 0;
  checks.push({
    name: "aeo_extractability",
    passed: takeaways >= 1 && faqs >= 1,
    detail: `key_takeaways: ${takeaways}, faq: ${faqs} (want ≥ 1 of each)`,
  });

  // 7. Keyword-difficulty guard: a young domain shouldn't auto-publish hard
  //    terms. Fails only when a trend reference reports difficulty > 40.
  const kd = payload.source_trend_reference?.keyword_difficulty;
  checks.push({
    name: "keyword_difficulty_guard",
    passed: kd === undefined || kd <= 40,
    detail:
      kd === undefined
        ? "no source_trend_reference; difficulty guard not applicable"
        : kd > 40
          ? `keyword_difficulty ${kd} exceeds 40 (too hard to auto-publish)`
          : `keyword_difficulty ${kd} within limit (≤ 40)`,
  });

  return {
    passed: checks.every((c) => c.passed),
    checks,
  };
}

// ---------------------------------------------------------------------------
// Status decision
// ---------------------------------------------------------------------------

/**
 * Only content that clears every check AND wasn't explicitly submitted as a
 * draft may go straight to `published`; everything else is `flagged` for
 * human review.
 */
export function decideStatus(
  payload: BlogPayload,
  report: QualityReport,
): "published" | "flagged" {
  return report.passed && payload.status !== "draft" ? "published" : "flagged";
}
