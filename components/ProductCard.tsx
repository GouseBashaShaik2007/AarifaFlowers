import Link from "next/link";
import { thumbOf, tr, type Lang, type Product } from "@/lib/catalog";
import type { Dictionary } from "@/lib/i18n";
import { productMessage, waLink } from "@/lib/whatsapp";
import PriceLabel from "./PriceLabel";
import WhatsAppButton from "./WhatsAppButton";

export default function ProductCard({ product, lang, t }: { product: Product; lang: Lang; t: Dictionary }) {
  const name = tr(product.name, lang);
  const image = product.images[0];
  const href = `/${lang}/garlands/${product.id}`;

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-[0_2px_14px_-6px_rgba(120,60,60,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-10px_rgba(120,60,60,0.35)]">
      <Link href={href} className="photo-bg relative block aspect-square overflow-hidden" aria-label={name}>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbOf(image)}
            alt={name}
            loading="lazy"
            decoding="async"
            className={`absolute inset-0 h-full w-full object-contain p-4 transition duration-300 group-hover:scale-105 ${
              product.available ? "" : "opacity-60 grayscale-[35%]"
            }`}
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center text-5xl">💐</span>
        )}
        <span
          className={`absolute start-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${
            product.available ? "bg-leaf text-white" : "bg-white/90 text-muted"
          }`}
        >
          {product.available ? `🌿 ${t.freshToday}` : t.unavailable}
        </span>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3.5 sm:p-4">
        <h3 className="line-clamp-2 min-h-[3.2em] text-[0.95rem] font-semibold leading-snug text-ink">
          <Link href={href} className="hover:text-rose">
            {name}
          </Link>
        </h3>
        <PriceLabel t={t} price={product.price} maxPrice={product.maxPrice} className="text-sm text-rose-deep" />
        <div className="mt-auto pt-1">
          <WhatsAppButton href={waLink(productMessage(product))} full track={product.id}>
            {t.orderWhatsApp}
          </WhatsAppButton>
        </div>
      </div>
    </article>
  );
}
