// Reads and saves the shop announcements and customer reviews.
// Server only. Never import this file from a client component.

import { cache } from "react";
import { DEFAULT_SETTINGS, type Review, type SiteSettings } from "./content";
import { DEFAULT_FAQ, type FaqSettings } from "./faq";
import { DEFAULT_HERO, type HeroSettings } from "./hero";
import { DEFAULT_INSTAGRAM, isPlayerMode, type InstagramSettings } from "./instagram";
import { readDoc, readDocs, writeDoc } from "./store";

const SETTINGS_KEY = "site";
const REVIEWS_KEY = "reviews";
const INSTAGRAM_KEY = "instagram";
const FAQ_KEY = "faq";
const HERO_KEY = "hero";

/**
 * Every saved document a public page can need, fetched with one request and shared by everything that asks
 * during the same page view. Without this each getter below made its own trip to the database.
 */
const loadDocs = cache(() => readDocs([SETTINGS_KEY, REVIEWS_KEY, INSTAGRAM_KEY, FAQ_KEY, HERO_KEY]));

/**
 * The saved texts, or the suggested wording for anything the owner has not saved yet.
 * A saved empty text stays empty, which is how the owner hides the announcement bar.
 * Read once per request, however many components ask for it.
 */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const saved = (await loadDocs())[SETTINGS_KEY] as Partial<SiteSettings> | undefined;
  return {
    announcementEnabled: saved?.announcementEnabled ?? DEFAULT_SETTINGS.announcementEnabled,
    announcementFrom: saved?.announcementFrom,
    announcementUntil: saved?.announcementUntil,
    announcement: saved?.announcement ?? DEFAULT_SETTINGS.announcement,
    delivery: saved?.delivery ?? DEFAULT_SETTINGS.delivery,
    leadTime: saved?.leadTime ?? DEFAULT_SETTINGS.leadTime,
  };
});

export async function saveSiteSettings(settings: SiteSettings): Promise<void> {
  await writeDoc(SETTINGS_KEY, settings);
}

/** Newest first. */
export async function listReviews(): Promise<Review[]> {
  const list = (await readDoc<Review[]>(REVIEWS_KEY)) ?? [];
  return [...list].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export const getPublishedReviews = cache(async (): Promise<Review[]> => {
  const list = ((await loadDocs())[REVIEWS_KEY] as Review[] | undefined) ?? [];
  return list.filter((r) => r.published).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
});

export async function getReview(id: string): Promise<Review | null> {
  return (await listReviews()).find((r) => r.id === id) ?? null;
}

export async function saveReview(review: Review): Promise<void> {
  const list = await listReviews();
  const i = list.findIndex((r) => r.id === review.id);
  if (i >= 0) list[i] = review;
  else list.push(review);
  await writeDoc(REVIEWS_KEY, list);
}

export async function deleteReview(id: string): Promise<void> {
  await writeDoc(
    REVIEWS_KEY,
    (await listReviews()).filter((r) => r.id !== id),
  );
}

/** The saved Instagram settings, or the starter cards until the owner saves their own. */
export const getInstagramSettings = cache(async (): Promise<InstagramSettings> => {
  const saved = (await loadDocs())[INSTAGRAM_KEY] as Partial<InstagramSettings> | undefined;
  return {
    enabled: saved?.enabled ?? DEFAULT_INSTAGRAM.enabled,
    handle: saved?.handle || DEFAULT_INSTAGRAM.handle,
    mode: isPlayerMode(saved?.mode) ? saved.mode : DEFAULT_INSTAGRAM.mode,
    reels: Array.isArray(saved?.reels) ? saved.reels : DEFAULT_INSTAGRAM.reels,
  };
});

/** The saved FAQ, or the suggested questions until the owner saves their own. */
export const getFaq = cache(async (): Promise<FaqSettings> => {
  const saved = (await loadDocs())[FAQ_KEY] as Partial<FaqSettings> | undefined;
  return {
    enabled: saved?.enabled ?? DEFAULT_FAQ.enabled,
    items: Array.isArray(saved?.items) ? saved.items : DEFAULT_FAQ.items,
  };
});

export async function hasSavedFaq(): Promise<boolean> {
  return (await readDoc<unknown>(FAQ_KEY)) !== null;
}

export async function saveFaq(settings: FaqSettings): Promise<void> {
  await writeDoc(FAQ_KEY, settings);
}

export async function hasSavedInstagramSettings(): Promise<boolean> {
  return (await readDoc<unknown>(INSTAGRAM_KEY)) !== null;
}

export async function saveInstagramSettings(settings: InstagramSettings): Promise<void> {
  await writeDoc(INSTAGRAM_KEY, settings);
}

/** The garlands chosen for the home page hero. Empty until the owner picks any, which is how the automatic fallback stays active. */
export const getHeroSettings = cache(async (): Promise<HeroSettings> => {
  const saved = (await loadDocs())[HERO_KEY] as Partial<HeroSettings> | undefined;
  return {
    productIds: Array.isArray(saved?.productIds) ? saved.productIds.filter((v): v is string => typeof v === "string") : DEFAULT_HERO.productIds,
  };
});

export async function saveHeroSettings(settings: HeroSettings): Promise<void> {
  await writeDoc(HERO_KEY, settings);
}
