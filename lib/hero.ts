// The garlands chosen for the home page hero picture, and the pure logic that fills empty slots.
// Safe to import anywhere, including from client components, since it has no side effects.

export const MAX_HERO = 3;

export type HeroSettings = {
  /** Garland ids, in the order they should appear: the first is the large photo, the rest are the round ones. */
  productIds: string[];
};

export const DEFAULT_HERO: HeroSettings = { productIds: [] };

/**
 * Builds the final list of up to MAX_HERO garlands for the hero picture: the chosen ones first, in the chosen
 * order, then any empty slots filled with the newest Featured garlands, and if that is still not enough, the
 * newest garlands of any kind. A garland with no photo is skipped. `all` must already be newest first.
 * Shared by the home page and the admin preview, so the two can never show something different.
 */
export function pickHeroCandidates<T extends { id: string; featured: boolean; hasPhoto: boolean }>(
  chosenIds: readonly string[],
  all: readonly T[],
): T[] {
  const byId = new Map(all.map((p) => [p.id, p]));
  const chosen = chosenIds.map((id) => byId.get(id)).filter((p): p is T => Boolean(p?.hasPhoto));
  const chosenSet = new Set(chosen.map((p) => p.id));
  const rest = all.filter((p) => p.hasPhoto && !chosenSet.has(p.id));
  const featuredRest = rest.filter((p) => p.featured);
  const otherRest = rest.filter((p) => !p.featured);
  return [...chosen, ...featuredRest, ...otherRest].slice(0, MAX_HERO);
}
