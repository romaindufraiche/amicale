DROP TABLE "order_lines" CASCADE;--> statement-breakpoint
DROP TABLE "orders" CASCADE;--> statement-breakpoint
ALTER TABLE "offers" DROP CONSTRAINT "offers_max_per_member_positive";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_reviewed_by_id_users_id_fk";
--> statement-breakpoint
-- Suppression de l'espace adhérent : seuls les comptes du bureau sont conservés.
DELETE FROM "users" WHERE "role" = 'MEMBER';--> statement-breakpoint
UPDATE "users" SET "status" = 'SUSPENDED' WHERE "status" NOT IN ('ACTIVE', 'SUSPENDED');--> statement-breakpoint
DELETE FROM "user_tokens" WHERE "purpose" = 'EMAIL_VERIFICATION';--> statement-breakpoint
-- Les contenus réservés aux adhérents ne deviennent pas publics : ils repassent en brouillon.
UPDATE "news" SET "status" = 'DRAFT' WHERE "visibility" = 'MEMBERS';--> statement-breakpoint
UPDATE "highlights" SET "published" = false WHERE "visibility" = 'MEMBERS';--> statement-breakpoint
ALTER TABLE "user_tokens" ALTER COLUMN "purpose" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."token_purpose";--> statement-breakpoint
CREATE TYPE "public"."token_purpose" AS ENUM('PASSWORD_RESET');--> statement-breakpoint
ALTER TABLE "user_tokens" ALTER COLUMN "purpose" SET DATA TYPE "public"."token_purpose" USING "purpose"::"public"."token_purpose";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'BUREAU'::text;--> statement-breakpoint
DROP TYPE "public"."user_role";--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('BUREAU', 'ADMIN');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'BUREAU'::"public"."user_role";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."user_role" USING "role"::"public"."user_role";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'ACTIVE'::text;--> statement-breakpoint
DROP TYPE "public"."user_status";--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('ACTIVE', 'SUSPENDED');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'ACTIVE'::"public"."user_status";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "status" SET DATA TYPE "public"."user_status" USING "status"::"public"."user_status";--> statement-breakpoint
DROP INDEX "users_member_number_key";--> statement-breakpoint
DROP INDEX "users_status_idx";--> statement-breakpoint
ALTER TABLE "highlights" DROP COLUMN "visibility";--> statement-breakpoint
ALTER TABLE "news" DROP COLUMN "visibility";--> statement-breakpoint
ALTER TABLE "offers" DROP COLUMN "max_per_member";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "phone";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "category";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "assignment";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "email_verified_at";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "member_number";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "membership_valid_until";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "reviewed_at";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "reviewed_by_id";--> statement-breakpoint
DROP TYPE "public"."member_category";--> statement-breakpoint
DROP TYPE "public"."news_visibility";--> statement-breakpoint
DROP TYPE "public"."order_status";--> statement-breakpoint
DROP SEQUENCE "public"."member_number_seq";