export type SiteSettings = {
  supportEmail: string;
  phone: string;
  whatsapp: string;
  address: string;
  socials: { facebook: string; x: string; linkedin: string; instagram: string; youtube: string; tiktok: string };
  announcement: { enabled: boolean; text: string; href: string };
  heroBadge: string;
  /** Background photo behind the homepage headline. Empty means the default campus photo. */
  heroImage: string;
  /** Where admin alerts are emailed. Empty uses ADMIN_NOTIFY_EMAIL from .env. */
  notifyEmail: string;
};

/**
 * Default hero photo: students on campus, by Iwaria Inc. on Unsplash (free Unsplash License).
 * https://unsplash.com/photos/vWqBjWbc_H4  Replace it any time in Admin > Site settings.
 */
export const DEFAULT_HERO_IMAGE = "https://images.unsplash.com/photo-1655720348590-c739c860beed?w=2400&q=80&fm=jpg&fit=crop";

export const defaultSettings: SiteSettings = {
  supportEmail: "",
  phone: "",
  whatsapp: "",
  address: "",
  // KSA's own accounts. These are only the starting values: the admin can change
  // every one of them in Admin > Site settings.
  socials: {
    facebook: "https://www.facebook.com/share/1ED54ne2MJ/",
    x: "",
    linkedin: "https://www.linkedin.com/company/knowledge-space-academy/",
    instagram: "https://www.instagram.com/kspacedu",
    youtube: "",
    tiktok: "https://www.tiktok.com/@knowledgespaceacademy",
  },
  announcement: { enabled: false, text: "", href: "" },
  heroBadge: "Free monthly research webinars on Zoom",
  heroImage: "",
  notifyEmail: "",
};
