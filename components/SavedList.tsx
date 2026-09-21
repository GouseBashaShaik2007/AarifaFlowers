"use client";

import Link from "next/link";
import type { Lang, Product } from "@/lib/catalog";
import { fmt, type Dictionary } from "@/lib/i18n";
import { MAX_SAVED, useHydrated, useSaved } from "@/lib/saved";
import { savedMessage, waLink } from "@/lib/whatsapp";
import { ArrowIcon, HeartIcon } from "./icons";
import ProductCard from "./ProductCard";
import WhatsAppButton from "./WhatsAppButton";

/**
 * The garlands this visitor saved with the heart button, and one button that sends them all in a single WhatsApp
 * message. Which garlands are saved is known only in the browser, so the page receives every garland and picks.
 */
export default function SavedList({ products, lang, t }: { products: Product[]; lang: Lang; t: Dictionary }) {
  const ids = useSaved();
  const hydrated = useHydrated();

  // Keep the order they were saved in. A garland the owner has since deleted is simply skipped.
  const byId = new Map(products.map((p) => [p.id, p]));
  const saved = ids.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="h-display flex items-center gap-3 text-3xl font-semibold text-ink sm:text-4xl">
        <HeartIcon filled className="h-8 w-8 text-rose" />
        {t.savedTitle}
      </h1>
      <p className="mt-2 text-muted">{fmt(t.savedIntro, { n: MAX_SAVED })}</p>

      {!hydrated ? (
        <div className="mt-8 h-40" aria-hidden="true" />
      ) : saved.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-line bg-white px-6 py-12 text-center">
          <p className="mx-auto max-w-md text-muted">{t.savedEmpty}</p>
          <Link
            href={`/${lang}/garlands`}
            className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-rose px-6 text-base font-semibold text-white transition hover:bg-rose-deep"
          >
            {t.browse}
            <ArrowIcon />
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-6 text-sm font-medium text-ink">{fmt(t.savedCount, { n: saved.length, max: MAX_SAVED })}</p>
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {saved.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} lang={lang} t={t} />
              </li>
            ))}
          </ul>
          <div className="mt-8 max-w-md">
            <WhatsAppButton href={waLink(savedMessage(saved))} size="lg" full track="general">
              {t.savedSend}
            </WhatsAppButton>
          </div>
        </>
      )}
    </div>
  );
}
