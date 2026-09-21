import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import Gallery from "@/components/Gallery";
import { ArrowIcon } from "@/components/icons";
import PriceLabel from "@/components/PriceLabel";
import ProductCard from "@/components/ProductCard";
import WhatsAppButton from "@/components/WhatsAppButton";
import { FLOWERS, OCCASIONS, TYPES, isLang, label, tr } from "@/lib/catalog";
import { getDict } from "@/lib/i18n";
import { getProduct, listProducts } from "@/lib/store";
import { productMessage, waLink } from "@/lib/whatsapp";

const loadProduct = cache(getProduct);

export async function generateMetadata({ params }: { params: Promise<{ lang: string; id: string }> }): Promise<Metadata> {
  const { lang, id } = await params;
  if (!isLang(lang)) return {};
  const p = await loadProduct(id);
  if (!p) return {};
  return {
    title: tr(p.name, lang),
    description: tr(p.description, lang) || getDict(lang).siteDescription,
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
  const orderHref = waLink(productMessage(product));

  const others = (await listProducts()).filter((p) => p.id !== product.id);
  const related = [
    ...others.filter((p) => p.occasions.some((o) => product.occasions.includes(o))),
    ...others.filter((p) => !p.occasions.some((o) => product.occasions.includes(o))),
  ].slice(0, 4);

  const bestFor = [
    ...product.occasions.map((o) => label(OCCASIONS, o, lang)),
    ...product.types.map((o) => label(TYPES, o, lang)),
  ];

  return (
    <div className="pb-24 md:pb-0">
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
            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                product.available ? "bg-leaf text-white" : "bg-line text-muted"
              }`}
            >
              {product.available ? `🌿 ${t.freshToday}` : t.unavailable}
            </span>
            <h1 className="h-display mt-3 text-3xl font-semibold text-ink sm:text-4xl">{name}</h1>
            <PriceLabel t={t} price={product.price} className="mt-3 block text-2xl text-rose-deep" />
            <p className="mt-1 text-sm text-muted">{t.priceNote}</p>

            {description && <p className="mt-5 text-base text-ink/90">{description}</p>}

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

            <div className="mt-6 rounded-2xl bg-cream-deep/70 p-4 text-sm">
              <p className="font-semibold text-ink">🚚 {t.delivery}</p>
              <p className="mt-1 text-muted">{t.deliveryNote}</p>
            </div>

            <div className="mt-6 hidden md:block">
              <WhatsAppButton href={orderHref} size="lg" full>
                {t.orderWhatsApp}
              </WhatsAppButton>
            </div>
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

      {/* Order bar that stays on screen on phones */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 p-3 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <PriceLabel t={t} price={product.price} className="shrink-0 text-sm text-rose-deep" />
          <WhatsAppButton href={orderHref} full className="flex-1">
            {t.orderWhatsApp}
          </WhatsAppButton>
        </div>
      </div>
    </div>
  );
}
