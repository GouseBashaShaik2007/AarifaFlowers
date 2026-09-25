// Words for the occasion pages (/en/occasions/wedding and the rest).
//
// People search for "wedding varmala" or "pooja garlands", not for "garlands", so each occasion gets a page of
// its own with a heading and a few honest sentences. Nothing here claims anything the owner has not said:
// the notice times are the ones in lib/orderRules.ts, and no city, count or rating is mentioned.

import type { OccasionId, Text } from "./catalog";

export type OccasionPage = { heading: Text; intro: Text };

export const OCCASION_PAGES: Record<OccasionId, OccasionPage> = {
  wedding: {
    heading: {
      en: "Wedding garlands, made fresh",
      hi: "शादी की मालाएँ, ताज़ी बनी हुई",
      te: "పెళ్లి హారాలు, తాజాగా తయారు",
      ur: "شادی کے ہار، تازہ تیار",
    },
    intro: {
      en: "Varmala pairs for the bride and groom, bridal garlands, toran for the entrance and car decoration for the journey. Every garland is strung by hand on the morning of your event. Wedding orders need 2 days' notice. Choose a design and we will confirm the final price, your date and the advance on WhatsApp.",
      hi: "दूल्हा-दुल्हन के लिए वरमाला जोड़ी, दुल्हन की माला, दरवाज़े के लिए तोरण और कार की सजावट। हर माला आपके कार्यक्रम की सुबह हाथ से बनाई जाती है। शादी के ऑर्डर के लिए 2 दिन का समय चाहिए। डिज़ाइन चुनें — अंतिम कीमत, तारीख़ और अग्रिम राशि हम WhatsApp पर बताएँगे।",
      te: "వధూవరులకు వరమాల జంట, వధువు హారం, గుమ్మానికి తోరణం, కారు అలంకరణ. ప్రతి హారాన్ని మీ వేడుక ఉదయమే చేతితో కడతాము. పెళ్లి ఆర్డర్లకు 2 రోజుల ముందుగా చెప్పాలి. డిజైన్ ఎంచుకోండి — తుది ధర, తేదీ, అడ్వాన్స్ గురించి WhatsApp లో తెలియజేస్తాము.",
      ur: "دولہا دلہن کے لیے ورمالا جوڑی، دلہن کا ہار، دروازے کے لیے توران اور کار کی سجاوٹ۔ ہر ہار آپ کی تقریب کی صبح ہاتھ سے بنایا جاتا ہے۔ شادی کے آرڈر کے لیے 2 دن پہلے بتانا ہوتا ہے۔ ڈیزائن چنیں — آخری قیمت، تاریخ اور پیشگی رقم ہم WhatsApp پر بتائیں گے۔",
    },
  },
  pooja: {
    heading: {
      en: "Pooja and religious garlands",
      hi: "पूजा और धार्मिक मालाएँ",
      te: "పూజ మరియు ధార్మిక హారాలు",
      ur: "پوجا اور مذہبی ہار",
    },
    intro: {
      en: "Garlands for daily pooja, festival days and temple offerings, in marigold, jasmine, rose and tuberose. Made fresh the same morning. Pooja garlands need 1 day (24 hours) notice, and before 2 PM a same-day order is sometimes possible. Ask us on WhatsApp.",
      hi: "रोज़ की पूजा, त्योहार और मंदिर के लिए मालाएँ — गेंदा, चमेली, गुलाब और रजनीगंधा में। उसी सुबह ताज़ी बनाई जाती हैं। पूजा की मालाओं के लिए 1 दिन (24 घंटे) का समय चाहिए, और दोपहर 2 बजे से पहले कभी-कभी उसी दिन भी हो जाता है। WhatsApp पर पूछें।",
      te: "నిత్య పూజ, పండుగలు, గుడి కోసం హారాలు — బంతి, మల్లె, గులాబీ, సుగంధరాజ పువ్వులతో. అదే ఉదయం తాజాగా తయారు చేస్తాము. పూజ హారాలకు 1 రోజు (24 గంటలు) ముందుగా చెప్పాలి; మధ్యాహ్నం 2 గంటల లోపు అయితే కొన్నిసార్లు అదే రోజు కూడా వీలవుతుంది. WhatsApp లో అడగండి.",
      ur: "روزانہ کی پوجا، تہواروں اور مندر کے لیے ہار — گیندا، چنبیلی، گلاب اور رجنی گندھا میں۔ اسی صبح تازہ تیار ہوتے ہیں۔ ان کے لیے 1 دن (24 گھنٹے) پہلے بتانا ہوتا ہے، اور دوپہر 2 بجے سے پہلے کبھی کبھی اسی دن بھی ہو جاتا ہے۔ WhatsApp پر پوچھیں۔",
    },
  },
  events: {
    heading: {
      en: "Event and party garlands",
      hi: "कार्यक्रम और पार्टी की मालाएँ",
      te: "వేడుకలు మరియు పార్టీ హారాలు",
      ur: "تقریبات اور پارٹی کے ہار",
    },
    intro: {
      en: "Garlands, toran and flower decoration for birthdays, housewarmings, engagements and office functions. Made fresh on the day and delivered to your venue. Event garlands need 1 day (24 hours) notice. Tell us the date and the place on WhatsApp and we will share the price.",
      hi: "जन्मदिन, गृह प्रवेश, सगाई और दफ़्तर के कार्यक्रमों के लिए मालाएँ, तोरण और फूलों की सजावट। उसी दिन ताज़ी बनाकर आपके स्थान तक पहुँचाई जाती हैं। इनके लिए 1 दिन (24 घंटे) का समय चाहिए। तारीख़ और जगह WhatsApp पर बताएँ, हम कीमत बता देंगे।",
      te: "పుట్టినరోజులు, గృహప్రవేశం, నిశ్చితార్థం, ఆఫీస్ కార్యక్రమాలకు హారాలు, తోరణాలు, పూల అలంకరణ. అదే రోజు తాజాగా తయారు చేసి మీ చోటుకు అందిస్తాము. వీటికి 1 రోజు (24 గంటలు) ముందుగా చెప్పాలి. తేదీ, చోటు WhatsApp లో చెప్పండి, ధర తెలియజేస్తాము.",
      ur: "سالگرہ، گرہ پرویش، منگنی اور دفتری تقریبات کے لیے ہار، توران اور پھولوں کی سجاوٹ۔ اسی دن تازہ بنا کر آپ کی جگہ پہنچائے جاتے ہیں۔ ان کے لیے 1 دن (24 گھنٹے) پہلے بتانا ہوتا ہے۔ تاریخ اور جگہ WhatsApp پر بتائیں، ہم قیمت بتا دیں گے۔",
    },
  },
  special: {
    heading: {
      en: "Garlands for special occasions",
      hi: "खास अवसरों की मालाएँ",
      te: "ప్రత్యేక సందర్భాల హారాలు",
      ur: "خاص مواقع کے ہار",
    },
    intro: {
      en: "Flowers for the days that matter: welcomes, farewells, anniversaries, birthdays and thank-yous. Tell us the occasion and we will suggest what suits it. Most of these need 1 day (24 hours) notice.",
      hi: "स्वागत, विदाई, सालगिरह, जन्मदिन और धन्यवाद — हर खास दिन के लिए फूल। अवसर बताइए, हम सुझाव देंगे कि क्या अच्छा रहेगा। ज़्यादातर के लिए 1 दिन (24 घंटे) का समय चाहिए।",
      te: "స్వాగతం, వీడ్కోలు, వార్షికోత్సవం, పుట్టినరోజు, కృతజ్ఞత — ముఖ్యమైన ప్రతి రోజుకీ పువ్వులు. సందర్భం చెప్పండి, ఏది బాగుంటుందో సూచిస్తాము. చాలా వాటికి 1 రోజు (24 గంటలు) ముందుగా చెప్పాలి.",
      ur: "استقبال، الوداع، سالگرہ، جنم دن اور شکریے — ہر اہم دن کے لیے پھول۔ موقع بتائیے، ہم تجویز دیں گے کہ کیا مناسب رہے گا۔ زیادہ تر کے لیے 1 دن (24 گھنٹے) پہلے بتانا ہوتا ہے۔",
    },
  },
  custom: {
    heading: {
      en: "Custom and designer garlands",
      hi: "कस्टम और डिज़ाइनर मालाएँ",
      te: "కస్టమ్ మరియు డిజైనర్ హారాలు",
      ur: "کسٹم اور ڈیزائنر ہار",
    },
    intro: {
      en: "Send a reference photo, or design your garland step by step, and we will make it in your flowers, colours and length. Custom work needs 2 days' notice so the flowers can be ordered in. We agree the price and the advance on WhatsApp before we start.",
      hi: "एक रेफ़रेंस फोटो भेजें, या क़दम दर क़दम अपनी माला डिज़ाइन करें — हम आपके फूल, रंग और लंबाई में बनाएँगे। कस्टम काम के लिए 2 दिन का समय चाहिए ताकि फूल मंगवाए जा सकें। शुरू करने से पहले कीमत और अग्रिम राशि WhatsApp पर तय होती है।",
      te: "ఒక రిఫరెన్స్ ఫోటో పంపండి, లేదా మీ హారాన్ని దశలవారీగా డిజైన్ చేయండి — మీకు నచ్చిన పువ్వులు, రంగులు, పొడవుతో తయారు చేస్తాము. కస్టమ్ పనికి పువ్వులు తెప్పించాల్సి ఉంటుంది కాబట్టి 2 రోజుల ముందుగా చెప్పాలి. మొదలుపెట్టే ముందు ధర, అడ్వాన్స్ WhatsApp లో ఖరారు చేస్తాము.",
      ur: "ایک ریفرنس تصویر بھیجیں، یا قدم بہ قدم اپنا ہار ڈیزائن کریں — ہم آپ کے پھول، رنگ اور لمبائی میں بنائیں گے۔ کسٹم کام کے لیے پھول منگوانے ہوتے ہیں، اس لیے 2 دن پہلے بتانا ہوتا ہے۔ شروع کرنے سے پہلے قیمت اور پیشگی رقم WhatsApp پر طے ہوتی ہے۔",
    },
  },
};
