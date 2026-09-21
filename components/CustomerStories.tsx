import { thumbOf } from "@/lib/catalog";
import type { Review } from "@/lib/content";
import { fmt, type Dictionary } from "@/lib/i18n";

export function Stars({ rating, label }: { rating: number; label: string }) {
  const n = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span role="img" aria-label={label} className="text-lg leading-none tracking-wider text-marigold" dir="ltr">
      {"★".repeat(n)}
      <span className="text-line">{"★".repeat(5 - n)}</span>
    </span>
  );
}

/** Real customer photos and words. The home page shows this only when at least one story is published. */
export default function CustomerStories({ reviews, t }: { reviews: Review[]; t: Dictionary }) {
  if (reviews.length === 0) return null;
  return (
    <section className="mx-auto mt-16 max-w-6xl px-4 sm:px-6" aria-labelledby="stories-heading">
      <h2 id="stories-heading" className="h-display text-3xl font-semibold text-ink sm:text-4xl">
        {t.customerStories}
      </h2>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((r) => (
          <li key={r.id} className="flex flex-col overflow-hidden rounded-3xl border border-line bg-white">
            {r.photo && (
              <div className="aspect-[4/3] overflow-hidden bg-cream-deep">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbOf(r.photo)}
                  alt={r.event || r.name}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div className="flex flex-1 flex-col gap-3 p-5">
              <Stars rating={r.rating} label={fmt(t.starsLabel, { n: r.rating })} />
              <blockquote className="text-[0.95rem] leading-relaxed text-ink">“{r.text}”</blockquote>
              <p className="mt-auto text-sm">
                <span className="font-semibold text-ink">{r.name}</span>
                {r.event && <span className="text-muted"> · {r.event}</span>}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
