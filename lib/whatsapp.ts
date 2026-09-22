import type { Product } from "./catalog";
import { tr } from "./catalog";
import { dateLines, type DateStatus } from "./orderRules";

export const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919505840425").replace(/\D/g, "");
/** The number as people read it, for example "+91 95058 40425". Always follows NEXT_PUBLIC_WHATSAPP_NUMBER. */
export const WHATSAPP_DISPLAY =
  WHATSAPP_NUMBER.length === 12 && WHATSAPP_NUMBER.startsWith("91")
    ? `+91 ${WHATSAPP_NUMBER.slice(2, 7)} ${WHATSAPP_NUMBER.slice(7)}`
    : `+${WHATSAPP_NUMBER}`;
export const BUSINESS_NAME = "Aarifa Flowers";

// The live address. It is baked in at build time, so a default here keeps the link in every order message correct.
/** The live address of the site, without a closing slash. Used in messages and in the facts given to search engines. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://aarifaflowers.store").replace(/\/$/, "");

export function formatPrice(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

/** "₹1,499 – ₹2,499" when there is a highest price, otherwise just the starting price. */
export function formatPriceRange(min: number, max?: number): string {
  return max && max > min ? `${formatPrice(min)} – ${formatPrice(max)}` : formatPrice(min);
}

export function waLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/**
 * The message is always English so the shop owner reads the same format every time.
 * When the visitor picked an event date it is added, with a note if the date is closer than our notice time.
 */
export function productMessage(p: Product, date?: { ymd: string; status: DateStatus | null }): string {
  const length = tr(p.length, "en");
  const lines = [
    `Hi ${BUSINESS_NAME},`,
    "",
    "I want to order this garland:",
    "",
    `Product: ${tr(p.name, "en")}`,
    p.maxPrice && p.maxPrice > p.price
      ? `Price Range: ${formatPrice(p.price)} to ${formatPrice(p.maxPrice)}`
      : `Starting Price: ${formatPrice(p.price)}`,
  ];
  if (length) lines.push(`Length: ${length}`);
  if (date) lines.push(...dateLines(date.ymd, date.status));
  if (SITE_URL) lines.push(`Link: ${SITE_URL}/en/garlands/${p.id}`);
  lines.push("", "Please share final price, availability and delivery details.");
  return lines.join("\n");
}

/** Several saved garlands in one message. */
export function savedMessage(products: Product[]): string {
  const lines = [`Hi ${BUSINESS_NAME},`, "", "I am interested in these garlands:", ""];
  products.forEach((p, i) => {
    const price =
      p.maxPrice && p.maxPrice > p.price ? `${formatPrice(p.price)} to ${formatPrice(p.maxPrice)}` : `from ${formatPrice(p.price)}`;
    lines.push(`${i + 1}. ${tr(p.name, "en")} (${price})`);
    if (SITE_URL) lines.push(`   ${SITE_URL}/en/garlands/${p.id}`);
  });
  lines.push("", "Please share final price, availability and delivery details.");
  return lines.join("\n");
}

export const generalMessage = `Hi ${BUSINESS_NAME},\n\nI would like to know more about your garlands.`;

export const customMessage = `Hi ${BUSINESS_NAME},\n\nI want a custom garland design. I will send a reference photo.\n\nPlease share the price and delivery details.`;
