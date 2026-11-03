CREATE TYPE "public"."campaign_audience" AS ENUM('all_subscribers', 'webinar_registrants', 'course_learners');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('draft', 'scheduled', 'sending', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."course_level" AS ENUM('all', 'beginner', 'intermediate', 'advanced');--> statement-breakpoint
CREATE TYPE "public"."course_status" AS ENUM('draft', 'coming_soon', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."enrollment_mode" AS ENUM('open', 'invite');--> statement-breakpoint
CREATE TYPE "public"."enrollment_source" AS ENUM('self', 'admin');--> statement-breakpoint
CREATE TYPE "public"."media_visibility" AS ENUM('public', 'private');--> statement-breakpoint
CREATE TYPE "public"."quote_status" AS ENUM('new', 'in_progress', 'responded', 'closed');--> statement-breakpoint
CREATE TYPE "public"."recipient_status" AS ENUM('queued', 'sent', 'delivered', 'bounced', 'complained', 'failed');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('subscribed', 'unsubscribed');--> statement-breakpoint
CREATE TYPE "public"."token_type" AS ENUM('verify_email', 'reset_password');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."webinar_status" AS ENUM('draft', 'published', 'cancelled');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "token_type" NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "board_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"affiliation" text NOT NULL,
	"photo" text,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_recipients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"subscription_id" uuid,
	"email" text NOT NULL,
	"provider_id" text,
	"status" "recipient_status" DEFAULT 'queued' NOT NULL,
	"error" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consent_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscription_id" uuid NOT NULL,
	"action" text NOT NULL,
	"source" text,
	"ip" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_interest" (
	"course_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "course_interest_course_id_user_id_pk" PRIMARY KEY("course_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "course_modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"summary" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"outcomes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"category" text DEFAULT 'Research skills' NOT NULL,
	"level" "course_level" DEFAULT 'all' NOT NULL,
	"duration_label" text,
	"cover_image" text,
	"instructor_name" text,
	"instructor_bio" text,
	"status" "course_status" DEFAULT 'draft' NOT NULL,
	"enrollment_mode" "enrollment_mode" DEFAULT 'open' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject" text NOT NULL,
	"preview_text" text,
	"body" text NOT NULL,
	"audience" "campaign_audience" DEFAULT 'all_subscribers' NOT NULL,
	"audience_ref_id" uuid,
	"status" "campaign_status" DEFAULT 'draft' NOT NULL,
	"scheduled_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"total_recipients" integer DEFAULT 0 NOT NULL,
	"sent_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"user_id" uuid,
	"name" text,
	"status" "subscription_status" DEFAULT 'subscribed' NOT NULL,
	"source" text NOT NULL,
	"consent_text" text NOT NULL,
	"consented_at" timestamp with time zone DEFAULT now() NOT NULL,
	"unsubscribed_at" timestamp with time zone,
	"unsubscribe_token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"source" "enrollment_source" DEFAULT 'self' NOT NULL,
	"last_lesson_id" uuid,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faqs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"show_on_home" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "home_slides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"caption" text,
	"href" text,
	"image" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"published" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_progress" (
	"user_id" uuid NOT NULL,
	"lesson_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_progress_user_id_lesson_id_pk" PRIMARY KEY("user_id","lesson_id")
);
--> statement-breakpoint
CREATE TABLE "lesson_resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" uuid NOT NULL,
	"media_id" uuid NOT NULL,
	"label" text NOT NULL,
	"allow_download" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"module_id" uuid NOT NULL,
	"title" text NOT NULL,
	"video_url" text,
	"body" text DEFAULT '' NOT NULL,
	"duration_minutes" integer,
	"is_preview" boolean DEFAULT false NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"original_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer NOT NULL,
	"width" integer,
	"height" integer,
	"visibility" "media_visibility" DEFAULT 'public' NOT NULL,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quote_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"author_id" uuid,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quote_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"country" text NOT NULL,
	"phone" text NOT NULL,
	"service" text NOT NULL,
	"description" text NOT NULL,
	"promo_code" text,
	"status" "quote_status" DEFAULT 'new' NOT NULL,
	"follow_up_at" timestamp with time zone,
	"user_id" uuid,
	"ip" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"user_agent" text,
	"ip" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"country" text,
	"phone" text,
	"institution" text,
	"email_verified_at" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webinar_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"webinar_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"attended" boolean DEFAULT false NOT NULL,
	"reminder_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webinars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"speaker_name" text,
	"speaker_title" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"meeting_url" text,
	"meeting_details" text,
	"capacity" integer,
	"cover_image" text,
	"status" "webinar_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_recipients" ADD CONSTRAINT "campaign_recipients_campaign_id_email_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."email_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_recipients" ADD CONSTRAINT "campaign_recipients_subscription_id_email_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."email_subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_events" ADD CONSTRAINT "consent_events_subscription_id_email_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."email_subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_interest" ADD CONSTRAINT "course_interest_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_interest" ADD CONSTRAINT "course_interest_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_modules" ADD CONSTRAINT "course_modules_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_subscriptions" ADD CONSTRAINT "email_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_last_lesson_id_lessons_id_fk" FOREIGN KEY ("last_lesson_id") REFERENCES "public"."lessons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_resources" ADD CONSTRAINT "lesson_resources_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_resources" ADD CONSTRAINT "lesson_resources_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_module_id_course_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."course_modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_notes" ADD CONSTRAINT "quote_notes_quote_id_quote_requests_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quote_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_notes" ADD CONSTRAINT "quote_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_requests" ADD CONSTRAINT "quote_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webinar_registrations" ADD CONSTRAINT "webinar_registrations_webinar_id_webinars_id_fk" FOREIGN KEY ("webinar_id") REFERENCES "public"."webinars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webinar_registrations" ADD CONSTRAINT "webinar_registrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_created_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_tokens_hash_idx" ON "auth_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "campaign_recipient_unique" ON "campaign_recipients" USING btree ("campaign_id","email");--> statement-breakpoint
CREATE INDEX "campaign_recipient_provider_idx" ON "campaign_recipients" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "consent_events_sub_idx" ON "consent_events" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "modules_course_idx" ON "course_modules" USING btree ("course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "courses_slug_idx" ON "courses" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "subs_email_idx" ON "email_subscriptions" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "subs_token_idx" ON "email_subscriptions" USING btree ("unsubscribe_token");--> statement-breakpoint
CREATE INDEX "subs_status_idx" ON "email_subscriptions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "enrollment_unique" ON "enrollments" USING btree ("course_id","user_id");--> statement-breakpoint
CREATE INDEX "lessons_module_idx" ON "lessons" USING btree ("module_id");--> statement-breakpoint
CREATE INDEX "lessons_course_idx" ON "lessons" USING btree ("course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "quotes_ref_idx" ON "quote_requests" USING btree ("reference");--> statement-breakpoint
CREATE INDEX "quotes_status_idx" ON "quote_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "quotes_created_idx" ON "quote_requests" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_created_idx" ON "users" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "webinar_reg_unique" ON "webinar_registrations" USING btree ("webinar_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "webinars_slug_idx" ON "webinars" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "webinars_starts_idx" ON "webinars" USING btree ("starts_at");