import {
  Poppins,
  Playfair_Display,
  Noto_Sans_Devanagari,
  Noto_Sans_Telugu,
  Noto_Nastaliq_Urdu,
} from "next/font/google";

// Poppins and Playfair are on every page, so they are fetched with the page. The 400, 500 and 600 weights are
// the only ones the site uses. Poppins also draws the English words, numbers and prices inside Hindi, Telugu
// and Urdu pages.
export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-poppins",
  display: "swap",
});

export const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

// The three fonts below are big (120 to 230 KB each) and each is only for its own language. With preload switched
// off, a visitor's phone fetches one only when a page in that language actually shows its letters. Before this, every
// English visitor downloaded all three for nothing. Each keeps only its own script, because Poppins covers the rest.
export const deva = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-deva",
  display: "swap",
  preload: false,
});

export const telugu = Noto_Sans_Telugu({
  subsets: ["telugu"],
  variable: "--font-telugu",
  display: "swap",
  preload: false,
});

export const urdu = Noto_Nastaliq_Urdu({
  subsets: ["arabic"],
  variable: "--font-urdu",
  display: "swap",
  preload: false,
});
