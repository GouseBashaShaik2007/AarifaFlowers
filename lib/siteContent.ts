// Reads and saves the shop announcements and customer reviews.
// Server only. Never import this file from a client component.

import { cache } from "react";
import { DEFAULT_SETTINGS, type Review, type SiteSettings } from "./content";
import { readDoc, writeDoc } from "./store";

const SETTINGS_KEY = "site";
const REVIEWS_KEY = "reviews";

/**
 * The saved texts, or the suggested wording for anything the owner has not saved yet.
 * A saved empty text stays empty, which is how the owner hides the announcement bar.
 * Read once per request, however many components ask for it.
 */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const saved = await readDoc<Partial<SiteSettings>>(SETTINGS_KEY);
  return {
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

export const getPublishedReviews = cache(async (): Promise<Review[]> => (await listReviews()).filter((r) => r.published));

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
