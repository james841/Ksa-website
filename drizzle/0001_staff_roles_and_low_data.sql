CREATE TYPE "public"."staff_role" AS ENUM('super_admin', 'admin', 'content_editor', 'course_manager', 'support', 'marketing');--> statement-breakpoint
CREATE TABLE "staff_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"staff_role" "staff_role" NOT NULL,
	"token_hash" text NOT NULL,
	"invited_by" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"accepted_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "low_data" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "staff_role" "staff_role";--> statement-breakpoint
ALTER TABLE "staff_invites" ADD CONSTRAINT "staff_invites_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_invites" ADD CONSTRAINT "staff_invites_accepted_by_users_id_fk" FOREIGN KEY ("accepted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "staff_invites_token_idx" ON "staff_invites" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "staff_invites_email_idx" ON "staff_invites" USING btree ("email");--> statement-breakpoint
-- Admins that existed before team roles keep full access.
UPDATE "users" SET "staff_role" = 'super_admin' WHERE "role" = 'admin' AND "staff_role" IS NULL;
