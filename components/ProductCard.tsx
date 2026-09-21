import Link from "next/link";
import { thumbOf, tr, type Lang, type Product } from "@/lib/catalog";
import { fmt, type Dictionary } from "@/lib/i18n";
import { MAX_SAVED } from "@/lib/savedLimit";
import { productMessage, waLink } from "@/lib/whatsapp";
import FitPhoto from "./FitPhoto";
import PriceLabel from "./PriceLabel";
import SaveButton from "./SaveButton";
import WhatsAppButton from "./WhatsAppButton";

export default function ProductCard({ product, lang, t }: { product: Product; lang: Lang; t: Dictionary }) {
  const name = tr(product.name, lang);
  const length = tr(product.length, lang);
  const image = product.images[0];
  const href = `/${lang}/garlands/${product.id}`;

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-[0_2px_14px_-6px_rgba(120,60,60,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-10px_rgba(120,60,60,0.35)]">
      {/* A tall 4:5 frame, the shape of a hanging garland. Photos fill it, cut-outs sit whole on the pink backdrop. */}
      <div className="photo-bg relative aspect-[4/5] overflow-hidden">
        <Link href={href} className="absolute inset-0 block overflow-hidden" aria-label={name}>
          {image ? (
            <span className={`absolute inset-0 block transition duration-300 group-hover:scale-105 ${product.available ? "" : "opacity-60 grayscale-[35%]"}`}>
              <FitPhoto src={thumbOf(image)} alt={name} shade />
            </span>
          ) : (
            <span className="absolute inset-0 grid place-items-center text-5xl">💐</span>
          )}
        </Link>
        <span
          className={`pointer-events-none absolute start-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${
            product.available ? "bg-leaf text-white" : "bg-white/90 text-muted"
          }`}
        >
          {product.available ? `🌿 ${t.freshToday}` : t.unavailable}
        </span>
        <SaveButton
          id={product.id}
          className="absolute end-0.5 top-0.5 z-10"
          labels={{
            save: t.saveGarland,
            unsave: t.unsaveGarland,
            full: fmt(t.savedFull, { n: MAX_SAVED }),
            added: t.savedAdded,
          }}
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3.5 sm:p-4">
        {/* Two lines at the line height of 1.375, so a long name is cut cleanly with no third line peeking out. */}
        <h3 className="line-clamp-2 min-h-[2.75em] text-[0.95rem] font-semibold leading-snug text-ink">
          <Link href={href} className="hover:text-rose">
            {name}
          </Link>
        </h3>
        <PriceLabel t={t} price={product.price} maxPrice={product.maxPrice} className="text-sm text-rose-deep" />
        {length && (
          <p className="text-xs">
            <span className="inline-block rounded-full bg-rose-soft px-2.5 py-1 font-medium text-rose-deep">
              <span className="sr-only">{t.lengthLabel}: </span>
              📏 {length}
            </span>
          </p>
        )}
        <div className="mt-auto pt-1">
          <WhatsAppButton href={waLink(productMessage(product))} full track={product.id}>
            {t.orderWhatsApp}
          </WhatsAppButton>
        </div>
      </div>
    </article>
  );
}
