import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../../globals.css";
import Footer from "@/components/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import Header from "@/components/Header";
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

const fontFor = {
  en: poppins.variable,
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
  const settings = await getSiteSettings();

  return (
    <html lang={lang} dir={isRtl(lang) ? "rtl" : "ltr"} className={`${playfair.variable} ${fontFor[lang]}`}>
      <body className="min-h-screen">
        <AnnouncementBar text={tr(settings.announcement, lang)} />
        <Header lang={lang} />
        <main>{children}</main>
        <Footer lang={lang} delivery={tr(settings.delivery, lang)} />
        <FloatingWhatsApp href={waLink(generalMessage)} label={t.chat} />
      </body>
    </html>
  );
}
