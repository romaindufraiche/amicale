CREATE TYPE "public"."classified_kind" AS ENUM('VENTE', 'LOCATION', 'PRET', 'DON', 'TROC');--> statement-breakpoint
CREATE TABLE "classifieds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "classified_kind" NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"image_id" uuid,
	"pinned" boolean DEFAULT false NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "member_count" integer;--> statement-breakpoint
ALTER TABLE "classifieds" ADD CONSTRAINT "classifieds_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "classifieds_published_idx" ON "classifieds" USING btree ("published","pinned","created_at");