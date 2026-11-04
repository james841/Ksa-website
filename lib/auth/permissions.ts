/*
 * Admin team roles and what each one can open.
 * Plain data (no server code), so the sidebar can use it to hide links too.
 * Hiding links is only for tidiness: every admin page and action checks on the server.
 */

export const STAFF_ROLES = ["super_admin", "admin", "content_editor", "course_manager", "support", "marketing"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const SECTIONS = [
  "overview",
  "quotes",
  "users",
  "subscribers",
  "webinars",
  "courses",
  "payments",
  "campaigns",
  "content",
  "activity",
  "team",
] as const;
export type Section = (typeof SECTIONS)[number];

export const SECTION_LABELS: Record<Section, string> = {
  overview: "Dashboard",
  quotes: "Service requests",
  users: "Users",
  subscribers: "Subscribers",
  webinars: "Webinars",
  courses: "Courses",
  payments: "Course payments",
  campaigns: "Email campaigns",
  content: "Website content",
  activity: "Activity log",
  team: "Team and access",
};

export const ROLE_INFO: Record<StaffRole, { label: string; description: string; sections: readonly Section[] }> = {
  super_admin: {
    label: "Super admin",
    description: "Everything, including adding and removing other super admins. Keep this to one or two owners.",
    sections: SECTIONS,
  },
  admin: {
    label: "Admin",
    description: "Everything, and can manage the team, but cannot add, change or remove super admins.",
    sections: SECTIONS,
  },
  content_editor: {
    label: "Content editor",
    description: "Website text, homepage carousel, FAQs, advisory board and webinars.",
    sections: ["overview", "content", "webinars"],
  },
  course_manager: {
    label: "Course manager",
    description: "Courses, lessons and files, webinars, course payments, and giving learners access to courses.",
    sections: ["overview", "courses", "payments", "webinars", "users"],
  },
  support: {
    label: "Support",
    description: "Answers service requests and helps users and subscribers.",
    sections: ["overview", "quotes", "users", "subscribers"],
  },
  marketing: {
    label: "Marketing",
    description: "Email campaigns, subscribers and webinars.",
    sections: ["overview", "campaigns", "subscribers", "webinars"],
  },
};

export function isStaffRole(v: unknown): v is StaffRole {
  return typeof v === "string" && (STAFF_ROLES as readonly string[]).includes(v);
}

export function can(role: StaffRole | null | undefined, section: Section) {
  return !!role && ROLE_INFO[role].sections.includes(section);
}

/** Which section an /admin path belongs to. */
export function sectionForPath(path: string): Section {
  const seg = path.replace(/^\/admin\/?/, "").split("/")[0];
  return (SECTIONS as readonly string[]).includes(seg) ? (seg as Section) : "overview";
}

/** Roles this person may hand out. Only a super admin can create another super admin. */
export function assignableRoles(actor: StaffRole): StaffRole[] {
  return actor === "super_admin" ? [...STAFF_ROLES] : STAFF_ROLES.filter((r) => r !== "super_admin");
}
