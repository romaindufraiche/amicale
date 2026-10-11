ALTER TABLE "offers" ALTER COLUMN "category" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "partners" ALTER COLUMN "category" SET DATA TYPE text;--> statement-breakpoint
-- Catégories supprimées (« Spectacles & culture », « Famille & enfants ») : les offres et
-- partenaires concernés passent en « Divers », à reclasser par le bureau si besoin.
UPDATE "offers" SET "category" = 'AUTRE' WHERE "category" IN ('SPECTACLES', 'FAMILLE');--> statement-breakpoint
UPDATE "partners" SET "category" = 'AUTRE' WHERE "category" IN ('SPECTACLES', 'FAMILLE');--> statement-breakpoint
DROP TYPE "public"."offer_category";--> statement-breakpoint
CREATE TYPE "public"."offer_category" AS ENUM('PARCS', 'CINEMA', 'VOYAGES', 'SPORT', 'EPICERIE', 'PARFUMERIE', 'AUTRE');--> statement-breakpoint
ALTER TABLE "offers" ALTER COLUMN "category" SET DATA TYPE "public"."offer_category" USING "category"::"public"."offer_category";--> statement-breakpoint
ALTER TABLE "partners" ALTER COLUMN "category" SET DATA TYPE "public"."offer_category" USING "category"::"public"."offer_category";