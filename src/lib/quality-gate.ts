import type { BlogPayload } from "./validation";
import { stripMarkdown } from "./markdown";

// ---------------------------------------------------------------------------
// Thresholds — the single source of truth for both the gate itself and the
// agent-facing docs served from `GET /api/blogs`, so the two can't drift.
// ---------------------------------------------------------------------------

export const QUALITY_GATE_THRESHOLDS = {
  titleLength: { min: 50, max: 60 },
  metaDescriptionLength: { min: 140, max: 160 },
  minContentWords: 800,
  minKeyTakeaways: 1,
  minFaqEntries: 1,
  maxKeywordDifficulty: 40,
} as const;

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

/**
 * Resolve the textual content from whichever shape the agent provided.
 * Prefers `content_sections` (the new structured path) and falls back to
 * the legacy `content_body` string, or empty.
 */
function resolvedBody(payload: BlogPayload): string {
  return (
    payload.content_sections?.map((s) => s.content).join("\n\n") ??
    payload.content_body ??
    ""
  );
}

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

  // 1. Title length 50–60 chars (plain-text length — markdown syntax doesn't
  //    render, so agents using **bold** in titles shouldn't be penalized).
  const { min: titleMin, max: titleMax } = QUALITY_GATE_THRESHOLDS.titleLength;
  const titleLen = stripMarkdown(payload.title).length;
  checks.push({
    name: "title_length",
    passed: titleLen >= titleMin && titleLen <= titleMax,
    detail: `title is ${titleLen} chars (want ${titleMin}–${titleMax})`,
  });

  // 2. Meta description length 140–160 chars.
  const { min: metaMin, max: metaMax } =
    QUALITY_GATE_THRESHOLDS.metaDescriptionLength;
  const metaLen = payload.meta_description.length;
  checks.push({
    name: "meta_description_length",
    passed: metaLen >= metaMin && metaLen <= metaMax,
    detail: `meta_description is ${metaLen} chars (want ${metaMin}–${metaMax})`,
  });

  // 3. primary_keyword appears in title, first paragraph, and an image alt.
  const kw = payload.primary_keyword;
  const inTitle = includesCI(payload.title, kw);
  const para = firstParagraph(resolvedBody(payload));
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

  // 4. Word count of content ≥ minContentWords.
  const { minContentWords } = QUALITY_GATE_THRESHOLDS;
  const words = wordCount(resolvedBody(payload));
  checks.push({
    name: "content_word_count",
    passed: words >= minContentWords,
    detail: `content has ${words} words (want ≥ ${minContentWords})`,
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
  const { minKeyTakeaways, minFaqEntries } = QUALITY_GATE_THRESHOLDS;
  const takeaways = payload.key_takeaways?.length ?? 0;
  const faqs = payload.faq?.length ?? 0;
  checks.push({
    name: "aeo_extractability",
    passed: takeaways >= minKeyTakeaways && faqs >= minFaqEntries,
    detail: `key_takeaways: ${takeaways}, faq: ${faqs} (want ≥ ${minKeyTakeaways} of each)`,
  });

  // 7. Keyword-difficulty guard: a young domain shouldn't auto-publish hard
  //    terms. Fails only when a trend reference reports difficulty above the max.
  const { maxKeywordDifficulty } = QUALITY_GATE_THRESHOLDS;
  const kd = payload.source_trend_reference?.keyword_difficulty;
  checks.push({
    name: "keyword_difficulty_guard",
    passed: kd === undefined || kd <= maxKeywordDifficulty,
    detail:
      kd === undefined
        ? "no source_trend_reference; difficulty guard not applicable"
        : kd > maxKeywordDifficulty
          ? `keyword_difficulty ${kd} exceeds ${maxKeywordDifficulty} (too hard to auto-publish)`
          : `keyword_difficulty ${kd} within limit (≤ ${maxKeywordDifficulty})`,
  });

  // 8. Section heading discipline: when content_sections is present, each
  //    section's content should NOT start with a top-level (# or ##) heading
  //    because the section `title` already becomes the H2 on the page.
  if (payload.content_sections && payload.content_sections.length > 0) {
    const badSections = payload.content_sections
      .map((s, i) => {
        const firstLine = s.content.split("\n")[0]?.trim() ?? "";
        return /^#{1,2}\s/.test(firstLine) ? `section ${i + 1} ("${s.title}")` : null;
      })
      .filter(Boolean);
    checks.push({
      name: "section_heading_discipline",
      passed: badSections.length === 0,
      detail:
        badSections.length === 0
          ? "no top-level headings in section content"
          : `top-level heading found in: ${badSections.join(", ")} — sections should use ###+ for sub-headings since title already becomes the H2`,
    });
  }

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
 * human review. When auto-publish is disabled by the operator the gate still
 * runs (the report is valuable) but the status is always `flagged`.
 */
export function decideStatus(
  payload: BlogPayload,
  report: QualityReport,
  autoPublishEnabled: boolean,
): "published" | "flagged" {
  if (!autoPublishEnabled) return "flagged";
  return report.passed && payload.status !== "draft" ? "published" : "flagged";
}
