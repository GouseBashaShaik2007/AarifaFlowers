// The questions and answers in the FAQ section. Safe to import anywhere.

import { tr, type Lang, type Text } from "./catalog";

export type FaqItem = {
  id: string;
  question: Text;
  answer: Text;
};

export type FaqSettings = {
  /** Whether the section shows at all. On by default. Switching it off keeps the questions for later. */
  enabled: boolean;
  items: FaqItem[];
};

/**
 * The questions and answers written out for search engines, which can show them straight in the results.
 * Only what is really on the page goes in, in the language being read. Null when nothing is filled in.
 */
export function faqFacts(items: FaqItem[], lang: Lang) {
  const shown = items.filter((i) => tr(i.question, lang) && tr(i.answer, lang));
  if (shown.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: shown.map((i) => ({
      "@type": "Question",
      name: tr(i.question, lang),
      acceptedAnswer: { "@type": "Answer", text: tr(i.answer, lang) },
    })),
  };
}

export const MAX_FAQ = 12;
export const MAX_QUESTION = 200;
export const MAX_ANSWER = 800;

/**
 * Suggested wording, used until the owner saves their own.
 * The notice times, deposit, payment and cancellation rules come from the shop owner.
 */
export const DEFAULT_FAQ: FaqSettings = {
  enabled: true,
  items: [
    {
      id: "fresh",
      question: {
        en: "How long do the flowers stay fresh after delivery?",
        hi: "डिलीवरी के बाद फूल कितनी देर तक ताज़ा रहते हैं?",
        te: "డెలివరీ తర్వాత పువ్వులు ఎంతసేపు తాజాగా ఉంటాయి?",
        ur: "ڈیلیوری کے بعد پھول کتنی دیر تازہ رہتے ہیں؟",
      },
      answer: {
        en: "Our handmade garlands are crafted fresh on the day of delivery and stay fresh for 12 to 24 hours when kept in a cool place or in the refrigerator.",
        hi: "हमारी हस्तनिर्मित मालाएँ डिलीवरी वाले दिन ही ताज़ा बनाई जाती हैं और ठंडी जगह या फ्रिज में रखने पर 12 से 24 घंटे तक ताज़ा रहती हैं।",
        te: "మా చేతితో చేసిన హారాలు డెలివరీ రోజునే తాజాగా తయారు చేయబడతాయి. చల్లని చోట లేదా ఫ్రిజ్‌లో ఉంచితే 12 నుండి 24 గంటల వరకు తాజాగా ఉంటాయి.",
        ur: "ہمارے ہاتھ سے بنے ہار ڈیلیوری والے دن ہی تازہ تیار کیے جاتے ہیں اور ٹھنڈی جگہ یا فریج میں رکھنے پر 12 سے 24 گھنٹے تک تازہ رہتے ہیں۔",
      },
    },
    {
      id: "notice",
      question: {
        en: "How far in advance should I place an order?",
        hi: "ऑर्डर कितने दिन पहले देना चाहिए?",
        te: "ఆర్డర్ ఎన్ని రోజుల ముందు ఇవ్వాలి?",
        ur: "آرڈر کتنے دن پہلے دینا چاہیے؟",
      },
      answer: {
        en: "Please order 2 days ahead for weddings, custom designs, car decoration and stage setups, and 1 day (24 hours) ahead for pooja and event garlands. Same-day orders depend on flower availability. Please WhatsApp us directly to confirm, and order before 2 PM.",
        hi: "शादी, कस्टम डिज़ाइन, कार सजावट और स्टेज सजावट के लिए 2 दिन पहले, और पूजा व कार्यक्रम की मालाओं के लिए 1 दिन (24 घंटे) पहले ऑर्डर करें। उसी दिन के ऑर्डर फूलों की उपलब्धता पर निर्भर करते हैं। पुष्टि के लिए सीधे WhatsApp पर संपर्क करें और दोपहर 2 बजे से पहले ऑर्डर दें।",
        te: "పెళ్లిళ్లు, కస్టమ్ డిజైన్లు, కారు అలంకరణ, స్టేజ్ అలంకరణకు 2 రోజుల ముందు; పూజ, వేడుకల హారాలకు 1 రోజు (24 గంటల) ముందు ఆర్డర్ చేయండి. అదే రోజు ఆర్డర్లు పువ్వుల లభ్యతపై ఆధారపడి ఉంటాయి. నిర్ధారణ కోసం నేరుగా WhatsApp లో సంప్రదించండి, మధ్యాహ్నం 2 లోపు ఆర్డర్ ఇవ్వండి.",
        ur: "شادی، کسٹم ڈیزائن، کار کی سجاوٹ اور اسٹیج کے لیے 2 دن پہلے، اور پوجا اور تقریبات کے ہاروں کے لیے 1 دن (24 گھنٹے) پہلے آرڈر کریں۔ اسی دن کے آرڈر پھولوں کی دستیابی پر منحصر ہیں۔ تصدیق کے لیے براہِ راست واٹس ایپ پر رابطہ کریں اور دوپہر 2 بجے سے پہلے آرڈر دیں۔",
      },
    },
    {
      id: "delivery",
      question: {
        en: "What are the delivery charges for nearby areas?",
        hi: "पास के इलाकों में डिलीवरी शुल्क क्या है?",
        te: "దగ్గరి ప్రాంతాలకు డెలివరీ ఛార్జీలు ఎంత?",
        ur: "قریبی علاقوں کے لیے ڈیلیوری چارجز کیا ہیں؟",
      },
      answer: {
        en: "Delivery charges depend on your exact location and the distance to your venue. We share the exact delivery fee with you on WhatsApp before confirming your order.",
        hi: "डिलीवरी शुल्क आपके सही स्थान और कार्यक्रम स्थल की दूरी पर निर्भर करता है। ऑर्डर पक्का करने से पहले हम WhatsApp पर सही डिलीवरी शुल्क बता देते हैं।",
        te: "డెలివరీ ఛార్జీ మీ ఖచ్చితమైన ప్రాంతం, వేదికకు ఉన్న దూరంపై ఆధారపడి ఉంటుంది. ఆర్డర్ నిర్ధారించే ముందు ఖచ్చితమైన డెలివరీ ఛార్జీని WhatsApp లో తెలియజేస్తాము.",
        ur: "ڈیلیوری چارجز آپ کے درست مقام اور تقریب کی جگہ کے فاصلے پر منحصر ہیں۔ آرڈر پکا کرنے سے پہلے ہم واٹس ایپ پر درست ڈیلیوری فیس بتا دیتے ہیں۔",
      },
    },
    {
      id: "advance",
      question: {
        en: "Is advance payment required?",
        hi: "क्या अग्रिम भुगतान ज़रूरी है?",
        te: "ముందస్తు చెల్లింపు అవసరమా?",
        ur: "کیا پیشگی ادائیگی ضروری ہے؟",
      },
      answer: {
        en: "Yes. We take a 50% advance for weddings, custom designs and stage setups to reserve the flowers and lock in your date.",
        hi: "हाँ। फूल आरक्षित करने और आपकी तारीख पक्की करने के लिए शादी, कस्टम डिज़ाइन और स्टेज सजावट पर हम 50% अग्रिम राशि लेते हैं।",
        te: "అవును. పువ్వులను రిజర్వ్ చేసి మీ తేదీని ఖాయం చేయడానికి పెళ్లిళ్లు, కస్టమ్ డిజైన్లు, స్టేజ్ అలంకరణకు 50% అడ్వాన్స్ తీసుకుంటాము.",
        ur: "جی ہاں۔ پھول محفوظ کرنے اور آپ کی تاریخ پکی کرنے کے لیے شادی، کسٹم ڈیزائن اور اسٹیج کی سجاوٹ پر ہم 50% پیشگی رقم لیتے ہیں۔",
      },
    },
    {
      id: "payment",
      question: {
        en: "What payment methods do you accept?",
        hi: "आप कौन से भुगतान तरीके स्वीकार करते हैं?",
        te: "మీరు ఏ చెల్లింపు పద్ధతులు స్వీకరిస్తారు?",
        ur: "آپ کون سے ادائیگی کے طریقے قبول کرتے ہیں؟",
      },
      answer: {
        en: "We accept UPI (Google Pay, PhonePe, Paytm) and bank transfer.",
        hi: "हम UPI (Google Pay, PhonePe, Paytm) और बैंक ट्रांसफ़र स्वीकार करते हैं।",
        te: "మేము UPI (Google Pay, PhonePe, Paytm), బ్యాంక్ ట్రాన్స్‌ఫర్ స్వీకరిస్తాము.",
        ur: "ہم UPI (گوگل پے، فون پے، پے ٹی ایم) اور بینک ٹرانسفر قبول کرتے ہیں۔",
      },
    },
    {
      id: "cancel",
      question: {
        en: "What is your cancellation policy?",
        hi: "आपकी रद्द करने की नीति क्या है?",
        te: "మీ రద్దు విధానం ఏమిటి?",
        ur: "آپ کی منسوخی کی پالیسی کیا ہے؟",
      },
      answer: {
        en: "Orders cancelled at least 24 hours before delivery get a full refund. Same-day cancellations cannot be refunded because the fresh flowers are already sourced and prepared.",
        hi: "डिलीवरी से कम से कम 24 घंटे पहले रद्द किए गए ऑर्डर पर पूरा पैसा वापस मिलता है। उसी दिन रद्द करने पर पैसे वापस नहीं हो सकते, क्योंकि ताज़े फूल पहले ही मँगवाकर तैयार किए जा चुके होते हैं।",
        te: "డెలివరీకి కనీసం 24 గంటల ముందు రద్దు చేసిన ఆర్డర్లకు పూర్తి రీఫండ్ ఇస్తాము. అదే రోజు రద్దు చేస్తే రీఫండ్ ఇవ్వలేము, ఎందుకంటే తాజా పువ్వులు ఇప్పటికే తెప్పించి సిద్ధం చేయబడతాయి.",
        ur: "ڈیلیوری سے کم از کم 24 گھنٹے پہلے منسوخ کیے گئے آرڈر پر پوری رقم واپس ملتی ہے۔ اسی دن منسوخی پر رقم واپس نہیں ہو سکتی کیونکہ تازہ پھول پہلے ہی منگوا کر تیار کیے جا چکے ہوتے ہیں۔",
      },
    },
  ],
};
