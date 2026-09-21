import type { Product } from "./catalog";
import { tr } from "./catalog";

export const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "917397309203").replace(/\D/g, "");
/** The number as people read it, for example "+91 73973 09203". Always follows NEXT_PUBLIC_WHATSAPP_NUMBER. */
export const WHATSAPP_DISPLAY =
  WHATSAPP_NUMBER.length === 12 && WHATSAPP_NUMBER.startsWith("91")
    ? `+91 ${WHATSAPP_NUMBER.slice(2, 7)} ${WHATSAPP_NUMBER.slice(7)}`
    : `+${WHATSAPP_NUMBER}`;
export const BUSINESS_NAME = "Aarifa Flowers";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");

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

/** The message is always English so the shop owner reads the same format every time. */
export function productMessage(p: Product): string {
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
  if (SITE_URL) lines.push(`Link: ${SITE_URL}/en/garlands/${p.id}`);
  lines.push("", "Please share final price, availability and delivery details.");
  return lines.join("\n");
}

export const generalMessage = `Hi ${BUSINESS_NAME},\n\nI would like to know more about your garlands.`;

export const customMessage = `Hi ${BUSINESS_NAME},\n\nI want a custom garland design. I will send a reference photo.\n\nPlease share the price and delivery details.`;
