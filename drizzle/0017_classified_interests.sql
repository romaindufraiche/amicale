CREATE TABLE "classified_interests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"classified_id" uuid NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"processed_at" timestamp with time zone,
	"processed_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "classifieds" ADD COLUMN "image2_id" uuid;--> statement-breakpoint
ALTER TABLE "classified_interests" ADD CONSTRAINT "classified_interests_classified_id_classifieds_id_fk" FOREIGN KEY ("classified_id") REFERENCES "public"."classifieds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classified_interests" ADD CONSTRAINT "classified_interests_processed_by_id_users_id_fk" FOREIGN KEY ("processed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "classified_interests_classified_idx" ON "classified_interests" USING btree ("classified_id","created_at");--> statement-breakpoint
ALTER TABLE "classifieds" ADD CONSTRAINT "classifieds_image2_id_media_id_fk" FOREIGN KEY ("image2_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;