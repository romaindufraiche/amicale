CREATE TABLE "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" integer GENERATED ALWAYS AS IDENTITY (sequence name "members_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"last_name" text NOT NULL,
	"first_name" text NOT NULL,
	"name_key" text NOT NULL,
	"season" text NOT NULL,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "members_number_unique" UNIQUE("number")
);
--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "card_season" text DEFAULT '2027' NOT NULL;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "members_name_key_idx" ON "members" USING btree ("name_key");