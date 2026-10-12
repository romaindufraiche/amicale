ALTER TYPE "public"."offer_kind" ADD VALUE 'OTHER';--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mime_type" text NOT NULL,
	"file_name" text NOT NULL,
	"data" "bytea" NOT NULL,
	"size_bytes" integer NOT NULL,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "documents_mime_type" CHECK ("documents"."mime_type" in ('application/pdf', 'image/jpeg'))
);
--> statement-breakpoint
ALTER TABLE "offers" ALTER COLUMN "summary" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "partners" ALTER COLUMN "advantage" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "partners" ALTER COLUMN "how_to_benefit" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "offer_requests" ADD COLUMN "quantity" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "offer_requests" ADD COLUMN "lines" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "offers" ADD COLUMN "provider_url" text;--> statement-breakpoint
ALTER TABLE "offers" ADD COLUMN "attachment_id" uuid;--> statement-breakpoint
ALTER TABLE "offers" ADD COLUMN "e_tickets" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "offers" ADD COLUMN "orderable" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "offers" ADD COLUMN "position" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN "image_id" uuid;--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN "attachment_id" uuid;--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN "position" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "documents_created_at_idx" ON "documents" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_attachment_id_documents_id_fk" FOREIGN KEY ("attachment_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partners" ADD CONSTRAINT "partners_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partners" ADD CONSTRAINT "partners_attachment_id_documents_id_fk" FOREIGN KEY ("attachment_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_requests" ADD CONSTRAINT "offer_requests_quantity_positive" CHECK ("offer_requests"."quantity" > 0);--> statement-breakpoint
-- Ordre initial : celui affiché jusqu'ici (offres à la une, puis les plus récentes ; partenaires par nom).
UPDATE "offers" o SET "position" = r.rn
FROM (SELECT "id", row_number() OVER (ORDER BY "featured" DESC, "published_at" DESC NULLS LAST, "created_at" DESC) AS rn FROM "offers") r
WHERE o."id" = r."id";--> statement-breakpoint
UPDATE "partners" p SET "position" = r.rn
FROM (SELECT "id", row_number() OVER (ORDER BY "name") AS rn FROM "partners") r
WHERE p."id" = r."id";
