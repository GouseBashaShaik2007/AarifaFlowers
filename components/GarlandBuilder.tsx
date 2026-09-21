"use client";

import { useEffect, useRef, useState } from "react";
import { FLOWERS, OCCASIONS, label, type Lang } from "@/lib/catalog";
import {
  COLOURS,
  EMPTY_CHOICES,
  LENGTHS,
  MAX_BUDGET,
  MAX_NOTES,
  builderMessage,
  type BuilderChoices,
} from "@/lib/builder";
import { fmt, type Dictionary } from "@/lib/i18n";
import { assessDate, noticeDays, formatDate } from "@/lib/orderRules";
import { waLink } from "@/lib/whatsapp";
import DateCheck from "./DateCheck";
import { ArrowIcon } from "./icons";
import WhatsAppButton from "./WhatsAppButton";

const STEPS = 6;
const REVIEW = STEPS + 1;

const chip = (on: boolean) =>
  `flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-start text-[0.95rem] font-medium transition active:scale-[0.98] ${
    on ? "border-rose bg-rose text-white shadow-sm" : "border-line bg-white text-ink hover:border-rose/50"
  }`;

const field =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-base outline-none focus:border-rose focus:ring-2 focus:ring-rose/20";

/** Toggles one id in a list. */
const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((v) => v !== id) : [...list, id]);

/**
 * Six short steps, then a summary and one Send on WhatsApp button. Nothing is stored or sent until the visitor
 * taps that button. The message it builds is always English.
 */
