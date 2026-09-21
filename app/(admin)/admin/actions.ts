"use server";

import { redirect } from "next/navigation";
import { endSession, isAdmin, loginConfigured, passwordMatches, startSession } from "@/lib/auth";
import {
  FLOWER_IDS,
  LANGS,
  OCCASION_IDS,
  TYPE_IDS,
  type FlowerId,
  type OccasionId,
  type Product,
  type Text,
  type TypeId,
} from "@/lib/catalog";
import type { Review } from "@/lib/content";
import { cleanHandle, isPlayerMode, MAX_REELS, normalizeReelUrl, type PlayerMode, type Reel } from "@/lib/instagram";
import {
  deleteReview,
  getInstagramSettings,
  getReview,
  saveInstagramSettings,
  saveReview,
  saveSiteSettings,
} from "@/lib/siteContent";
import {
  deleteProduct,
  deleteProducts,
  getProduct,
  listProducts,
  loadSampleProducts,
  removeImage,
  saveProduct,
  saveProducts,
} from "@/lib/store";

/** A photo address we accept: one of ours, an https address, or a local test address. */
function goodPhotoAddress(u: unknown): boolean {
  return (
    typeof u === "string" &&
    u.length < 600 &&
    (u.startsWith("/") || u.startsWith("https://") || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(u))
  );
}

export type ActionResult = { ok: true; id?: string; count?: number; ids?: string[] } | { ok: false; error: string };

async function guard(): Promise<ActionResult | null> {
  return (await isAdmin()) ? null : { ok: false, error: "Please log in again." };
}

// ---------- login ----------

export async function loginAction(_prev: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  if (!loginConfigured()) {
    return { error: "The admin password is not set. Add ADMIN_PASSWORD in the environment settings." };
  }
  const password = String(formData.get("password") ?? "");
  if (!passwordMatches(password)) {
    // A short pause makes guessing passwords slow.
    await new Promise((r) => setTimeout(r, 800));
    return { error: "That password is not correct." };
  }
  await startSession();
  redirect("/admin");
}

export async function logoutAction() {
  await endSession();
  redirect("/admin/login");
}

// ---------- products ----------

export type ProductInput = {
  id?: string;
  name: Text;
  description: Text;
  price: number;
  /** Optional highest price. Empty or null means the garland only has a starting price. */
  maxPrice?: number | null;
  occasions: string[];
  types: string[];
  flowers: string[];
  images: string[];
  available: boolean;
  featured: boolean;
};

function cleanText(input: Text, max: number): Text {
  const out: Text = {};
  for (const l of LANGS) {
    const v = (input?.[l] ?? "").toString().trim().slice(0, max);
    if (v) out[l] = v;
  }
  return out;
}

function pick<T extends string>(values: string[], allowed: readonly T[]): T[] {
  return allowed.filter((a) => values.includes(a));
}

