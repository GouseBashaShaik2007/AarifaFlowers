"use client";

import { useState, useTransition } from "react";
import { saveSettingsAction } from "@/app/(admin)/admin/actions";
import { LANGS, LANG_LABEL, isRtl, tr, type Lang } from "@/lib/catalog";
import type { SiteSettings } from "@/lib/content";
import AnnouncementBar from "@/components/AnnouncementBar";

type FieldKey = "announcement" | "delivery" | "leadTime";

const FIELDS: { key: FieldKey; title: string; hint: string; rows: number; max: number }[] = [
  {
    key: "announcement",
    title: "Announcement bar",
    hint: "A thin bar at the very top of every page. Leave every language empty to hide the bar.",
    rows: 2,
    max: 220,
  },
  {
    key: "delivery",
    title: "Delivery rules",
    hint: "Shown in the footer and on every garland page. Say which city and areas you deliver to.",
    rows: 3,
    max: 500,
  },
  {
    key: "leadTime",
    title: "Order notice",
    hint: "How much notice you need. Shown in How it works and on every garland page. Change it in busy seasons.",
    rows: 3,
    max: 320,
  },
];

const area =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-base outline-none focus:border-rose focus:ring-2 focus:ring-rose/20";

export default function SettingsForm({ initial, defaults }: { initial: SiteSettings; defaults: SiteSettings }) {
  const [values, setValues] = useState<SiteSettings>(initial);
  const [tab, setTab] = useState<Lang>("en");
  const [pending, start] = useTransition();
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  const setText = (key: FieldKey, lang: Lang, value: string) =>
    setValues((v) => ({ ...v, [key]: { ...v[key], [lang]: value } }));

  const save = () => {
    setNote(null);
    start(async () => {
      const res = await saveSettingsAction(values);
      setNote(res.ok ? { ok: true, text: "Saved. The website shows the new text now." } : { ok: false, text: res.error });
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="space-y-5"
    >
      <div>
        <h1 className="text-2xl font-semibold text-ink">Announcements</h1>
        <p className="mt-1 text-sm text-muted">
          Change the delivery and notice text yourself, for example before a festival or a busy wedding month. Add your
          city name where it says our city.
        </p>
      </div>

      <div role="tablist" aria-label="Language" className="flex flex-wrap gap-2">
        {LANGS.map((l) => (
          <button
            key={l}
            type="button"
            role="tab"
            aria-selected={tab === l}
            onClick={() => setTab(l)}
            className={`min-h-11 rounded-full border px-4 text-sm font-medium transition ${
              tab === l ? "border-rose bg-rose text-white" : "border-line bg-white text-ink hover:border-rose/50"
            }`}
          >
            {LANG_LABEL[l]}
          </button>
        ))}
      </div>

      {FIELDS.map((f) => (
        <section key={f.key} className="rounded-3xl border border-line bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-ink">{f.title}</h2>
              <p className="mt-0.5 text-sm text-muted">{f.hint}</p>
            </div>
            <button
              type="button"
              onClick={() => setValues((v) => ({ ...v, [f.key]: defaults[f.key] }))}
              className="min-h-11 shrink-0 rounded-full px-3 text-sm font-medium text-rose hover:bg-rose-soft"
            >
              Use suggested text
            </button>
          </div>
          {f.key === "announcement" && (
            <button
              type="button"
              role="switch"
              aria-checked={values.announcementEnabled}
              onClick={() => setValues((v) => ({ ...v, announcementEnabled: !v.announcementEnabled }))}
              className="mt-3 flex min-h-14 w-full items-center justify-between gap-4 rounded-2xl border border-line bg-cream/60 p-4 text-start"
            >
              <span>
                <span className="block font-medium text-ink">Show the announcement bar</span>
                <span className="block text-sm text-muted">Turn off to hide the bar. Your text is kept for later.</span>
              </span>
              <span
                className={`relative h-7 w-12 shrink-0 rounded-full transition ${values.announcementEnabled ? "bg-leaf" : "bg-line"}`}
              >
                <span
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                    values.announcementEnabled ? "start-[1.4rem]" : "start-0.5"
                  }`}
                />
              </span>
            </button>
          )}
          <textarea
            aria-label={`${f.title} in ${LANG_LABEL[tab]}`}
            rows={f.rows}
            maxLength={f.max}
            dir={isRtl(tab) ? "rtl" : "ltr"}
            lang={tab}
            value={values[f.key][tab] ?? ""}
            onChange={(e) => setText(f.key, tab, e.target.value)}
            placeholder={tab === "en" ? "" : values[f.key].en || ""}
            className={`${area} mt-3`}
          />
          <p className="mt-1 text-xs text-muted">
            {(values[f.key][tab] ?? "").length} of {f.max} letters.
            {tab !== "en" && " If empty, the English text is shown."}
          </p>
          {f.key === "announcement" && (
            <div className="mt-4 overflow-hidden rounded-xl border border-line" dir={isRtl(tab) ? "rtl" : "ltr"} lang={tab}>
              <p className="bg-cream px-3 py-1 text-xs font-medium text-muted" dir="ltr">
                Preview in {LANG_LABEL[tab]}
              </p>
              {values.announcementEnabled && tr(values.announcement, tab) ? (
                <AnnouncementBar text={tr(values.announcement, tab)} />
              ) : (
                <p className="px-4 py-3 text-center text-sm text-muted">
                  {values.announcementEnabled ? "The bar is hidden because the text is empty." : "The bar is switched off."}
                </p>
              )}
            </div>
          )}
        </section>
      ))}

      {note && (
        <p
          role={note.ok ? "status" : "alert"}
          className={`rounded-2xl px-4 py-3 text-sm ${note.ok ? "bg-mint-soft text-leaf" : "bg-red-50 text-red-700"}`}
        >
          {note.text}
        </p>
      )}

      <div className="sticky bottom-0 -mx-4 border-t border-line bg-cream/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <button
          type="submit"
          disabled={pending}
          className="min-h-12 w-full rounded-full bg-rose px-7 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgba(184,50,90,0.8)] transition hover:bg-rose-deep disabled:opacity-60 sm:w-auto"
        >
          {pending ? "Saving…" : "Save announcements"}
        </button>
      </div>
    </form>
  );
}
