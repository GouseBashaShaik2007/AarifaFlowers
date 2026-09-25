import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import FaqSection from "@/components/FaqSection";
import { ArrowIcon } from "@/components/icons";
import JsonLd from "@/components/JsonLd";
import ProductCard from "@/components/ProductCard";
import WhatsAppButton from "@/components/WhatsAppButton";
import { OCCASIONS, type OccasionId, isLang, tr } from "@/lib/catalog";
import { faqFacts } from "@/lib/faq";
import { getDict } from "@/lib/i18n";
import { OCCASION_PAGES } from "@/lib/occasionPages";
import { getProducts } from "@/lib/publicData";
import { langAlternates } from "@/lib/seo";
import { getFaq } from "@/lib/siteContent";
import { SITE_URL, customMessage, generalMessage, waLink } from "@/lib/whatsapp";

const isOccasion = (v: string): v is OccasionId => OCCASIONS.some((o) => o.id === v);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; occasion: string }>;
}): Promise<Metadata> {
  const { lang, occasion } = await params;
  if (!isLang(lang) || !isOccasion(occasion)) return {};
  const page = OCCASION_PAGES[occasion];
  const heading = tr(page.heading, lang);
  const intro = tr(page.intro, lang);
  return {
    title: heading,
    description: intro.slice(0, 200),
    alternates: langAlternates(lang, `/occasions/${occasion}`),
    openGraph: { title: heading, description: intro.slice(0, 200), type: "website" },
  };
}

export default async function OccasionPage({
  params,
}: {
  params: Promise<{ lang: string; occasion: string }>;
}) {
  const { lang, occasion } = await params;
  if (!isLang(lang) || !isOccasion(occasion)) notFound();

  const t = getDict(lang);
  const page = OCCASION_PAGES[occasion];
  const heading = tr(page.heading, lang);
  const intro = tr(page.intro, lang);

  const [products, faq] = await Promise.all([getProducts(), getFaq()]);
  const matching = products.filter((p) => p.occasions.includes(occasion));
  // Fresh Today first, then the featured ones, so the best of this occasion is at the top.
  const shown = [
    ...matching.filter((p) => p.available && p.featured),
    ...matching.filter((p) => p.available && !p.featured),
    ...matching.filter((p) => !p.available),
  ];
  // The notice time is already in this occasion's own words above, so the general one is not repeated here.
  const faqSchema = faq.enabled ? faqFacts(faq.items, lang) : null;
  const pageUrl = `${SITE_URL}/${lang}/occasions/${occasion}`;

  return (
    <>
    <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 sm:pt-10">
      {/* The trail from the home page, so search results can show it. */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: t.navHome, item: `${SITE_URL}/${lang}` },
            { "@type": "ListItem", position: 2, name: t.allGarlands, item: `${SITE_URL}/${lang}/garlands` },
            { "@type": "ListItem", position: 3, name: heading, item: pageUrl },
          ],
        }}
      />

      {faqSchema && <JsonLd data={faqSchema} />}

      <nav aria-label={t.navHome} className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
        <Link href={`/${lang}`} className="hover:text-rose">
          {t.navHome}
        </Link>
        <span aria-hidden="true">/</span>
        <Link href={`/${lang}/garlands`} className="hover:text-rose">
          {t.allGarlands}
        </Link>
      </nav>

      <header className="mt-4 max-w-3xl">
        <h1 className="h-display text-3xl font-semibold text-ink sm:text-4xl">{heading}</h1>
        <p className="mt-4 text-base text-muted sm:text-lg">{intro}</p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <WhatsAppButton
            href={waLink(occasion === "custom" ? customMessage : generalMessage)}
            size="lg"
            track={occasion === "custom" ? "custom" : "general"}
          >
            {t.orderWhatsApp}
          </WhatsAppButton>
          <Link
            href={`/${lang}/garlands?occasion=${occasion}`}
            className="inline-flex min-h-12 items-center gap-1.5 rounded-full border border-line bg-white px-5 text-sm font-semibold text-ink transition hover:border-rose hover:text-rose"
          >
            {t.occasionFilters}
            <ArrowIcon className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {shown.length > 0 ? (
        <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {shown.map((p, i) => (
            <li key={p.id}>
              <ProductCard product={p} lang={lang} t={t} priority={i < 2} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-10 rounded-3xl border border-dashed border-line bg-white/60 p-10 text-center text-muted">
          <p className="text-4xl">💐</p>
          <p className="mx-auto mt-3 max-w-md">{t.occasionEmpty}</p>
        </div>
      )}

      <section className="mt-14">
        <h2 className="h-display text-2xl font-semibold text-ink sm:text-3xl">{t.occasionOther}</h2>
        <ul className="mt-5 flex flex-wrap gap-2">
          {OCCASIONS.filter((o) => o.id !== occasion).map((o) => (
            <li key={o.id}>
              <Link
                href={`/${lang}/occasions/${o.id}`}
                className="flex min-h-11 items-center gap-2 rounded-full border border-line bg-white px-4 text-sm font-medium text-ink transition hover:border-rose hover:text-rose"
              >
                <span aria-hidden="true">{o.emoji}</span>
                {o.label[lang]}
              </Link>
            </li>
          ))}
        </ul>
      </section>

    </div>

    {/* The same questions as the home page, because this is often the first page a visitor lands on. */}
    {faq.enabled && (
      <div className="pb-14">
        <FaqSection items={faq.items} lang={lang} title={t.faqTitle} />
      </div>
    )}
    </>
  );
}
