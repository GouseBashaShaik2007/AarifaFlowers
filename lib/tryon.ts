// Shared by the Try On screen, the look page and the server. Safe to import anywhere.

import { isCutout, tr, type Product } from "./catalog";
import { BUSINESS_NAME, SITE_URL, formatPrice } from "./whatsapp";

/** Garland types that make sense worn on a person. */
export const TRY_ON_TYPES = ["varmala", "bridal", "groom", "set"] as const;
/** A garland with any of these types is never offered, even when it is also a Set / Combo, such as a stage backdrop set. */
const NOT_WORN_TYPES = ["toran", "car", "stage"] as const;

/** How long a shared look is kept before it is deleted. */
export const LOOK_DAYS = 30;
/** The browser aims for this size when it saves the merged photo. */
export const TARGET_LOOK_BYTES = 300 * 1024;
/** The server refuses anything bigger than this. */
export const MAX_LOOK_BYTES = 400 * 1024;

export const LOOK_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/**
 * Try On needs a garland photo with a see-through background, otherwise a box would land on the person.
 * Uploads that were cleaned in the admin are marked as cut-outs in their file name.
 */
export function canTryOn(product: Product): boolean {
  const main = product.images[0];
  const has = (list: readonly string[]) => product.types.some((type) => list.includes(type));
  return Boolean(main) && isCutout(main) && has(TRY_ON_TYPES) && !has(NOT_WORN_TYPES);
}

export const lookAddress = (id: string) => `${SITE_URL}/en/look/${id}`;

/**
 * The WhatsApp message for an ordered look. It is always English, like the other order messages.
 * Without an id the photo could not be uploaded, so the customer is asked to attach it in the chat.
 */
export function lookMessage(product: Product, lookId?: string): string {
  const length = tr(product.length, "en");
  const lines = [
    `Hi ${BUSINESS_NAME},`,
    "",
    "I tried this garland on my photo and I want to order it:",
    "",
    `Product: ${tr(product.name, "en")}`,
    product.maxPrice && product.maxPrice > product.price
      ? `Price Range: ${formatPrice(product.price)} to ${formatPrice(product.maxPrice)}`
      : `Starting Price: ${formatPrice(product.price)}`,
  ];
  if (length) lines.push(`Length: ${length}`);
  lines.push(`Link: ${SITE_URL}/en/garlands/${product.id}`);
  lines.push(lookId ? `My look: ${lookAddress(lookId)}` : "My look: I will attach my photo in this chat.");
  lines.push("", "Please share final price, availability and delivery details.");
  return lines.join("\n");
}