function slugify(s: string): string {
  const base = s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${base || "garland"}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function saveProductAction(input: ProductInput): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;

  try {
    const name = cleanText(input.name, 120);
    if (!name.en) return { ok: false, error: "Please enter the English name." };

    const price = Math.round(Number(input.price));
    if (!Number.isFinite(price) || price < 0 || price > 10_000_000) {
      return { ok: false, error: "Please enter a valid starting price." };
    }

    let maxPrice: number | undefined;
    if (input.maxPrice !== null && input.maxPrice !== undefined && String(input.maxPrice) !== "") {
      maxPrice = Math.round(Number(input.maxPrice));
      if (!Number.isFinite(maxPrice) || maxPrice <= price || maxPrice > 10_000_000) {
        return { ok: false, error: "The highest price must be more than the starting price." };
      }
    }

    // A photo address that is not accepted must be reported, never dropped without a word.
    const goodAddress = goodPhotoAddress;
    const submitted = input.images ?? [];
    if (!submitted.every(goodAddress)) {
      return {
        ok: false,
        error: "One of the photos has an address that is not allowed, so nothing was saved. Remove that photo and add it again.",
      };
    }
    const images = submitted.slice(0, 10);

    const existing = input.id ? await getProduct(input.id) : null;
    const now = new Date().toISOString();

    const product: Product = {
      id: existing?.id ?? slugify(name.en),
      name,
      description: cleanText(input.description, 1200),
      price,
      ...(maxPrice !== undefined ? { maxPrice } : {}),
      occasions: pick<OccasionId>(input.occasions ?? [], OCCASION_IDS),
      types: pick<TypeId>(input.types ?? [], TYPE_IDS),
      flowers: pick<FlowerId>(input.flowers ?? [], FLOWER_IDS),
      images,
      available: Boolean(input.available),
      featured: Boolean(input.featured),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    await saveProduct(product);

    // Delete photos that were taken off this product.
    if (existing) {
      for (const old of existing.images) {
        if (!images.includes(old)) await removeImage(old);
      }
    }
    return { ok: true, id: product.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not save." };
  }
}

export async function deleteProductAction(id: string): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;
  try {
    const existing = await getProduct(id);
    await deleteProduct(id);
    if (existing) for (const url of existing.images) await removeImage(url);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not delete." };
  }
}

export async function toggleProductAction(id: string, field: "available" | "featured"): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;
  try {
    const p = await getProduct(id);
    if (!p) return { ok: false, error: "Product not found." };
    await saveProduct({ ...p, [field]: !p[field], updatedAt: new Date().toISOString() });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not update." };
  }
}

export async function loadSamplesAction(): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;
  try {
    await loadSampleProducts();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not add sample products." };
  }
}

// ---------- bulk actions ----------

const MAX_BULK = 200;

function cleanIds(ids: unknown): string[] {
  return Array.isArray(ids)
    ? Array.from(new Set(ids.filter((i): i is string => typeof i === "string" && i.length > 0 && i.length < 100))).slice(0, MAX_BULK)
    : [];
}

/** Sets Fresh Today and/or Featured on many garlands at once, with a single save. */
export async function bulkUpdateAction(
  ids: string[],
  patch: { available?: boolean; featured?: boolean },
): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;
  const wanted = new Set(cleanIds(ids));
  if (wanted.size === 0) return { ok: false, error: "Nothing is selected." };
  if (typeof patch.available !== "boolean" && typeof patch.featured !== "boolean") {
    return { ok: false, error: "Nothing to change." };
  }
  try {
    const now = new Date().toISOString();
    const changed = (await listProducts())
      .filter((p) => wanted.has(p.id))
      .map((p) => ({
        ...p,
        available: typeof patch.available === "boolean" ? patch.available : p.available,
        featured: typeof patch.featured === "boolean" ? patch.featured : p.featured,
        updatedAt: now,
      }));
    await saveProducts(changed);
    return { ok: true, count: changed.length };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not update." };
  }
}

export async function bulkDeleteAction(ids: string[]): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;
  const wanted = new Set(cleanIds(ids));
  if (wanted.size === 0) return { ok: false, error: "Nothing is selected." };
  try {
    const existing = (await listProducts()).filter((p) => wanted.has(p.id));
    await deleteProducts(existing.map((p) => p.id));
    for (const p of existing) for (const url of p.images) await removeImage(url);
    return { ok: true, count: existing.length };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not delete." };
  }
}

/**
 * The morning reset. Turns Fresh Today on for every garland that is off.
 * Returns the ids it changed, so the admin can undo it.
 */
export async function markAllFreshAction(): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;
  try {
    const now = new Date().toISOString();
    const off = (await listProducts()).filter((p) => !p.available);
    await saveProducts(off.map((p) => ({ ...p, available: true, updatedAt: now })));
    return { ok: true, count: off.length, ids: off.map((p) => p.id) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not update." };
  }
}

// ---------- announcements ----------

