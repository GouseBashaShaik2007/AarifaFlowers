import {
  Poppins,
  Playfair_Display,
  Noto_Sans_Devanagari,
  Noto_Sans_Telugu,
  Noto_Nastaliq_Urdu,
} from "next/font/google";

export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const deva = Noto_Sans_Devanagari({
  subsets: ["devanagari", "latin"],
  variable: "--font-deva",
  display: "swap",
});

export const telugu = Noto_Sans_Telugu({
  subsets: ["telugu", "latin"],
  variable: "--font-telugu",
  display: "swap",
});

export const urdu = Noto_Nastaliq_Urdu({
  subsets: ["arabic", "latin"],
  variable: "--font-urdu",
  display: "swap",
});
