CREATE TYPE "public"."member_category" AS ENUM('ACTIF', 'RETRAITE', 'ADMINISTRATIF', 'AUTRE');--> statement-breakpoint
CREATE TYPE "public"."news_visibility" AS ENUM('PUBLIC', 'MEMBERS');--> statement-breakpoint
CREATE TYPE "public"."offer_category" AS ENUM('CINEMA', 'PARCS', 'SPECTACLES', 'SPORT', 'VOYAGES', 'FAMILLE', 'AUTRE');--> statement-breakpoint
CREATE TYPE "public"."offer_kind" AS ENUM('TICKET', 'EVENT');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('PENDING_PAYMENT', 'PAID', 'DELIVERED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."publication_status" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."token_purpose" AS ENUM('EMAIL_VERIFICATION', 'PASSWORD_RESET');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('MEMBER', 'BUREAU', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('PENDING_VERIFICATION', 'PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED', 'REJECTED');--> statement-breakpoint
CREATE SEQUENCE "public"."member_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"details" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"handled_at" timestamp with time zone,
	"handled_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text NOT NULL,
	"body" text NOT NULL,
	"visibility" "news_visibility" DEFAULT 'PUBLIC' NOT NULL,
	"status" "publication_status" DEFAULT 'DRAFT' NOT NULL,
	"published_at" timestamp with time zone,
	"author_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offer_tariffs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"offer_id" uuid NOT NULL,
	"label" text NOT NULL,
	"member_price_cents" integer NOT NULL,
	"public_price_cents" integer,
	"stock" integer,
	"position" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "offer_tariffs_member_price_positive" CHECK ("offer_tariffs"."member_price_cents" >= 0),
	CONSTRAINT "offer_tariffs_public_price_positive" CHECK ("offer_tariffs"."public_price_cents" is null or "offer_tariffs"."public_price_cents" >= 0),
	CONSTRAINT "offer_tariffs_stock_positive" CHECK ("offer_tariffs"."stock" is null or "offer_tariffs"."stock" >= 0)
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"kind" "offer_kind" NOT NULL,
	"category" "offer_category" NOT NULL,
	"summary" text NOT NULL,
	"description" text NOT NULL,
	"pickup_info" text,
	"location" text,
	"event_starts_at" timestamp with time zone,
	"valid_until" date,
	"order_deadline" timestamp with time zone,
	"max_per_member" integer,
	"status" "publication_status" DEFAULT 'DRAFT' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "offers_max_per_member_positive" CHECK ("offers"."max_per_member" is null or "offers"."max_per_member" > 0),
	CONSTRAINT "offers_event_has_date" CHECK ("offers"."kind" <> 'EVENT' or "offers"."event_starts_at" is not null)
);
--> statement-breakpoint
CREATE TABLE "order_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"tariff_id" uuid NOT NULL,
	"label" text NOT NULL,
	"unit_price_cents" integer NOT NULL,
	"quantity" integer NOT NULL,
	CONSTRAINT "order_lines_quantity_positive" CHECK ("order_lines"."quantity" > 0),
	CONSTRAINT "order_lines_unit_price_positive" CHECK ("order_lines"."unit_price_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" integer GENERATED ALWAYS AS IDENTITY (sequence name "orders_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" uuid NOT NULL,
	"offer_id" uuid NOT NULL,
	"status" "order_status" DEFAULT 'PENDING_PAYMENT' NOT NULL,
	"total_cents" integer NOT NULL,
	"idempotency_key" text NOT NULL,
	"paid_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_total_positive" CHECK ("orders"."total_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "partners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" "offer_category" NOT NULL,
	"advantage" text NOT NULL,
	"description" text,
	"how_to_benefit" text NOT NULL,
	"website_url" text,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer NOT NULL,
	"reset_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "user_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"purpose" "token_purpose" NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"phone" text,
	"category" "member_category" NOT NULL,
	"assignment" text,
	"role" "user_role" DEFAULT 'MEMBER' NOT NULL,
	"status" "user_status" DEFAULT 'PENDING_VERIFICATION' NOT NULL,
	"email_verified_at" timestamp with time zone,
	"member_number" text,
	"membership_valid_until" date,
	"reviewed_at" timestamp with time zone,
	"reviewed_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_lowercase" CHECK ("users"."email" = lower("users"."email"))
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_messages" ADD CONSTRAINT "contact_messages_handled_by_id_users_id_fk" FOREIGN KEY ("handled_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news" ADD CONSTRAINT "news_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_tariffs" ADD CONSTRAINT "offer_tariffs_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_tariff_id_offer_tariffs_id_fk" FOREIGN KEY ("tariff_id") REFERENCES "public"."offer_tariffs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_tokens" ADD CONSTRAINT "user_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "contact_messages_created_at_idx" ON "contact_messages" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "news_slug_key" ON "news" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "news_status_published_idx" ON "news" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "offer_tariffs_offer_id_idx" ON "offer_tariffs" USING btree ("offer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "offers_slug_key" ON "offers" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "offers_status_idx" ON "offers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "order_lines_order_id_idx" ON "order_lines" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_lines_tariff_id_idx" ON "order_lines" USING btree ("tariff_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_number_key" ON "orders" USING btree ("number");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_user_idempotency_key" ON "orders" USING btree ("user_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "orders_user_id_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_offer_id_idx" ON "orders" USING btree ("offer_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "partners_published_idx" ON "partners" USING btree ("published");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "user_tokens_user_purpose_idx" ON "user_tokens" USING btree ("user_id","purpose");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_key" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_member_number_key" ON "users" USING btree ("member_number");--> statement-breakpoint
CREATE INDEX "users_status_idx" ON "users" USING btree ("status");