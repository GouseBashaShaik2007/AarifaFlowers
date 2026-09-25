import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLang } from "@/lib/catalog";
import { getDict } from "@/lib/i18n";
import { findLook } from "@/lib/looks";
import { LOOK_ID } from "@/lib/tryon";
import { SITE_URL } from "@/lib/whatsapp";

// A look a customer shared from the Try On screen. The address is random, the page is kept out of search
// engines, and it stops working after 30 days. WhatsApp shows the picture in the chat from the og:image below.

type Params = Promise<{ lang: string; id: string }>;

const absolute = (url: string) => (url.startsWith("http") ? url : `${SITE_URL}${url}`);

async function load(id: string) {
  return LOOK_ID.test(id) ? findLook(id) : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang, id } = await params;
  if (!isLang(lang)) return {};
  const look = await load(id);
  const t = getDict(lang);
  return {
    title: t.lookTitle,
    robots: { index: false, follow: false },
    openGraph: { title: t.lookTitle, description: t.lookNote, images: look ? [absolute(look.url)] : undefined },
  };
}

export default async function LookPage({ params }: { params: Params }) {
  const { lang, id } = await params;
  if (!isLang(lang)) notFound();
  const look = await load(id);
  if (!look) notFound();
  const t = getDict(lang);

  return (
    <div className="mx-auto max-w-md px-4 py-8 text-center sm:py-12">
      <h1 className="h-display text-2xl font-semibold text-rose-deep sm:text-3xl">{t.lookTitle}</h1>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={look.url} alt={t.lookTitle} className="mx-auto mt-5 w-full rounded-2xl border border-line bg-white shadow-md" />
      <p className="mt-4 text-sm text-muted">{t.lookNote}</p>
      <Link
        href={`/${lang}/garlands`}
        className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full border-2 border-rose px-6 py-3 text-base font-semibold text-rose hover:bg-rose-soft"
      >
        {t.lookBrowse}
      </Link>
    </div>
  );
}
