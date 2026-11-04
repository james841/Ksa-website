import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  uniqueIndex,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Enums                                                               */
/* ------------------------------------------------------------------ */

export const userRole = pgEnum("user_role", ["user", "admin"]);
export const userStatus = pgEnum("user_status", ["active", "suspended"]);
// What an admin team member can open (see lib/auth/permissions.ts). Empty for normal users.
export const staffRole = pgEnum("staff_role", ["super_admin", "admin", "content_editor", "course_manager", "support", "marketing"]);
export const tokenType = pgEnum("token_type", ["verify_email", "reset_password"]);
export const subscriptionStatus = pgEnum("subscription_status", ["subscribed", "unsubscribed"]);
export const quoteStatus = pgEnum("quote_status", ["new", "in_progress", "responded", "closed"]);
export const webinarStatus = pgEnum("webinar_status", ["draft", "published", "cancelled"]);
export const courseStatus = pgEnum("course_status", ["draft", "coming_soon", "published", "archived"]);
export const courseLevel = pgEnum("course_level", ["all", "beginner", "intermediate", "advanced"]);
export const enrollmentMode = pgEnum("enrollment_mode", ["open", "invite"]);
export const enrollmentSource = pgEnum("enrollment_source", ["self", "admin"]);
export const mediaVisibility = pgEnum("media_visibility", ["public", "private"]);
// Course payments taken through PayFast.
export const paymentStatus = pgEnum("payment_status", ["pending", "paid", "failed", "cancelled"]);
export const campaignAudience = pgEnum("campaign_audience", [
  "all_subscribers",
  "webinar_registrants",
  "course_learners",
]);
export const campaignStatus = pgEnum("campaign_status", [
  "draft",
  "scheduled",
  "sending",
  "sent",
  "failed",
]);
export const recipientStatus = pgEnum("recipient_status", [
  "queued",
  "sent",
  "delivered",
  "bounced",
  "complained",
  "failed",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
};

/* ------------------------------------------------------------------ */
/* Accounts                                                            */
/* ------------------------------------------------------------------ */

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRole("role").default("user").notNull(),
    staffRole: staffRole("staff_role"),
    // Admin team members only: email alerts for their part of the console.
    notifyByEmail: boolean("notify_by_email").default(true).notNull(),
    status: userStatus("status").default("active").notNull(),
    country: text("country"),
    phone: text("phone"),
    institution: text("institution"),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email), index("users_created_idx").on(t.createdAt)],
);

