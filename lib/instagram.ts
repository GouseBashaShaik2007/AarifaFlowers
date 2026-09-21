// Instagram reels for "See Our Garlands in Action" on the home page.
//
// The owner manages the reels in the admin page (Instagram tab). The values below are only the starting
// point, used until the owner saves their own. Safe to import anywhere.

export const DEFAULT_HANDLE = "aarifashaik31";
export const MAX_REELS = 6;

export type Reel = {
  /** The reel address. Empty means no reel yet, so the card opens the Instagram page. */
  url: string;
  /** Read out loud by screen readers. Optional. */
  title?: string;
  /** Optional preview picture. */
  poster?: string;
};

export type InstagramSettings = {
  /** Whether the section shows on the home page. */
  enabled: boolean;
  /** The Instagram name without the @. */
  handle: string;
  reels: Reel[];
};

export const DEFAULT_INSTAGRAM: InstagramSettings = {
  enabled: true,
  handle: DEFAULT_HANDLE,
  reels: [
    { url: "", title: "Making a bridal garland by hand" },
    { url: "", title: "A wedding stage setup" },
    { url: "", title: "Fresh garlands for pooja" },
  ],
};

export const profileUrl = (handle: string) => `https://www.instagram.com/${handle}/`;

/** "@aarifashaik31", " aarifashaik31 " and a full profile link all become "aarifashaik31". Null if unusable. */
export function cleanHandle(input: string): string | null {
  const fromLink = /instagram\.com\/([A-Za-z0-9._]+)/i.exec(input);
  const value = (fromLink ? fromLink[1] : input).trim().replace(/^@/, "");
  return /^[A-Za-z0-9._]{1,30}$/.test(value) ? value : null;
}

/** Pulls the reel code out of a link. Returns null for an empty or unusable value. */
export function reelCode(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  const fromLink = /instagram\.com\/(?:[A-Za-z0-9_.]+\/)?(?:reels?|p|tv)\/([A-Za-z0-9_-]{5,40})/i.exec(value);
  const code = fromLink ? fromLink[1] : value;
  return /^[A-Za-z0-9_-]{5,40}$/.test(code) ? code : null;
}

/** The tidy address of a reel, or null if the value is not a reel link. */
export function normalizeReelUrl(input: string): string | null {
  const code = reelCode(input);
  return code ? reelPageUrl(code) : null;
}

/** The address of Instagram's own player for one reel. */
export const reelEmbedUrl = (code: string) => `https://www.instagram.com/reel/${code}/embed`;

/** The normal Instagram page of one reel. */
export const reelPageUrl = (code: string) => `https://www.instagram.com/reel/${code}/`;
