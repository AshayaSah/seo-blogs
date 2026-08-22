CREATE TABLE "system_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "images" jsonb;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "external_links" jsonb;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "content_sections" jsonb;