ALTER TABLE "offers" ADD COLUMN "image_path" text;--> statement-breakpoint
ALTER TABLE "offers" ADD COLUMN "featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_image_path_local" CHECK ("offers"."image_path" is null or "offers"."image_path" ~ '^/offres/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)$');