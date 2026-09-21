// Shop announcements and customer reviews. Safe to import anywhere.

import type { Text } from "./catalog";

/** Texts the owner can change from the admin page, in every site language. */
export type SiteSettings = {
  /** The thin bar at the top of every page. Leave empty to hide the bar. */
  announcement: Text;
  /** Delivery rules. Shown in the footer and on each garland page. */
  delivery: Text;
  /** How much notice is needed. Shown in How it works and on each garland page. */
  leadTime: Text;
};

/**
 * Suggested wording, used until the owner saves their own.
 * It says nothing about a city on purpose. The owner adds the city in the admin page.
 */
export const DEFAULT_SETTINGS: SiteSettings = {
  announcement: {
    en: "🚚 Fresh local delivery • Order 2 days ahead for weddings and 24 hours ahead for pooja garlands",
    hi: "🚚 स्थानीय क्षेत्र में ताज़ा डिलीवरी • शादी के लिए 2 दिन पहले और पूजा की मालाओं के लिए 24 घंटे पहले ऑर्डर करें",
    te: "🚚 స్థానికంగా తాజా డెలివరీ • పెళ్లిళ్లకు 2 రోజుల ముందు, పూజ హారాలకు 24 గంటల ముందు ఆర్డర్ చేయండి",
    ur: "🚚 مقامی علاقے میں تازہ ڈیلیوری • شادی کے لیے 2 دن پہلے اور پوجا کے ہاروں کے لیے 24 گھنٹے پہلے آرڈر کریں",
  },
  delivery: {
    en: "We deliver within our city and nearby areas so the flowers stay fresh. The delivery fee depends on your location, and we confirm it with you on WhatsApp.",
    hi: "फूल ताज़ा रहें, इसलिए हम अपने शहर और आसपास के इलाकों में डिलीवरी करते हैं। डिलीवरी शुल्क आपके स्थान पर निर्भर करता है और हम WhatsApp पर उसकी पुष्टि करते हैं।",
    te: "పువ్వులు తాజాగా ఉండేందుకు మేము మా నగరంలో, చుట్టుపక్కల ప్రాంతాల్లో మాత్రమే డెలివరీ చేస్తాము. డెలివరీ ఛార్జీ మీ ప్రాంతాన్ని బట్టి ఉంటుంది, దాన్ని WhatsApp లో నిర్ధారిస్తాము.",
    ur: "پھول تازہ رہیں، اس لیے ہم اپنے شہر اور اردگرد کے علاقوں میں ڈیلیوری کرتے ہیں۔ ڈیلیوری فیس آپ کے مقام پر منحصر ہے اور ہم واٹس ایپ پر اس کی تصدیق کرتے ہیں۔",
  },
  leadTime: {
    en: "Please order 2 days ahead for weddings, large events and custom designs, and 24 hours ahead for pooja garlands.",
    hi: "शादी, बड़े कार्यक्रम और कस्टम डिज़ाइन के लिए 2 दिन पहले, और पूजा की मालाओं के लिए 24 घंटे पहले ऑर्डर करें।",
    te: "పెళ్లిళ్లు, పెద్ద వేడుకలు, కస్టమ్ డిజైన్లకు 2 రోజుల ముందు, పూజ హారాలకు 24 గంటల ముందు ఆర్డర్ చేయండి.",
    ur: "شادی، بڑی تقریبات اور کسٹم ڈیزائن کے لیے 2 دن پہلے، اور پوجا کے ہاروں کے لیے 24 گھنٹے پہلے آرڈر کریں۔",
  },
};

/** A customer story. The site shows it only while `published` is true. */
export type Review = {
  id: string;
  /** For example "Ananya S., Banjara Hills". First name and area keep customers private. */
  name: string;
  /** For example "Wedding varmala" or "Ganesh pooja". */
  event: string;
  text: string;
  /** 1 to 5 stars. */
  rating: number;
  /** Optional photo address. */
  photo?: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};
