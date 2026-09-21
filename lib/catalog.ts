// Fixed lists of languages, occasions, garland types and flowers.
// Labels exist in all four site languages. Edit here to rename or add options.

export const LANGS = ["en", "hi", "te", "ur"] as const;
export type Lang = (typeof LANGS)[number];

export const LANG_LABEL: Record<Lang, string> = {
  en: "English",
  hi: "हिन्दी",
  te: "తెలుగు",
  ur: "اردو",
};

export const isLang = (v: string): v is Lang => (LANGS as readonly string[]).includes(v);
export const isRtl = (lang: Lang) => lang === "ur";

/** A piece of text in each language. English is the fallback. */
export type Text = Partial<Record<Lang, string>>;

export function tr(text: Text | undefined, lang: Lang): string {
  if (!text) return "";
  return text[lang]?.trim() || text.en?.trim() || "";
}

type Option = { id: string; label: Record<Lang, string>; emoji: string };

export const OCCASIONS = [
  {
    id: "wedding",
    emoji: "💍",
    label: { en: "Wedding", hi: "शादी", te: "పెళ్లి", ur: "شادی" },
  },
  {
    id: "pooja",
    emoji: "🪔",
    label: {
      en: "Pooja & Religious",
      hi: "पूजा और धार्मिक",
      te: "పూజ & ధార్మికం",
      ur: "پوجا اور مذہبی",
    },
  },
  {
    id: "events",
    emoji: "🎉",
    label: {
      en: "Events & Parties",
      hi: "कार्यक्रम और पार्टी",
      te: "వేడుకలు & పార్టీలు",
      ur: "تقریبات اور پارٹیاں",
    },
  },
  {
    id: "special",
    emoji: "🌸",
    label: {
      en: "Special Occasions",
      hi: "विशेष अवसर",
      te: "ప్రత్యేక సందర్భాలు",
      ur: "خاص مواقع",
    },
  },
  {
    id: "custom",
    emoji: "✨",
    label: {
      en: "Custom / Designer",
      hi: "कस्टम / डिज़ाइनर",
      te: "కస్టమ్ / డిజైనర్",
      ur: "کسٹم / ڈیزائنر",
    },
  },
] as const satisfies readonly Option[];

export const TYPES = [
  { id: "varmala", emoji: "💐", label: { en: "Varmala", hi: "वरमाला", te: "వరమాల", ur: "ورمالا" } },
  {
    id: "bridal",
    emoji: "👰",
    label: { en: "Bridal Garland", hi: "दुल्हन की माला", te: "వధువు హారం", ur: "دلہن کا ہار" },
  },
  {
    id: "groom",
    emoji: "🤵",
    label: { en: "Groom Garland", hi: "दूल्हे की माला", te: "వరుడి హారం", ur: "دولہا کا ہار" },
  },
  { id: "toran", emoji: "🚪", label: { en: "Toran", hi: "तोरण", te: "తోరణం", ur: "توران" } },
  {
    id: "car",
    emoji: "🚗",
    label: { en: "Car Decoration", hi: "कार सजावट", te: "కారు అలంకరణ", ur: "کار کی سجاوٹ" },
  },
  {
    id: "stage",
    emoji: "🎭",
    label: {
      en: "Stage / Backdrop",
      hi: "स्टेज / बैकड्रॉप",
      te: "స్టేజ్ / బ్యాక్‌డ్రాప్",
      ur: "اسٹیج / بیک ڈراپ",
    },
  },
] as const satisfies readonly Option[];

export const FLOWERS = [
  { id: "rose", emoji: "🌹", label: { en: "Rose", hi: "गुलाब", te: "గులాబీ", ur: "گلاب" } },
  { id: "jasmine", emoji: "🤍", label: { en: "Jasmine", hi: "चमेली", te: "మల్లె", ur: "چنبیلی" } },
  { id: "marigold", emoji: "🏵️", label: { en: "Marigold", hi: "गेंदा", te: "బంతి", ur: "گیندا" } },
  { id: "orchid", emoji: "🪻", label: { en: "Orchid", hi: "ऑर्किड", te: "ఆర్కిడ్", ur: "آرکڈ" } },
  { id: "lotus", emoji: "🪷", label: { en: "Lotus", hi: "कमल", te: "కమలం", ur: "کنول" } },
  {
    id: "tuberose",
    emoji: "🌼",
    label: { en: "Tuberose", hi: "रजनीगंधा", te: "సుగంధరాజ", ur: "رجنی گندھا" },
  },
  {
    id: "chrysanthemum",
    emoji: "🌻",
    label: { en: "Chrysanthemum", hi: "गुलदाउदी", te: "చామంతి", ur: "گل داؤدی" },
  },
] as const satisfies readonly Option[];

export type OccasionId = (typeof OCCASIONS)[number]["id"];
export type TypeId = (typeof TYPES)[number]["id"];
export type FlowerId = (typeof FLOWERS)[number]["id"];

export const OCCASION_IDS = OCCASIONS.map((o) => o.id) as OccasionId[];
export const TYPE_IDS = TYPES.map((o) => o.id) as TypeId[];
export const FLOWER_IDS = FLOWERS.map((o) => o.id) as FlowerId[];

export function label<T extends readonly Option[]>(list: T, id: string, lang: Lang): string {
  const found = list.find((o) => o.id === id);
  return found ? found.label[lang] : id;
}

export type Product = {
  id: string;
  name: Text;
  description: Text;
  /** Starting price in rupees. */
  price: number;
  /** Optional highest price. When set, the site shows a range such as ₹1,499 – ₹2,499. */
  maxPrice?: number;
  occasions: OccasionId[];
  types: TypeId[];
  flowers: FlowerId[];
  /** Full-size image URLs. The first one is the main photo. */
  images: string[];
  /** "Fresh Today" toggle. */
  available: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Thumbnail URL for a full-size image URL. Both are written on upload. */
export const thumbOf = (url: string) => url.replace(/\.webp$/, "-t.webp");
