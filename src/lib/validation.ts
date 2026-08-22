import { z } from "zod";

/**
 * Validation for the agent payload sent to `POST /api/blogs`.
 *
 * Design intent (per spec): be *strict* about the fields the pipeline can't do
 * without — the content identity, the body, and the routing/authoring keys —
 * and *lenient* about supplemental SEO enrichment, which the agent may or may
 * not include. Unknown keys are stripped (Zod's default object behaviour)
 * rather than rejected, so the agent can send extra metadata without breaking.
 */

// A URL-friendly slug: lowercase alphanumerics separated by single hyphens.
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// ISO-8601 datetime string, accepting UTC (`Z`), an explicit offset, or a
// local (offset-less) timestamp — maximally lenient for agent-produced values.
const isoDateTime = z.iso.datetime({ offset: true, local: true });

// Mirrors the pg enums in src/db/schema.ts.
export const statusEnum = z.enum(["draft", "flagged", "published"]);
// Markdown is the house standard; html is supported for legacy/edge cases only.
// Agents should default to markdown including for titles (titles are NOT raw
// HTML — they're inline markdown strings, validated as plain z.string(), and
// the rendering side interprets them via renderInlineMarkdown()).
export const contentFormatEnum = z.enum(["markdown", "html"]);

// ---------------------------------------------------------------------------
// Shared image shape — used by featuredImage, images gallery, and
// contentSections[].image.  The `cloudinary_public_id` field is optional so
// posts with externally hosted (non-Cloudinary) images still validate.
// ---------------------------------------------------------------------------

export const imageSchema = z.object({
  url: z.url(),
  alt_text: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  caption: z.string().optional(),
  cloudinary_public_id: z.string().optional(),
});

/** @deprecated Use `imageSchema` instead. */
export const featuredImageSchema = imageSchema;

// ---------------------------------------------------------------------------
// Validation limits — tunable constants, not magic numbers.
// Keep in sync with the agent-facing docs served from GET /api/blogs.
// ---------------------------------------------------------------------------

export const VALIDATION_LIMITS = {
  maxGalleryImages: 12,
  maxExternalLinks: 10,
} as const;

// ---------------------------------------------------------------------------
// Sub-schemas for optional SEO enrichment fields
// ---------------------------------------------------------------------------

export const imagesSchema = z
  .array(imageSchema)
  .max(VALIDATION_LIMITS.maxGalleryImages)
  .optional();

const externalLinkSchema = z.object({
  label: z.string().min(1),
  url: z.url(),
  rel: z.enum(["nofollow", "sponsored", "ugc"]).nullable().optional(),
  description: z.string().optional(),
});

export const externalLinksSchema = z
  .array(externalLinkSchema)
  .max(VALIDATION_LIMITS.maxExternalLinks)
  .optional();

const contentSectionSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  image: imageSchema.optional(),
  // NOTE: no `id` field here — the agent never sends it, it's server-derived.
});

export const contentSectionsSchema = z
  .array(contentSectionSchema)
  .min(1)
  .optional();

const ogSchema = z.object({
  title: z.string(),
  description: z.string(),
  type: z.string(),
});

const faqItemSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

const sourceTrendReferenceSchema = z.object({
  trend_name: z.string(),
  detected_at: isoDateTime,
  trend_score: z.number().int(),
  keyword_difficulty: z.number().int(),
});

export const blogPayloadSchema = z
  .object({
    // --- Required core: identity, routing, and content ---------------------
    agent_content_id: z.string().min(1),
    status: statusEnum.default("draft"),
    /**
     * May contain inline markdown (bold/italic/code spans). Rendered via
     * renderInlineMarkdown(); length checks in the quality gate use
     * stripMarkdown() on this value, not raw length.
     */
    title: z.string().min(1),
    slug: z
      .string()
      .regex(slugPattern, "slug must be lowercase words separated by hyphens"),
    primary_keyword: z.string().min(1),
    category: z.string().min(1),
    tags: z.array(z.string()),
    author_id: z.uuid(),
    content_format: contentFormatEnum.default("markdown"),
    content_body: z
      .string()
      .min(100, "content_body must be at least 100 characters")
      .optional(),
    read_time_minutes: z.number().int().positive(),

    // --- SEO essentials (required, but validated only for shape) -----------
    meta_description: z.string(),
    featured_image: imageSchema,
    canonical_url: z.url(),
    og: ogSchema,
    structured_data_type: z.string(),

    // --- Optional SEO extras -----------------------------------------------
    secondary_keywords: z.array(z.string()).optional(),
    key_takeaways: z.array(z.string()).optional(),
    faq: z.array(faqItemSchema).optional(),
    internal_link_suggestions: z.array(z.string()).optional(),
    source_trend_reference: sourceTrendReferenceSchema.optional(),
    images: imagesSchema,
    external_links: externalLinksSchema,
    content_sections: contentSectionsSchema,

    // --- Localisation & scheduling -----------------------------------------
    language: z.string().default("en"),
    published_at: isoDateTime.nullable().optional(),
    scheduled_at: isoDateTime.nullable().optional(),
  })
  .refine(
    (data) =>
      (data.content_body && data.content_body.length > 0) ||
      (data.content_sections && data.content_sections.length > 0),
    {
      message: "either content_body or content_sections is required",
    },
  );

export type BlogPayload = z.infer<typeof blogPayloadSchema>;
