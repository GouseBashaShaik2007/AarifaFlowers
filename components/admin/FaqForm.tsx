"use client";

import { useState, useTransition } from "react";
import { saveFaqAction } from "@/app/(admin)/admin/actions";
import { LANGS, LANG_LABEL, isRtl, type Lang, type Text } from "@/lib/catalog";
import { MAX_ANSWER, MAX_FAQ, MAX_QUESTION, type FaqSettings } from "@/lib/faq";

type Row = { key: string; id: string; question: Text; answer: Text };

const field =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-base outline-none focus:border-rose focus:ring-2 focus:ring-rose/20";

const toRows = (s: FaqSettings): Row[] =>
  // The rows that exist at the start use their own ids as keys, so the server and the browser agree.
  s.items.map((item) => ({ key: item.id, id: item.id, question: item.question, answer: item.answer }));

export default function FaqForm({
  initial,
  defaults,
  neverSaved,
}: {
  initial: FaqSettings;
  defaults: FaqSettings;
  neverSaved: boolean;
}) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [rows, setRows] = useState<Row[]>(() => toRows(initial));
  const [tab, setTab] = useState<Lang>("en");
  const [pending, start] = useTransition();
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  const setText = (key: string, part: "question" | "answer", lang: Lang, value: string) =>
    setRows((list) => list.map((r) => (r.key === key ? { ...r, [part]: { ...r[part], [lang]: value } } : r)));

  const move = (i: number, dir: -1 | 1) =>
    setRows((list) => {
      const j = i + dir;
      if (j < 0 || j >= list.length) return list;
      const next = [...list];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const save = () => {
    setNote(null);
    start(async () => {
      const res = await saveFaqAction({
        enabled,
        items: rows.map((r) => ({ id: r.id, question: r.question, answer: r.answer })),
      });
      setNote(res.ok ? { ok: true, text: "Saved. The website shows the new questions now." } : { ok: false, text: res.error });
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
        <h1 className="text-2xl font-semibold text-ink">FAQ</h1>
        <p className="mt-1 text-sm text-muted">
          Questions and answers shown on the home page, in every language. Change them when your rules change, for
          example the delivery charge or the notice time.
        </p>
      </div>

      {neverSaved && (
        <p className="rounded-2xl bg-marigold-soft px-4 py-3 text-sm text-ink">
          These are suggested questions and answers in all four languages. Check that they match how you work, then press
          Save.
        </p>
      )}

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => setEnabled((v) => !v)}
        className="flex min-h-14 w-full items-center justify-between gap-4 rounded-2xl border border-line bg-white p-4 text-start"
      >
        <span>
          <span className="block font-medium text-ink">Show the FAQ on the website</span>
          <span className="block text-sm text-muted">Turn off to hide the section. Your questions are kept for later.</span>
        </span>
        <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${enabled ? "bg-leaf" : "bg-line"}`}>
          <span
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
              enabled ? "start-[1.4rem]" : "start-0.5"
            }`}
          />
        </span>
      </button>

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
      {tab !== "en" && (
        <p className="text-sm text-muted">
          You are editing {LANG_LABEL[tab]}. If a question or answer is empty here, visitors see the English one.
        </p>
      )}

      <ol className="space-y-4">
        {rows.map((r, i) => (
          <li key={r.key} className="rounded-3xl border border-line bg-white p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-ink">Question {i + 1}</p>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label={`Move question ${i + 1} earlier`}
                  className="h-11 w-11 rounded-full border border-line bg-white text-lg disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === rows.length - 1}
                  aria-label={`Move question ${i + 1} later`}
                  className="h-11 w-11 rounded-full border border-line bg-white text-lg disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => setRows((list) => list.filter((x) => x.key !== r.key))}
                  className="min-h-11 rounded-full px-3 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            </div>
            <div className="mt-3 space-y-3" dir={isRtl(tab) ? "rtl" : "ltr"}>
              <div>
                <label htmlFor={`q-${r.key}`} className="mb-1.5 block text-sm font-medium text-ink" dir="ltr">
                  Question {tab === "en" && <span className="text-rose">*</span>}
                </label>
                <input
                  id={`q-${r.key}`}
                  className={field}
                  lang={tab}
                  maxLength={MAX_QUESTION}
                  value={r.question[tab] ?? ""}
                  onChange={(e) => setText(r.key, "question", tab, e.target.value)}
                  placeholder={tab === "en" ? "" : r.question.en || ""}
                />
              </div>
              <div>
                <label htmlFor={`a-${r.key}`} className="mb-1.5 block text-sm font-medium text-ink" dir="ltr">
                  Answer {tab === "en" && <span className="text-rose">*</span>}
                </label>
                <textarea
                  id={`a-${r.key}`}
                  rows={4}
                  className={field}
                  lang={tab}
                  maxLength={MAX_ANSWER}
                  value={r.answer[tab] ?? ""}
                  onChange={(e) => setText(r.key, "answer", tab, e.target.value)}
                  placeholder={tab === "en" ? "" : r.answer.en || ""}
                />
                <p className="mt-1 text-xs text-muted" dir="ltr">
                  {(r.answer[tab] ?? "").length} of {MAX_ANSWER} letters.
                </p>
              </div>
            </div>
          </li>
        ))}
      </ol>

      {rows.length === 0 && (
        <p className="rounded-2xl border border-dashed border-line bg-white px-4 py-6 text-center text-sm text-muted">
          No questions yet. The FAQ section stays hidden on the website until you add one.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={rows.length >= MAX_FAQ}
          onClick={() =>
            setRows((list) => [...list, { key: crypto.randomUUID(), id: "", question: {}, answer: {} }])
          }
          className="min-h-12 rounded-full border-2 border-dashed border-rose px-5 text-sm font-semibold text-rose transition hover:bg-rose-soft disabled:opacity-40"
        >
          + Add a question
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Replace everything on this page with the suggested questions? Nothing is saved until you press Save.")) {
              setRows(toRows(defaults));
              setEnabled(defaults.enabled);
            }
          }}
          className="min-h-12 rounded-full px-4 text-sm font-medium text-rose hover:bg-rose-soft"
        >
          Use suggested questions
        </button>
      </div>
      <p className="text-xs text-muted">Up to {MAX_FAQ} questions.</p>

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
          {pending ? "Saving…" : "Save FAQ"}
        </button>
      </div>
    </form>
  );
}