export const sessions = pgTable(
  "sessions",
  {
    // sha256 hash of the cookie token. The raw token is never stored.
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    userAgent: text("user_agent"),
    ip: text("ip"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const authTokens = pgTable(
  "auth_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: tokenType("type").notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("auth_tokens_hash_idx").on(t.tokenHash)],
);

/** Invitations to join the admin team. Only the sha256 of the link token is stored. */
export const staffInvites = pgTable(
  "staff_invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    staffRole: staffRole("staff_role").notNull(),
    tokenHash: text("token_hash").notNull(),
    invitedBy: uuid("invited_by").references(() => users.id, { onDelete: "set null" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    acceptedBy: uuid("accepted_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("staff_invites_token_idx").on(t.tokenHash), index("staff_invites_email_idx").on(t.email)],
);

/* ------------------------------------------------------------------ */
/* Marketing consent (kept separate from accounts on purpose)          */
/* ------------------------------------------------------------------ */

export const emailSubscriptions = pgTable(
  "email_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    name: text("name"),
    status: subscriptionStatus("status").default("subscribed").notNull(),
    source: text("source").notNull(),
    consentText: text("consent_text").notNull(),
    consentedAt: timestamp("consented_at", { withTimezone: true }).defaultNow().notNull(),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
    unsubscribeToken: text("unsubscribe_token").notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("subs_email_idx").on(t.email),
    uniqueIndex("subs_token_idx").on(t.unsubscribeToken),
    index("subs_status_idx").on(t.status),
  ],
);

export const consentEvents = pgTable(
  "consent_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    subscriptionId: uuid("subscription_id")
      .notNull()
      .references(() => emailSubscriptions.id, { onDelete: "cascade" }),
    action: text("action").notNull(), // subscribed | unsubscribed | resubscribed | bounced | complained
    source: text("source"),
    ip: text("ip"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("consent_events_sub_idx").on(t.subscriptionId)],
);

/* ------------------------------------------------------------------ */
/* Quote enquiries                                                     */
/* ------------------------------------------------------------------ */

export const quoteRequests = pgTable(
  "quote_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reference: text("reference").notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    country: text("country").notNull(),
    phone: text("phone").notNull(),
    service: text("service").notNull(),
    description: text("description").notNull(),
    promoCode: text("promo_code"),
    status: quoteStatus("status").default("new").notNull(),
    followUpAt: timestamp("follow_up_at", { withTimezone: true }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    ip: text("ip"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("quotes_ref_idx").on(t.reference),
    index("quotes_status_idx").on(t.status),
    index("quotes_created_idx").on(t.createdAt),
  ],
);

export const quoteNotes = pgTable("quote_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  quoteId: uuid("quote_id")
    .notNull()
    .references(() => quoteRequests.id, { onDelete: "cascade" }),
  authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ------------------------------------------------------------------ */
/* Media                                                               */
/* ------------------------------------------------------------------ */

export const media = pgTable("media", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  width: integer("width"),
  height: integer("height"),
  visibility: mediaVisibility("visibility").default("public").notNull(),
  uploadedBy: uuid("uploaded_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ------------------------------------------------------------------ */
/* Webinars                                                            */
/* ------------------------------------------------------------------ */

export const webinars = pgTable(
  "webinars",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    description: text("description").notNull().default(""),
    speakerName: text("speaker_name"),
    speakerTitle: text("speaker_title"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    meetingUrl: text("meeting_url"),
    meetingDetails: text("meeting_details"),
    capacity: integer("capacity"),
    coverImage: text("cover_image"),
    status: webinarStatus("status").default("draft").notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex("webinars_slug_idx").on(t.slug), index("webinars_starts_idx").on(t.startsAt)],
);

export const webinarRegistrations = pgTable(
  "webinar_registrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    webinarId: uuid("webinar_id")
      .notNull()
      .references(() => webinars.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    attended: boolean("attended").default(false).notNull(),
    reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("webinar_reg_unique").on(t.webinarId, t.userId)],
);

/* ------------------------------------------------------------------ */
/* Courses                                                             */
/* ------------------------------------------------------------------ */

export const courses = pgTable(
  "courses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    summary: text("summary").notNull(),
    description: text("description").notNull().default(""),
    outcomes: jsonb("outcomes").$type<string[]>().default([]).notNull(),
    category: text("category").notNull().default("Research skills"),
    level: courseLevel("level").default("all").notNull(),
    durationLabel: text("duration_label"),
    coverImage: text("cover_image"),
    instructorName: text("instructor_name"),
    instructorBio: text("instructor_bio"),
    status: courseStatus("status").default("draft").notNull(),
    enrollmentMode: enrollmentMode("enrollment_mode").default("open").notNull(),
    // "Low data friendly": every lesson can be followed with text notes or audio, without video.
    lowData: boolean("low_data").default(false).notNull(),
    // Price in cents (so 35000 is R350.00). Zero means the course is free.
    priceCents: integer("price_cents").default(0).notNull(),
    currency: text("currency").default("ZAR").notNull(),
    position: integer("position").default(0).notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex("courses_slug_idx").on(t.slug)],
);

export const courseModules = pgTable(
  "course_modules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    summary: text("summary"),
    position: integer("position").default(0).notNull(),
  },
  (t) => [index("modules_course_idx").on(t.courseId)],
);

export const lessons = pgTable(
  "lessons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    moduleId: uuid("module_id")
      .notNull()
      .references(() => courseModules.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    videoUrl: text("video_url"),
    body: text("body").notNull().default(""),
    durationMinutes: integer("duration_minutes"),
    isPreview: boolean("is_preview").default(false).notNull(),
    published: boolean("published").default(true).notNull(),
    position: integer("position").default(0).notNull(),
    ...timestamps,
  },
  (t) => [index("lessons_module_idx").on(t.moduleId), index("lessons_course_idx").on(t.courseId)],
);

export const lessonResources = pgTable("lesson_resources", {
  id: uuid("id").primaryKey().defaultRandom(),
  lessonId: uuid("lesson_id")
    .notNull()
    .references(() => lessons.id, { onDelete: "cascade" }),
  mediaId: uuid("media_id")
    .notNull()
    .references(() => media.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  allowDownload: boolean("allow_download").default(true).notNull(),
});

export const enrollments = pgTable(
  "enrollments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    source: enrollmentSource("source").default("self").notNull(),
    lastLessonId: uuid("last_lesson_id").references(() => lessons.id, { onDelete: "set null" }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [uniqueIndex("enrollment_unique").on(t.courseId, t.userId)],
);

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    completedAt: timestamp("completed_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.lessonId] })],
);

export const courseInterest = pgTable(
  "course_interest",
  {
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.courseId, t.userId] })],
);

/* ------------------------------------------------------------------ */
/* Email campaigns                                                     */
/* ------------------------------------------------------------------ */

export const emailCampaigns = pgTable("email_campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  subject: text("subject").notNull(),
  previewText: text("preview_text"),
  body: text("body").notNull(),
  audience: campaignAudience("audience").default("all_subscribers").notNull(),
  audienceRefId: uuid("audience_ref_id"),
  status: campaignStatus("status").default("draft").notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  totalRecipients: integer("total_recipients").default(0).notNull(),
  sentCount: integer("sent_count").default(0).notNull(),
  failedCount: integer("failed_count").default(0).notNull(),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  ...timestamps,
});

export const campaignRecipients = pgTable(
  "campaign_recipients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => emailCampaigns.id, { onDelete: "cascade" }),
    subscriptionId: uuid("subscription_id").references(() => emailSubscriptions.id, {
      onDelete: "set null",
    }),
    email: text("email").notNull(),
    providerId: text("provider_id"),
    status: recipientStatus("status").default("queued").notNull(),
    error: text("error"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("campaign_recipient_unique").on(t.campaignId, t.email),
    index("campaign_recipient_provider_idx").on(t.providerId),
  ],
);

/* ------------------------------------------------------------------ */
/* Editable website content                                            */
/* ------------------------------------------------------------------ */

export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const faqs = pgTable("faqs", {
  id: uuid("id").primaryKey().defaultRandom(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  position: integer("position").default(0).notNull(),
  published: boolean("published").default(true).notNull(),
  showOnHome: boolean("show_on_home").default(false).notNull(),
});

export const boardMembers = pgTable("board_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  affiliation: text("affiliation").notNull(),
  photo: text("photo"),
  position: integer("position").default(0).notNull(),
});

export const homeSlides = pgTable("home_slides", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  caption: text("caption"),
  href: text("href"),
  image: text("image").notNull(),
  position: integer("position").default(0).notNull(),
  published: boolean("published").default(true).notNull(),
});

/**
 * One row per attempt to pay for a course. The row is created before the
 * learner is sent to PayFast, and completed when PayFast tells us the payment
 * went through, so nothing depends on the learner coming back to the website.
 */
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reference: text("reference").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").default("ZAR").notNull(),
    status: paymentStatus("status").default("pending").notNull(),
    provider: text("provider").default("payfast").notNull(),
    providerPaymentId: text("provider_payment_id"),
    email: text("email"),
    raw: jsonb("raw"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex("payments_reference_idx").on(t.reference), index("payments_course_idx").on(t.courseId), index("payments_user_idx").on(t.userId)],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    meta: jsonb("meta"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("audit_created_idx").on(t.createdAt)],
);

export type User = typeof users.$inferSelect;
export type Webinar = typeof webinars.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type QuoteRequest = typeof quoteRequests.$inferSelect;
export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type Payment = typeof payments.$inferSelect;