export default function GarlandBuilder({ lang, t }: { lang: Lang; t: Dictionary }) {
  const [step, setStep] = useState(1);
  const [c, setC] = useState<BuilderChoices>(EMPTY_CHOICES);
  const heading = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);

  // After the first step change, move the focus to the new heading so keyboard and screen reader users land on it.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    heading.current?.focus();
    heading.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [step]);

  const set = <K extends keyof BuilderChoices>(key: K, value: BuilderChoices[K]) => setC((prev) => ({ ...prev, [key]: value }));

  const days = noticeDays(c.occasion ? [c.occasion] : []);
  const status = assessDate(c.date, days);
  const nothingPicked = [
    false,
    !c.occasion,
    c.flowers.length === 0,
    c.colours.length === 0,
    !c.length,
    !c.date,
    !c.budget && !c.notes.trim(),
  ];

  const titles = [
    "",
    t.stepOccasion,
    t.stepFlowers,
    t.stepColours,
    t.stepLength,
    t.stepDate,
    t.stepDetails,
  ];
  const hints = ["", "", t.stepFlowersHint, t.stepColoursHint, t.stepLengthHint, t.stepDateHint, ""];

  const list = (ids: string[], source: readonly { id: string; label: Record<Lang, string> }[]) =>
    source
      .filter((s) => ids.includes(s.id))
      .map((s) => s.label[lang])
      .join(", ");

  const summary: { key: number; name: string; value: string }[] = [
    { key: 1, name: t.filterOccasion, value: c.occasion ? label(OCCASIONS, c.occasion, lang) : "" },
    { key: 2, name: t.flowersLabel, value: list(c.flowers, FLOWERS) },
    { key: 3, name: t.coloursLabel, value: list(c.colours, COLOURS) },
    { key: 4, name: t.lengthLabel, value: list(c.length ? [c.length] : [], LENGTHS) },
    { key: 5, name: t.dateLabel, value: c.date && status !== "past" ? formatDate(c.date) : "" },
    {
      key: 6,
      name: t.budgetShort,
      value: Number(c.budget) > 0 ? `₹${Math.round(Number(c.budget)).toLocaleString("en-IN")}` : "",
    },
  ];

  const inReview = step === REVIEW;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="h-display text-3xl font-semibold text-rose-deep sm:text-4xl">{t.builderTitle}</h1>
      <p className="mt-2 text-muted">{t.builderSub}</p>

      <div className="mt-6 rounded-3xl border border-line bg-white p-5 sm:p-7">
        {!inReview && (
          <div className="mb-5">
            <p className="text-sm font-medium text-muted">{fmt(t.stepOf, { n: step, total: STEPS })}</p>
            <div
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={STEPS}
              aria-valuenow={step}
              className="mt-2 h-2 overflow-hidden rounded-full bg-line"
            >
              <div className="h-full rounded-full bg-rose transition-all" style={{ width: `${(step / STEPS) * 100}%` }} />
            </div>
          </div>
        )}

        <h2 ref={heading} tabIndex={-1} className="h-display scroll-mt-24 text-2xl font-semibold text-ink outline-none">
          {inReview ? t.reviewTitle : titles[step]}
        </h2>
        {!inReview && hints[step] && <p className="mt-1 text-sm text-muted">{hints[step]}</p>}
        {inReview && <p className="mt-1 text-sm text-muted">{t.reviewHint}</p>}

        <div className="mt-5">
          {step === 1 && (
            <div role="group" aria-label={t.stepOccasion} className="grid gap-3 sm:grid-cols-2">
              {OCCASIONS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  aria-pressed={c.occasion === o.id}
                  onClick={() => set("occasion", o.id)}
                  className={chip(c.occasion === o.id)}
                >
                  <span aria-hidden="true">{o.emoji}</span>
                  {o.label[lang]}
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div role="group" aria-label={t.stepFlowers} className="grid grid-cols-2 gap-3">
              {FLOWERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={c.flowers.includes(f.id)}
                  onClick={() => set("flowers", toggle(c.flowers, f.id))}
                  className={chip(c.flowers.includes(f.id))}
                >
                  <span aria-hidden="true">{f.emoji}</span>
                  {f.label[lang]}
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div role="group" aria-label={t.stepColours} className="grid grid-cols-2 gap-3">
              {COLOURS.map((col) => (
                <button
                  key={col.id}
                  type="button"
                  aria-pressed={c.colours.includes(col.id)}
                  onClick={() => set("colours", toggle(c.colours, col.id))}
                  className={chip(c.colours.includes(col.id))}
                >
                  <span
                    aria-hidden="true"
                    className="h-6 w-6 shrink-0 rounded-full border border-black/15"
                    style={{ background: col.swatch }}
                  />
                  {col.label[lang]}
                </button>
              ))}
            </div>
          )}

          {step === 4 && (
            <div role="group" aria-label={t.stepLength} className="grid grid-cols-2 gap-3">
              {LENGTHS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  aria-pressed={c.length === l.id}
                  onClick={() => set("length", c.length === l.id ? "" : l.id)}
                  className={chip(c.length === l.id)}
                >
                  <span aria-hidden="true">📏</span>
                  {l.label[lang]}
                </button>
              ))}
            </div>
          )}

          {step === 5 && <DateCheck id="builder-date" t={t} days={days} value={c.date} onChange={(v) => set("date", v)} />}

          {step === 6 && (
            <div className="space-y-5">
              <div>
                <label htmlFor="builder-budget" className="mb-1.5 block text-sm font-medium text-ink">
                  {t.budgetLabel}
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-muted">₹</span>
                  <input
                    id="builder-budget"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={MAX_BUDGET}
                    step={1}
                    value={c.budget}
                    onChange={(e) => set("budget", e.target.value)}
                    placeholder={t.budgetPlaceholder}
                    className={`${field} ps-9`}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="builder-notes" className="mb-1.5 block text-sm font-medium text-ink">
                  {t.notesLabel}
                </label>
                <textarea
                  id="builder-notes"
                  rows={4}
                  maxLength={MAX_NOTES}
                  value={c.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  placeholder={t.notesPlaceholder}
                  className={field}
                />
              </div>
            </div>
          )}

          {inReview && (
            <dl className="divide-y divide-line rounded-2xl border border-line">
              {summary.map((row) => (
                <div key={row.key} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{row.name}</dt>
                    <dd className={`mt-0.5 text-[0.95rem] ${row.value ? "font-medium text-ink" : "text-muted"}`}>
                      {row.value || t.notDecided}
                    </dd>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(row.key)}
                    className="min-h-11 shrink-0 rounded-full px-3 text-sm font-semibold text-rose hover:bg-rose-soft"
                  >
                    {t.change}
                  </button>
                </div>
              ))}
              {c.notes.trim() && (
                <div className="px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t.notesShort}</p>
                  <p className="mt-0.5 whitespace-pre-line text-[0.95rem] text-ink">{c.notes.trim()}</p>
                </div>
              )}
            </dl>
          )}
        </div>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-line bg-white px-6 text-sm font-semibold text-ink transition hover:border-rose/50"
            >
              <ArrowIcon className="h-4 w-4 rotate-180 rtl:rotate-0" />
              {t.back}
            </button>
          ) : (
            <span />
          )}

          {inReview ? (
            <WhatsAppButton href={waLink(builderMessage(c, status))} size="lg" track="custom" className="sm:min-w-72">
              {t.sendDesign}
            </WhatsAppButton>
          ) : (
            <button
              type="button"
              disabled={step === 1 && !c.occasion}
              onClick={() => setStep(step + 1)}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-rose px-7 text-base font-semibold text-white shadow-[0_8px_20px_-8px_rgba(184,50,90,0.8)] transition hover:bg-rose-deep active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
            >
              {step === STEPS ? t.reviewBtn : nothingPicked[step] && step > 1 ? t.skip : t.next}
              <ArrowIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
