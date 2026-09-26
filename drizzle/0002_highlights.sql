CREATE TYPE "public"."highlight_tone" AS ENUM('RED', 'NIGHT', 'AMBER', 'BLUE', 'SAND');--> statement-breakpoint
CREATE TABLE "highlights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"link_url" text,
	"link_label" text,
	"tone" "highlight_tone" DEFAULT 'RED' NOT NULL,
	"visibility" "news_visibility" DEFAULT 'PUBLIC' NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "highlights_period" CHECK ("highlights"."starts_at" is null or "highlights"."ends_at" is null or "highlights"."starts_at" < "highlights"."ends_at")
);
--> statement-breakpoint
CREATE INDEX "highlights_published_idx" ON "highlights" USING btree ("published","position");