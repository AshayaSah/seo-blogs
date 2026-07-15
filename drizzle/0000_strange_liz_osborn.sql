CREATE TYPE "public"."content_format" AS ENUM('markdown', 'html');--> statement-breakpoint
CREATE TYPE "public"."post_status" AS ENUM('draft', 'flagged', 'published');--> statement-breakpoint
CREATE TABLE "authors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"slug" text,
	"bio" text,
	"avatar_url" text,
	"same_as" jsonb,
	"job_title" text,
	CONSTRAINT "authors_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_content_id" text NOT NULL,
	"status" "post_status" DEFAULT 'draft' NOT NULL,
	"title" text,
	"slug" text NOT NULL,
	"meta_description" text,
	"primary_keyword" text,
	"secondary_keywords" jsonb,
	"category" text,
	"tags" jsonb,
	"author_id" uuid,
	"featured_image" jsonb,
	"content_format" "content_format" DEFAULT 'markdown' NOT NULL,
	"content_body" text,
	"read_time_minutes" integer,
	"faq" jsonb,
	"key_takeaways" jsonb,
	"internal_link_suggestions" jsonb,
	"canonical_url" text,
	"og" jsonb,
	"structured_data_type" text DEFAULT 'Article',
	"language" text DEFAULT 'en',
	"quality_report" jsonb,
	"source_trend_reference" jsonb,
	"published_at" timestamp with time zone,
	"scheduled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "posts_agent_content_id_unique" UNIQUE("agent_content_id"),
	CONSTRAINT "posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "revenue_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid,
	"date" date,
	"pageviews" integer,
	"ad_impressions" integer,
	"ad_revenue" numeric,
	"rpm" numeric
);
--> statement-breakpoint
CREATE TABLE "trend_reference" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid,
	"trend_name" text,
	"detected_at" timestamp with time zone,
	"trend_score" integer,
	"keyword_difficulty" integer
);
--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue_analytics" ADD CONSTRAINT "revenue_analytics_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trend_reference" ADD CONSTRAINT "trend_reference_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;