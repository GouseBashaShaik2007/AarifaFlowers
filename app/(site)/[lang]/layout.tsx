import type { Metadata } from "next";
import { preconnect } from "react-dom";
import { notFound } from "next/navigation";
import "../../globals.css";
import Footer from "@/components/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import Header from "@/components/Header";
import SavedToast from "@/components/SavedToast";
import AnnouncementBar from "@/components/AnnouncementBar";
import { LANGS, isLang, isRtl, tr } from "@/lib/catalog";
import { deva, playfair, poppins, telugu, urdu } from "@/lib/fonts";
import { getDict } from "@/lib/i18n";
import { getSiteSettings } from "@/lib/siteContent";
import { generalMessage, waLink } from "@/lib/whatsapp";

// Products change from the admin panel, so pages are built on every request.
export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://aarifaflowers.store";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const t = getDict(lang);
  return {
    metadataBase: SITE_URL ? new URL(SITE_URL) : undefined,
    title: { default: t.siteTitle, template: `%s | Aarifa Flowers` },
    description: t.siteDescription,
    alternates: {
      languages: Object.fromEntries(LANGS.map((l) => [l, `/${l}`])),
    },
    openGraph: { siteName: "Aarifa Flowers", title: t.siteTitle, description: t.siteDescription, type: "website" },
  };
}

// Poppins is on every page (English words and numbers appear in every language), so only the others differ.
const fontFor = {
  en: "",
  hi: deva.variable,
  te: telugu.variable,
  ur: urdu.variable,
} as const;

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getDict(lang);

  // The garland photos come from another address. Opening that connection now, while the page is still being
  // built, saves a visitor on a slow phone a few hundred milliseconds when the first photo is asked for.
  try {
    if (process.env.SUPABASE_URL) preconnect(new URL(process.env.SUPABASE_URL).origin);
  } catch {
    // A speed-up only. A badly typed address must never stop the site from opening.
  }
  const settings = await getSiteSettings();

  return (
    <html lang={lang} dir={isRtl(lang) ? "rtl" : "ltr"} data-scroll-behavior="smooth" className={`${playfair.variable} ${poppins.variable} ${fontFor[lang]}`}>
      <body className="min-h-screen">
        <AnnouncementBar text={settings.announcementEnabled ? tr(settings.announcement, lang) : ""} />
        <Header lang={lang} />
        <main>{children}</main>
        <Footer lang={lang} delivery={tr(settings.delivery, lang)} />
        <FloatingWhatsApp href={waLink(generalMessage)} label={t.chat} />
        <SavedToast />
      </body>
    </html>
  );
}
