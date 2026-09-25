"use client";

import { useMemo, useState, useTransition } from "react";
import { saveHeroAction } from "@/app/(admin)/admin/actions";
import HeroPicture, { type HeroPic } from "@/components/HeroPicture";
import { MAX_HERO, pickHeroCandidates } from "@/lib/hero";

type Candidate = { id: string; name: string; thumb: string; image: string; featured: boolean; hasPhoto: true };

/**
 * Picks which garlands appear in the home page hero, and in what order. Leave fewer than three chosen and the
 * newest Featured garlands fill the rest, exactly as the home page itself does, so the preview here never lies.
 */
export default function HeroForm({ initial, candidates }: { initial: string[]; candidates: Candidate[] }) {
  const byId = useMemo(() => new Map(candidates.map((c) => [c.id, c])), [candidates]);
  const [chosen, setChosen] = useState<string[]>(() => initial.filter((id) => byId.has(id)));
  const [query, setQuery] = useState("");
  const [pending, start] = useTransition();
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  const toggle = (id: string) =>
    setChosen((list) => (list.includes(id) ? list.filter((x) => x !== id) : list.length >= MAX_HERO ? list : [...list, id]));

  const move = (i: number, dir: -1 | 1) =>
    setChosen((list) => {
      const j = i + dir;
      if (j < 0 || j >= list.length) return list;
      const next = [...list];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  // The same rule the home page uses: the picks first, then the newest Featured garlands fill any empty slots.
  const previewPics: HeroPic[] = useMemo(
    () => pickHeroCandidates(chosen, candidates).map((c) => ({ image: c.image, alt: c.name })),
    [chosen, candidates],
  );

  const filtered = candidates.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase()));

  const save = () => {
    setNote(null);
    start(async () => {
      const res = await saveHeroAction(chosen);
      setNote(res.ok ? { ok: true, text: "Saved. The home page shows this now." } : { ok: false, text: res.error });
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
        <h1 className="text-2xl font-semibold text-ink">Home page</h1>
        <p className="mt-1 text-sm text-muted">
          Choose up to {MAX_HERO} garlands for the picture at the top of the home page, and put your best one first.
          Leave a slot empty and your newest Featured garland fills it, so the home page is never blank.
        </p>
      </div>

      <section className="rounded-3xl border border-line bg-gradient-to-br from-[#fff0df] via-cream to-[#ffe3ec] p-6 sm:p-8">
        <p className="mb-4 text-sm font-medium text-ink">Preview</p>
        {previewPics.length > 0 ? (
          <HeroPicture pics={previewPics} />
        ) : (
          <p className="text-sm text-muted">Add a photo to a garland, or mark one Featured, to see a preview here.</p>
        )}
      </section>

      {chosen.length > 0 && (
        <section className="rounded-3xl border border-line bg-white p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-ink">Your picks, in order</h2>
          <p className="mt-0.5 text-sm text-muted">The first one is the large center photo. The next two are the round photos.</p>
          <ol className="mt-4 space-y-2">
            {chosen.map((id, i) => {
              const c = byId.get(id);
              if (!c) return null;
              return (
                <li key={id} className="flex items-center gap-3 rounded-2xl border border-line bg-cream/60 p-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-rose text-sm font-semibold text-white">
                    {i + 1}
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.thumb} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{c.name}</span>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      aria-label={`Move ${c.name} earlier`}
                      className="h-10 w-10 rounded-full border border-line bg-white text-base disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === chosen.length - 1}
                      aria-label={`Move ${c.name} later`}
                      className="h-10 w-10 rounded-full border border-line bg-white text-base disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => toggle(id)}
                      className="min-h-10 rounded-full px-3 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <section className="rounded-3xl border border-line bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-ink">All garlands with a photo</h2>
        <p className="mt-0.5 text-sm text-muted">Tap up to {MAX_HERO} to add them above.</p>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name"
          className="mt-3 min-h-11 w-full rounded-full border border-line bg-white px-4 text-sm outline-none focus:border-rose focus:ring-2 focus:ring-rose/20"
        />
        {filtered.length > 0 ? (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {filtered.map((c) => {
              const on = chosen.includes(c.id);
              const full = !on && chosen.length >= MAX_HERO;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => toggle(c.id)}
                    disabled={full}
                    aria-pressed={on}
                    className={`flex w-full flex-col items-start gap-2 rounded-2xl border-2 p-2 text-start transition disabled:opacity-40 ${
                      on ? "border-rose bg-rose-soft" : "border-line bg-white hover:border-rose/40"
                    }`}
                  >
                    <span className="relative block aspect-square w-full overflow-hidden rounded-xl bg-cream-deep">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.thumb} alt="" className="h-full w-full object-cover" />
                      {on && (
                        <span className="absolute end-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-rose text-xs font-bold text-white">
                          ✓
                        </span>
                      )}
                    </span>
                    <span className="line-clamp-2 text-xs font-medium text-ink">{c.name}</span>
                    {c.featured && <span className="text-[11px] font-semibold text-rose-deep">★ Featured</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted">No garlands match &ldquo;{query}&rdquo;.</p>
        )}
      </section>

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
          {pending ? "Saving…" : "Save home page"}
        </button>
      </div>
    </form>
  );
}
