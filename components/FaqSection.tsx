import { tr, type Lang } from "@/lib/catalog";
import type { FaqItem } from "@/lib/faq";
import { ChevronIcon } from "./icons";

/** Questions and answers that open and close. Uses the browser's own details box, so it works without scripts. */
export default function FaqSection({ items, lang, title }: { items: FaqItem[]; lang: Lang; title: string }) {
  const shown = items.filter((i) => tr(i.question, lang) && tr(i.answer, lang));
  if (shown.length === 0) return null;
  return (
    <section className="mx-auto mt-16 max-w-3xl px-4 sm:px-6" aria-labelledby="faq-heading">
      <h2 id="faq-heading" className="h-display text-3xl font-semibold text-ink sm:text-4xl">
        {title}
      </h2>
      <div className="mt-6 space-y-3">
        {shown.map((item) => (
          <details key={item.id} name="faq" className="group rounded-2xl border border-line bg-white open:shadow-sm">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-3.5 font-semibold text-ink hover:text-rose-deep [&::-webkit-details-marker]:hidden">
              <span>{tr(item.question, lang)}</span>
              <ChevronIcon className="h-5 w-5 shrink-0 text-rose transition-transform group-open:rotate-180" />
            </summary>
            <p className="whitespace-pre-line px-5 pb-5 text-[0.95rem] leading-relaxed text-muted">{tr(item.answer, lang)}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
