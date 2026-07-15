import {
  pgTable,
  pgEnum,
  uuid,
  text,
  jsonb,
  integer,
  numeric,
  timestamp,
  date,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const postStatusEnum = pgEnum("post_status", [
  "draft",
  "flagged",
  "published",
]);

export const contentFormatEnum = pgEnum("content_format", [
  "markdown",
  "html",
]);

// ---------------------------------------------------------------------------
// authors
// ---------------------------------------------------------------------------

export const authors = pgTable("authors", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  slug: text("slug").unique(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  sameAs: jsonb("same_as").$type<string[]>(),
  jobTitle: text("job_title"),
});

// ---------------------------------------------------------------------------
// posts
// ---------------------------------------------------------------------------

export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentContentId: text("agent_content_id").notNull().unique(),
  status: postStatusEnum("status").notNull().default("draft"),
  title: text("title"),
  slug: text("slug").notNull().unique(),
  metaDescription: text("meta_description"),
  primaryKeyword: text("primary_keyword"),
  secondaryKeywords: jsonb("secondary_keywords").$type<string[]>(),
  category: text("category"),
  tags: jsonb("tags").$type<string[]>(),
  authorId: uuid("author_id").references(() => authors.id),
  featuredImage: jsonb("featured_image"),
  contentFormat: contentFormatEnum("content_format")
    .notNull()
    .default("markdown"),
  contentBody: text("content_body"),
  readTimeMinutes: integer("read_time_minutes"),
  faq: jsonb("faq"),
  keyTakeaways: jsonb("key_takeaways").$type<string[]>(),
  internalLinkSuggestions: jsonb("internal_link_suggestions"),
  canonicalUrl: text("canonical_url"),
  og: jsonb("og"),
  structuredDataType: text("structured_data_type").default("Article"),
  language: text("language").default("en"),
  qualityReport: jsonb("quality_report"),
  sourceTrendReference: jsonb("source_trend_reference"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  // Soft-delete marker: null = live, non-null = deleted at that time.
  // Kept as a column (rather than a new enum value) so the status enum still
  // describes editorial state independently of deletion.
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// ---------------------------------------------------------------------------
// trend_reference
// ---------------------------------------------------------------------------

export const trendReference = pgTable("trend_reference", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").references(() => posts.id),
  trendName: text("trend_name"),
  detectedAt: timestamp("detected_at", { withTimezone: true }),
  trendScore: integer("trend_score"),
  keywordDifficulty: integer("keyword_difficulty"),
});

// ---------------------------------------------------------------------------
// revenue_analytics
// ---------------------------------------------------------------------------

export const revenueAnalytics = pgTable("revenue_analytics", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").references(() => posts.id),
  date: date("date"),
  pageviews: integer("pageviews"),
  adImpressions: integer("ad_impressions"),
  // numeric maps to a JS string by default to preserve precision.
  adRevenue: numeric("ad_revenue"),
  rpm: numeric("rpm"),
});

// ---------------------------------------------------------------------------
// redirects
// ---------------------------------------------------------------------------

export const redirects = pgTable("redirects", {
  id: uuid("id").primaryKey().defaultRandom(),
  fromSlug: text("from_slug").notNull().unique(),
  toSlug: text("to_slug").notNull(),
  statusCode: integer("status_code").default(301),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type InsertPost = typeof posts.$inferInsert;
export type SelectPost = typeof posts.$inferSelect;

export type InsertAuthor = typeof authors.$inferInsert;
export type SelectAuthor = typeof authors.$inferSelect;

export type InsertTrendReference = typeof trendReference.$inferInsert;
export type SelectTrendReference = typeof trendReference.$inferSelect;

export type InsertRevenueAnalytics = typeof revenueAnalytics.$inferInsert;
export type SelectRevenueAnalytics = typeof revenueAnalytics.$inferSelect;

export type InsertRedirect = typeof redirects.$inferInsert;
export type SelectRedirect = typeof redirects.$inferSelect;
