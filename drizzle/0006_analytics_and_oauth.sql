CREATE TABLE "page_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visitor" text NOT NULL,
	"path" text NOT NULL,
	"title" text,
	"source" text,
	"channel" text DEFAULT 'direct' NOT NULL,
	"referrer" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"device" text DEFAULT 'desktop' NOT NULL,
	"country" text,
	"seconds" integer,
	"is_entry" boolean DEFAULT false NOT NULL,
	"user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "last_seen_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "oauth_provider" text;--> statement-breakpoint
ALTER TABLE "page_views" ADD CONSTRAINT "page_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "views_created_idx" ON "page_views" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "views_visitor_idx" ON "page_views" USING btree ("visitor","created_at");--> statement-breakpoint
CREATE INDEX "views_channel_idx" ON "page_views" USING btree ("channel");--> statement-breakpoint
CREATE INDEX "views_path_idx" ON "page_views" USING btree ("path");