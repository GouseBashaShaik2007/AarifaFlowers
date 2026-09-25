import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Gallery from "@/components/Gallery";
import GarlandOrder from "@/components/GarlandOrder";
import { ArrowIcon } from "@/components/icons";
import JsonLd from "@/components/JsonLd";
import PriceLabel from "@/components/PriceLabel";
import ProductCard from "@/components/ProductCard";
import SaveButton from "@/components/SaveButton";
import ShareButton from "@/components/ShareButton";
import TryOnButton from "@/components/tryon/TryOnButton";
import { FLOWERS, OCCASIONS, TYPES, isLang, label, tr } from "@/lib/catalog";
import { MAX_SAVED } from "@/lib/savedLimit";
import { fmt, getDict } from "@/lib/i18n";
import { langAlternates } from "@/lib/seo";
import { getSiteSettings } from "@/lib/siteContent";
import { canTryOn } from "@/lib/tryon";
import { getProductById, getProducts } from "@/lib/publicData";
import { BUSINESS_NAME, SITE_URL } from "@/lib/whatsapp";

const loadProduct = getProductById;

export async function generateMetadata({ params }: { params: Promise<{ lang: string; id: string }> }): Promise<Metadata> {
  const { lang, id } = await params;
  if (!isLang(lang)) return {};
  const p = await loadProduct(id);
  if (!p) return {};
  return {
    title: tr(p.name, lang),
    description: tr(p.description, lang) || getDict(lang).siteDescription,
    alternates: langAlternates(lang, `/garlands/${p.id}`),
    openGraph: { images: p.images[0] ? [p.images[0]] : undefined },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await params;
  if (!isLang(lang)) notFound();
  const product = await loadProduct(id);
  if (!product) notFound();

  const t = getDict(lang);
  const name = tr(product.name, lang);
  const description = tr(product.description, lang);
  const length = tr(product.length, lang);
  // The garlands are already loaded (that is how the garland was found), so only the texts are still to come.
  const [settings, all] = await Promise.all([getSiteSettings(), getProducts()]);
  const delivery = tr(settings.delivery, lang);
  const leadTime = tr(settings.leadTime, lang);

  const others = all.filter((p) => p.id !== product.id);
  const related = [
    ...others.filter((p) => p.occasions.some((o) => product.occasions.includes(o))),
    ...others.filter((p) => !p.occasions.some((o) => product.occasions.includes(o))),
  ].slice(0, 4);

  const bestFor = [
    ...product.occasions.map((o) => label(OCCASIONS, o, lang)),
    ...product.types.map((o) => label(TYPES, o, lang)),
  ];

  // Facts about this garland for search engines. It states only what the owner entered: the starting price or range,
  // and "in stock" only when the garland is marked Fresh Today. There is no rating, because none has been published.
  const pageUrl = `${SITE_URL}/${lang}/garlands/${product.id}`;
  const absolute = (u: string) => (u.startsWith("http") ? u : `${SITE_URL}${u}`);
  const hasRange = Boolean(product.maxPrice && product.maxPrice > product.price);
  const productFacts = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: description || t.siteDescription,
    sku: product.id,
    url: pageUrl,
    brand: { "@type": "Brand", name: BUSINESS_NAME },
    ...(product.images.length > 0 ? { image: product.images.map(absolute) } : {}),
    offers: hasRange
      ? { "@type": "AggregateOffer", priceCurrency: "INR", lowPrice: product.price, highPrice: product.maxPrice, offerCount: 1, url: pageUrl }
      : {
          "@type": "Offer",
          priceCurrency: "INR",
          price: product.price,
          url: pageUrl,
          ...(product.available ? { availability: "https://schema.org/InStock" } : {}),
        },
  };

  return (
    <div className="pb-24 md:pb-0">
      <JsonLd data={productFacts} />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <Link
          href={`/${lang}/garlands`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-rose"
        >
          <ArrowIcon className="h-4 w-4 rotate-180 rtl:rotate-0" />
          {t.back}
        </Link>

        <div className="mt-5 grid gap-8 md:grid-cols-2 md:gap-12">
          <Gallery images={product.images} name={name} altTemplate={t.photoOf} />

          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span
                className={`inline-block rounded-full px-3 py-1 text-[13px] font-semibold ${
                  product.available ? "bg-leaf text-white" : "bg-line text-muted"
                }`}
              >
                {product.available ? `🌿 ${t.freshToday}` : t.unavailable}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <ShareButton label={t.shareGarland} title={name} text={t.shareText} />
                <SaveButton
                  id={product.id}
                  variant="pill"
                  labels={{
                    save: t.saveGarland,
                    unsave: t.unsaveGarland,
                    full: fmt(t.savedFull, { n: MAX_SAVED }),
                    added: t.savedAdded,
                  }}
                />
              </div>
            </div>
            <h1 className="h-display mt-3 text-3xl font-semibold text-ink sm:text-4xl">{name}</h1>
            <PriceLabel t={t} price={product.price} maxPrice={product.maxPrice} className="mt-3 block text-2xl text-rose-deep" />
            <p className="mt-1 text-sm text-muted">{product.maxPrice && product.maxPrice > product.price ? t.rangeNote : t.priceNote}</p>

            {description && <p className="mt-5 text-base text-ink/90">{description}</p>}

            {length && (
              <p className="mt-5 text-sm">
                <span className="font-semibold uppercase tracking-wide text-muted">{t.lengthLabel}: </span>
                <span className="rounded-full bg-rose-soft px-3 py-1 text-rose-deep">{length}</span>
              </p>
            )}

            {product.flowers.length > 0 && (
              <div className="mt-6">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{t.flowersUsed}</h2>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {product.flowers.map((f) => (
                    <li key={f} className="rounded-full border border-line bg-white px-3 py-1.5 text-sm">
                      {FLOWERS.find((x) => x.id === f)?.emoji} {label(FLOWERS, f, lang)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {bestFor.length > 0 && (
              <div className="mt-5">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{t.bestFor}</h2>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {bestFor.map((b) => (
                    <li key={b} className="rounded-full bg-rose-soft px-3 py-1.5 text-sm text-rose-deep">
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(delivery || leadTime) && (
              <div className="mt-6 rounded-2xl bg-cream-deep/70 p-4 text-sm">
                <p className="font-semibold text-ink">🚚 {t.delivery}</p>
                {delivery && <p className="mt-1 text-muted">{delivery}</p>}
                {leadTime && <p className="mt-2 font-medium text-ink">⏱️ {leadTime}</p>}
              </div>
            )}

            {canTryOn(product) && (
              <div className="mt-6">
                <TryOnButton product={product} t={t} />
              </div>
            )}

            <GarlandOrder product={product} t={t} />
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="h-display text-2xl font-semibold text-ink sm:text-3xl">{t.similar}</h2>
            <ul className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
              {related.map((p) => (
                <li key={p.id}>
                  <ProductCard product={p} lang={lang} t={t} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

    </div>
  );
}
