"use server";

import { refresh, updateTag } from "next/cache";
import { asc, eq, max } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { audit } from "@/lib/audit";
import type { SiteSettings } from "@/lib/settings-types";
import { homeHighlights } from "@/lib/content";
import type { ActionState } from "@/lib/validation";
import { bool, errMsg, guard, imageFromForm, str } from "./helpers";

/* ───────────── Site settings ───────────── */

const urlOrEmpty = z.union([z.literal(""), z.string().url("Social links must be full web addresses starting with https://")]);

export async function saveSettings(_p: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await guard("content");
  const supportEmail = str(fd, "supportEmail");
  if (supportEmail && !z.string().email().safeParse(supportEmail).success) return { ok: false, message: "The support email is not valid." };
  const notifyEmail = str(fd, "notifyEmail");
  if (notifyEmail && !z.string().email().safeParse(notifyEmail).success) return { ok: false, message: "The alerts email is not valid." };
  const socials = {
    facebook: str(fd, "facebook"),
    x: str(fd, "x"),
    linkedin: str(fd, "linkedin"),
    instagram: str(fd, "instagram"),
    youtube: str(fd, "youtube"),
    tiktok: str(fd, "tiktok"),
  };
  for (const v of Object.values(socials)) {
    const r = urlOrEmpty.safeParse(v);
    if (!r.success) return { ok: false, message: r.error.issues[0].message };
  }
  const settings: SiteSettings = {
    supportEmail,
    phone: str(fd, "phone"),
    whatsapp: str(fd, "whatsapp").replace(/[^\d+]/g, ""),
    address: str(fd, "address"),
    socials,
    announcement: { enabled: bool(fd, "announcementEnabled"), text: str(fd, "announcementText").slice(0, 160), href: str(fd, "announcementHref") },
    heroBadge: str(fd, "heroBadge").slice(0, 80),
    notifyEmail,
    heroImage: "",
  };
  try {
    // Wide photo, so allow a larger width than other uploads.
    settings.heroImage = (await imageFromForm(fd, "heroImage", admin.id, 2400)) ?? "";
    for (const [key, value] of Object.entries(settings)) {
      await db
        .insert(schema.siteSettings)
        .values({ key, value })
        .onConflictDoUpdate({ target: schema.siteSettings.key, set: { value, updatedAt: new Date() } });
    }
    await audit(admin.id, "update", "settings");
    updateTag("settings");
    refresh();
    return { ok: true, message: "Saved. The website now shows these details." };
  } catch (e) {
    return { ok: false, message: errMsg(e) };
  }
}

/* ───────────── Ordering helper ───────────── */

type Positioned = typeof schema.faqs | typeof schema.boardMembers | typeof schema.homeSlides;

async function move(table: Positioned, id: string, dir: string) {
  const rows = await db.select({ id: table.id }).from(table).orderBy(asc(table.position));
  const i = rows.findIndex((r) => r.id === id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= rows.length) return;
  [rows[i], rows[j]] = [rows[j], rows[i]];
  // Rewrite positions 0..n so gaps or duplicates never build up.
  for (let k = 0; k < rows.length; k++) await db.update(table).set({ position: k }).where(eq(table.id, rows[k].id));
}

async function nextPosition(table: Positioned) {
  const [{ m }] = await db.select({ m: max(table.position) }).from(table);
  return (m ?? -1) + 1;
}

/* ───────────── FAQs ───────────── */

export async function saveFaq(_p: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await guard("content");
  const id = str(fd, "id");
  const question = str(fd, "question");
  const answer = str(fd, "answer");
  if (question.length < 5 || answer.length < 5) return { ok: false, message: "Write both the question and the answer." };
  const values = { question, answer, published: bool(fd, "published"), showOnHome: bool(fd, "showOnHome") };
  if (id) await db.update(schema.faqs).set(values).where(eq(schema.faqs.id, id));
  else await db.insert(schema.faqs).values({ ...values, position: await nextPosition(schema.faqs) });
  await audit(admin.id, id ? "update" : "create", "faq", id || null);
  updateTag("faqs");
  refresh();
  return { ok: true, message: id ? "Saved." : "FAQ added." };
}

