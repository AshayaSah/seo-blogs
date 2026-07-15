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
export const contentFormatEnum = z.enum(["markdown", "html"]);

const featuredImageSchema = z.object({
  url: z.url(),
  alt_text: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

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

export const blogPayloadSchema = z.object({
  // --- Required core: identity, routing, and content ---------------------
  agent_content_id: z.string().min(1),
  status: statusEnum.default("draft"),
  title: z.string().min(1),
  slug: z
    .string()
    .regex(slugPattern, "slug must be lowercase words separated by hyphens"),
  primary_keyword: z.string().min(1),
  category: z.string().min(1),
  tags: z.array(z.string()),
  author_id: z.uuid(),
  content_format: contentFormatEnum,
  content_body: z.string().min(100, "content_body must be at least 100 characters"),
  read_time_minutes: z.number().int().positive(),

  // --- SEO essentials (required, but validated only for shape) -----------
  meta_description: z.string(),
  featured_image: featuredImageSchema,
  canonical_url: z.url(),
  og: ogSchema,
  structured_data_type: z.string(),

  // --- Optional SEO extras -----------------------------------------------
  secondary_keywords: z.array(z.string()).optional(),
  key_takeaways: z.array(z.string()).optional(),
  faq: z.array(faqItemSchema).optional(),
  internal_link_suggestions: z.array(z.string()).optional(),
  source_trend_reference: sourceTrendReferenceSchema.optional(),

  // --- Localisation & scheduling -----------------------------------------
  language: z.string().default("en"),
  published_at: isoDateTime.nullable().optional(),
  scheduled_at: isoDateTime.nullable().optional(),
});

export type BlogPayload = z.infer<typeof blogPayloadSchema>;