export async function saveSettingsAction(input: {
  announcementEnabled: boolean;
  announcement: Text;
  delivery: Text;
  leadTime: Text;
}): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;
  try {
    await saveSiteSettings({
      announcementEnabled: input.announcementEnabled !== false,
      announcement: cleanText(input.announcement, 220),
      delivery: cleanText(input.delivery, 500),
      leadTime: cleanText(input.leadTime, 320),
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not save." };
  }
}

// ---------- customer stories ----------

export type ReviewInput = {
  id?: string;
  name: string;
  event: string;
  text: string;
  rating: number;
  photo?: string | null;
  published: boolean;
};

export async function saveReviewAction(input: ReviewInput): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;
  try {
    const name = String(input.name ?? "").trim().slice(0, 80);
    const text = String(input.text ?? "").trim().slice(0, 600);
    const event = String(input.event ?? "").trim().slice(0, 80);
    const rating = Math.round(Number(input.rating));
    if (!name) return { ok: false, error: "Please enter the customer name." };
    if (!text) return { ok: false, error: "Please enter what the customer said." };
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) return { ok: false, error: "Please choose 1 to 5 stars." };
    const photo = input.photo ? String(input.photo) : undefined;
    if (photo && !goodPhotoAddress(photo)) {
      return { ok: false, error: "The photo address is not allowed, so nothing was saved. Remove the photo and add it again." };
    }

    const existing = input.id ? await getReview(input.id) : null;
    const now = new Date().toISOString();
    const review: Review = {
      id: existing?.id ?? slugify(name),
      name,
      event,
      text,
      rating,
      ...(photo ? { photo } : {}),
      published: Boolean(input.published),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    await saveReview(review);
    if (existing?.photo && existing.photo !== photo) await removeImage(existing.photo);
    return { ok: true, id: review.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not save." };
  }
}

export async function deleteReviewAction(id: string): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;
  try {
    const existing = await getReview(id);
    await deleteReview(id);
    if (existing?.photo) await removeImage(existing.photo);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not delete." };
  }
}

export async function setReviewPublishedAction(id: string, published: boolean): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;
  try {
    const existing = await getReview(id);
    if (!existing) return { ok: false, error: "Story not found." };
    await saveReview({ ...existing, published, updatedAt: new Date().toISOString() });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not update." };
  }
}

// ---------- Instagram reels ----------

export async function saveInstagramAction(input: {
  enabled: boolean;
  handle: string;
  mode: PlayerMode;
  reels: Reel[];
}): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;
  try {
    const handle = cleanHandle(String(input.handle ?? ""));
    if (!handle) {
      return { ok: false, error: "Please enter your Instagram name, for example aarifashaik31. Use letters, numbers, dots and underscores only." };
    }

    const submitted = Array.isArray(input.reels) ? input.reels.slice(0, MAX_REELS) : [];
    const reels: Reel[] = [];
    for (let i = 0; i < submitted.length; i++) {
      const raw = String(submitted[i]?.url ?? "").trim();
      let url = "";
      if (raw) {
        const tidy = normalizeReelUrl(raw);
        if (!tidy) {
          return { ok: false, error: `Reel ${i + 1} does not look like an Instagram reel link. Open the reel on Instagram, tap Share, then Copy link.` };
        }
        url = tidy;
      }
      const video = submitted[i]?.video ? String(submitted[i].video) : undefined;
      if (video && !(goodPhotoAddress(video) && /\.mp4$/i.test(video))) {
        return { ok: false, error: `The video of reel ${i + 1} has an address that is not allowed. Remove it and add it again.` };
      }
      const poster = submitted[i]?.poster ? String(submitted[i].poster) : undefined;
      if (poster && !goodPhotoAddress(poster)) {
        return { ok: false, error: `The preview picture of reel ${i + 1} has an address that is not allowed. Remove it and add it again.` };
      }
      reels.push({ url, ...(poster ? { poster } : {}), ...(video ? { video } : {}) });
    }

    const before = await getInstagramSettings();
    const mode: PlayerMode = isPlayerMode(input.mode) ? input.mode : "preview";
    await saveInstagramSettings({ enabled: Boolean(input.enabled), handle, mode, reels });

    // Delete preview pictures that are no longer used.
    const kept = new Set(reels.map((r) => r.poster).filter(Boolean));
    for (const old of before.reels) if (old.poster && !kept.has(old.poster)) await removeImage(old.poster);
    const keptVideos = new Set(reels.map((r) => r.video).filter(Boolean));
    for (const old of before.reels) if (old.video && !keptVideos.has(old.video)) await removeImage(old.video);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not save." };
  }
}