export async function deleteFaq(fd: FormData) {
  const admin = await guard("content");
  await db.delete(schema.faqs).where(eq(schema.faqs.id, str(fd, "id")));
  await audit(admin.id, "delete", "faq", str(fd, "id"));
  updateTag("faqs");
  refresh();
}

export async function moveFaq(fd: FormData) {
  await guard("content");
  await move(schema.faqs, str(fd, "id"), str(fd, "dir"));
  updateTag("faqs");
  refresh();
}

/* ───────────── Advisory board ───────────── */

export async function saveBoardMember(_p: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await guard("content");
  const id = str(fd, "id");
  const name = str(fd, "name");
  const affiliation = str(fd, "affiliation");
  if (name.length < 3 || affiliation.length < 3) return { ok: false, message: "Add the name and the institution." };
  try {
    const photo = await imageFromForm(fd, "photo", admin.id, 400);
    if (id) await db.update(schema.boardMembers).set({ name, affiliation, photo }).where(eq(schema.boardMembers.id, id));
    else await db.insert(schema.boardMembers).values({ name, affiliation, photo, position: await nextPosition(schema.boardMembers) });
    await audit(admin.id, id ? "update" : "create", "board_member", id || null, { name });
    updateTag("board");
    refresh();
    return { ok: true, message: id ? "Saved." : "Board member added." };
  } catch (e) {
    return { ok: false, message: errMsg(e) };
  }
}

export async function deleteBoardMember(fd: FormData) {
  const admin = await guard("content");
  await db.delete(schema.boardMembers).where(eq(schema.boardMembers.id, str(fd, "id")));
  await audit(admin.id, "delete", "board_member", str(fd, "id"));
  updateTag("board");
  refresh();
}

export async function moveBoardMember(fd: FormData) {
  await guard("content");
  await move(schema.boardMembers, str(fd, "id"), str(fd, "dir"));
  updateTag("board");
  refresh();
}

/* ───────────── Homepage carousel ───────────── */

export async function saveSlide(_p: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await guard("content");
  const id = str(fd, "id");
  const title = str(fd, "title");
  if (title.length < 2) return { ok: false, message: "Add a title for the card." };
  const href = str(fd, "href");
  if (href && !href.startsWith("/") && !/^https?:\/\//.test(href)) return { ok: false, message: "Links must start with / (a page on this site) or https://" };
  try {
    // Carousel cards are portrait and small on screen, so 900px wide is plenty.
    const image = await imageFromForm(fd, "image", admin.id, 900);
    if (!image) return { ok: false, message: "Every carousel card needs an image." };
    const values = { title, caption: str(fd, "caption") || null, href: href || null, image, published: bool(fd, "published") };
    if (id) await db.update(schema.homeSlides).set(values).where(eq(schema.homeSlides.id, id));
    else await db.insert(schema.homeSlides).values({ ...values, position: await nextPosition(schema.homeSlides) });
    await audit(admin.id, id ? "update" : "create", "slide", id || null, { title });
    updateTag("slides");
    refresh();
    return { ok: true, message: id ? "Saved." : "Card added to the carousel." };
  } catch (e) {
    return { ok: false, message: errMsg(e) };
  }
}

export async function deleteSlide(fd: FormData) {
  const admin = await guard("content");
  await db.delete(schema.homeSlides).where(eq(schema.homeSlides.id, str(fd, "id")));
  await audit(admin.id, "delete", "slide", str(fd, "id"));
  updateTag("slides");
  refresh();
}

export async function moveSlide(fd: FormData) {
  await guard("content");
  await move(schema.homeSlides, str(fd, "id"), str(fd, "dir"));
  updateTag("slides");
  refresh();
}

/**
 * Replaces every card in the homepage carousel with the recommended set: one
 * card for each main part of the website (services, webinars, courses,
 * publishing, institutions, individuals). Useful after the site structure
 * changes, and everything can still be edited by hand afterwards.
 */
export async function resetSlides(fd: FormData) {
  const admin = await guard("content");
  void fd;
  await db.delete(schema.homeSlides);
  await db.insert(schema.homeSlides).values(
    homeHighlights.map((h, i) => ({ title: h.title, caption: h.caption, href: h.href, image: h.image, position: i })),
  );
  await audit(admin.id, "reset", "home_slides", null, { count: homeHighlights.length });
  updateTag("slides");
  refresh();
}
