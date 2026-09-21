// Choices and the WhatsApp message for the custom garland builder. Safe to import anywhere.

import { FLOWERS, OCCASIONS, label, type Lang } from "./catalog";
import { dateLines, type DateStatus } from "./orderRules";
import { BUSINESS_NAME } from "./whatsapp";

type Choice = { id: string; label: Record<Lang, string> };

export const COLOURS = [
  { id: "red", swatch: "#d7263d", label: { en: "Red", hi: "लाल", te: "ఎరుపు", ur: "سرخ" } },
  { id: "pink", swatch: "#f48fb1", label: { en: "Pink", hi: "गुलाबी", te: "గులాబీ రంగు", ur: "گلابی" } },
  { id: "white", swatch: "#ffffff", label: { en: "White", hi: "सफ़ेद", te: "తెలుపు", ur: "سفید" } },
  { id: "yellow", swatch: "#f7c948", label: { en: "Yellow", hi: "पीला", te: "పసుపు", ur: "پیلا" } },
  { id: "orange", swatch: "#f28c28", label: { en: "Orange", hi: "नारंगी", te: "నారింజ", ur: "نارنجی" } },
  {
    id: "mixed",
    swatch: "conic-gradient(#d7263d, #f7c948, #ffffff, #f48fb1, #f28c28, #d7263d)",
    label: { en: "Mixed", hi: "मिला-जुला", te: "మిశ్రమం", ur: "ملے جلے" },
  },
] as const satisfies readonly (Choice & { swatch: string })[];

export const LENGTHS = [
  { id: "3ft", label: { en: "3 ft", hi: "3 फ़ीट", te: "3 అడుగులు", ur: "3 فٹ" } },
  { id: "4ft", label: { en: "4 ft", hi: "4 फ़ीट", te: "4 అడుగులు", ur: "4 فٹ" } },
  { id: "5ft", label: { en: "5 ft", hi: "5 फ़ीट", te: "5 అడుగులు", ur: "5 فٹ" } },
  { id: "6ft", label: { en: "6 ft", hi: "6 फ़ीट", te: "6 అడుగులు", ur: "6 فٹ" } },
  {
    id: "custom",
    label: { en: "Custom size", hi: "अपनी पसंद का साइज़", te: "కస్టమ్ సైజ్", ur: "اپنی پسند کا سائز" },
  },
] as const satisfies readonly Choice[];

export const MAX_NOTES = 400;
export const MAX_BUDGET = 10_000_000;

export type BuilderChoices = {
  occasion: string;
  flowers: string[];
  colours: string[];
  length: string;
  /** yyyy-mm-dd, or empty. */
  date: string;
  /** Rupees as typed, or empty. */
  budget: string;
  notes: string;
};

export const EMPTY_CHOICES: BuilderChoices = {
  occasion: "",
  flowers: [],
  colours: [],
  length: "",
  date: "",
  budget: "",
  notes: "",
};

/** English names for the picked ids, in the order of the lists above. */
function names(list: readonly Choice[], ids: readonly string[]): string {
  return list
    .filter((c) => ids.includes(c.id))
    .map((c) => c.label.en)
    .join(", ");
}

/** The message is always English so the shop owner reads the same format every time. */
export function builderMessage(c: BuilderChoices, dateStatus: DateStatus | null): string {
  const undecided = "Not decided, please suggest";
  const budget = Number(c.budget);
  const lines = [
    `Hi ${BUSINESS_NAME},`,
    "",
    "I would like a custom garland:",
    "",
    `Occasion: ${label(OCCASIONS, c.occasion, "en") || undecided}`,
    `Flowers: ${names(FLOWERS, c.flowers) || undecided}`,
    `Colours: ${names(COLOURS, c.colours) || undecided}`,
    `Length: ${names(LENGTHS, c.length ? [c.length] : []) || undecided}`,
  ];
  const date = dateLines(c.date, dateStatus);
  if (date.length) lines.push(...date);
  if (Number.isFinite(budget) && budget > 0) lines.push(`Budget: ₹${Math.round(budget).toLocaleString("en-IN")}`);
  if (c.notes.trim()) lines.push(`Notes: ${c.notes.trim().slice(0, MAX_NOTES)}`);
  lines.push("", "I can send a reference photo here.", "Please share the price and delivery details.");
  return lines.join("\n");
}
