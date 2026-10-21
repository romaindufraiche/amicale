CREATE TABLE "site_visits" (
	"day" date PRIMARY KEY NOT NULL,
	"visits" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "offer_requests" ADD COLUMN "processed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "offer_requests" ADD COLUMN "processed_by_id" uuid;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "membership_open" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "offer_requests" ADD CONSTRAINT "offer_requests_processed_by_id_users_id_fk" FOREIGN KEY ("processed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;