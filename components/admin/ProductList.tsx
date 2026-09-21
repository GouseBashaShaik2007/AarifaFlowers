"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore, useTransition } from "react";
import { bulkDeleteAction, bulkUpdateAction } from "@/app/(admin)/admin/actions";
import { OCCASIONS, TYPES } from "@/lib/catalog";
import ProductRow, { type RowData } from "./ProductRow";

type Status = "all" | "fresh" | "unavailable" | "featured";
type Sort = "newest" | "priceAsc" | "priceDesc" | "az";

const SORTS: { id: Sort; label: string }[] = [
  { id: "newest", label: "Newest first" },
  { id: "priceAsc", label: "Price: low to high" },
  { id: "priceDesc", label: "Price: high to low" },
  { id: "az", label: "A to Z" },
];

// The compact view choice is remembered on this phone. If the browser blocks storage, it lasts until you leave the page.
const COMPACT_KEY = "aarifaAdminCompact";
const COMPACT_EVENT = "aarifa-compact-change";
let compactInMemory = false;

function subscribeCompact(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(COMPACT_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(COMPACT_EVENT, callback);
  };
}

function readCompact(): boolean {
  try {
    const saved = localStorage.getItem(COMPACT_KEY);
    if (saved !== null) return saved === "1";
  } catch {
    // Storage is blocked. Use the value kept in memory.
  }
  return compactInMemory;
}

function writeCompact(on: boolean) {
  compactInMemory = on;
  try {
    localStorage.setItem(COMPACT_KEY, on ? "1" : "0");
  } catch {
    // Not saved for next time, but it still works for now.
  }
  window.dispatchEvent(new Event(COMPACT_EVENT));
}

const selectClass =
  "min-h-12 w-full rounded-xl border border-line bg-white px-3 text-base text-ink outline-none focus:border-rose focus:ring-2 focus:ring-rose/20";

export default function ProductList({ rows }: { rows: RowData[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Status>("all");
  const [occasion, setOccasion] = useState("");
  const [type, setType] = useState("");
  const [sort, setSort] = useState<Sort>("newest");
  const compact = useSyncExternalStore(subscribeCompact, readCompact, () => false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  const counts = useMemo(
    () => ({
      all: rows.length,
      fresh: rows.filter((r) => r.available).length,
      unavailable: rows.filter((r) => !r.available).length,
      featured: rows.filter((r) => r.featured).length,
    }),
    [rows],
  );

  const shown = useMemo(() => {
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const matched = rows.filter(
      (r) =>
        words.every((w) => r.search.includes(w)) &&
        (status === "all" ||
          (status === "fresh" && r.available) ||
          (status === "unavailable" && !r.available) ||
          (status === "featured" && r.featured)) &&
        (!occasion || r.occasions.includes(occasion)) &&
        (!type || r.types.includes(type)),
    );
    // "Newest first" keeps the order the server sends.
    if (sort === "priceAsc") return [...matched].sort((a, b) => a.priceValue - b.priceValue || a.name.localeCompare(b.name));
    if (sort === "priceDesc") return [...matched].sort((a, b) => b.priceValue - a.priceValue || a.name.localeCompare(b.name));
    if (sort === "az") return [...matched].sort((a, b) => a.name.localeCompare(b.name));
    return matched;
  }, [rows, q, status, occasion, type, sort]);

  // Only garlands you can see count as selected, so a bulk action never touches hidden ones.
  const chosen = shown.filter((r) => selected.has(r.id)).map((r) => r.id);
  const allShownSelected = shown.length > 0 && chosen.length === shown.length;
  const filtering = Boolean(q.trim() || status !== "all" || occasion || type);

  const clearFilters = () => {
    setQ("");
    setStatus("all");
    setOccasion("");
    setType("");
  };

  const setOne = (id: string, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allShownSelected) shown.forEach((r) => next.delete(r.id));
      else shown.forEach((r) => next.add(r.id));
      return next;
    });

  const run = (work: () => ReturnType<typeof bulkUpdateAction>, done: string) => {
    setNote(null);
    start(async () => {
      const res = await work();
      if (!res.ok) {
        setNote({ ok: false, text: res.error });
        return;
      }
      setNote({ ok: true, text: `${done} (${res.count ?? chosen.length})` });
      setSelected(new Set());
      router.refresh();
    });
  };

  const statusTabs: { id: Status; label: string }[] = [
    { id: "all", label: "All" },
    { id: "fresh", label: "Fresh Today" },
    { id: "unavailable", label: "Not available" },
    { id: "featured", label: "Featured" },
  ];

  return (
    <div className={chosen.length > 0 ? "pb-44" : ""}>
      <div className="space-y-3 rounded-2xl border border-line bg-white p-3 sm:p-4">
        <div className="relative">
          <span aria-hidden="true" className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-muted">
            🔍
          </span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or flower"
            aria-label="Search garlands"
            enterKeyHint="search"
            className="min-h-12 w-full rounded-xl border border-line bg-white ps-11 pe-4 text-base outline-none focus:border-rose focus:ring-2 focus:ring-rose/20"
          />
        </div>

        <div role="tablist" aria-label="Status" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {statusTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={status === t.id}
              onClick={() => setStatus(t.id)}
              className={`min-h-11 shrink-0 whitespace-nowrap rounded-full border px-4 text-sm font-medium transition ${
                status === t.id ? "border-rose bg-rose text-white" : "border-line bg-white text-ink"
              }`}
            >
              {t.label} <span className="opacity-70">{counts[t.id]}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <select value={occasion} onChange={(e) => setOccasion(e.target.value)} aria-label="Occasion" className={selectClass}>
            <option value="">All occasions</option>
            {OCCASIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label.en}
              </option>
            ))}
          </select>
          <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Type" className={selectClass}>
            <option value="">All types</option>
            {TYPES.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label.en}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-2">
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort by" className={selectClass}>
            {SORTS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
          <div role="group" aria-label="Layout" className="flex rounded-xl border border-line bg-cream p-1">
            {[
              { on: false, label: "Cards" },
              { on: true, label: "Compact" },
            ].map((o) => (
              <button
                key={o.label}
                type="button"
                aria-pressed={compact === o.on}
                onClick={() => writeCompact(o.on)}
                className={`min-h-10 rounded-lg px-3 text-sm font-medium transition ${
                  compact === o.on ? "bg-white text-ink shadow-sm" : "text-muted"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex min-h-12 flex-wrap items-center justify-between gap-2">
        <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-ink">
          <input
            type="checkbox"
            checked={allShownSelected}
            onChange={toggleAll}
            disabled={shown.length === 0}
            className="h-6 w-6 cursor-pointer accent-rose"
          />
          Select all {shown.length}
        </label>
        <p className="text-sm text-muted" aria-live="polite">
          {filtering ? `${shown.length} of ${rows.length} shown` : `${rows.length} garlands`}
        </p>
      </div>

      {note && (
        <p
          role={note.ok ? "status" : "alert"}
          className={`mb-3 rounded-xl px-4 py-3 text-sm ${note.ok ? "bg-mint-soft text-leaf" : "bg-red-50 text-red-700"}`}
        >
          {note.text}
        </p>
      )}

      {shown.length > 0 ? (
        <ul className={compact ? "space-y-1.5" : "space-y-3"}>
          {shown.map((r) => (
            <ProductRow
              // A new key after a bulk change makes the row pick up the saved values.
              key={`${r.id}-${r.available}-${r.featured}`}
              row={r}
              selected={selected.has(r.id)}
              onSelect={(on) => setOne(r.id, on)}
              compact={compact}
            />
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-line bg-white/60 p-8 text-center">
          <p className="text-3xl">🔍</p>
          <p className="mt-2 font-medium text-ink">No garlands match</p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-3 min-h-11 rounded-full border border-rose px-5 text-sm font-semibold text-rose"
          >
            Clear search and filters
          </button>
        </div>
      )}

      {chosen.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-white px-3 pb-3 pt-2 shadow-[0_-8px_24px_-12px_rgba(60,30,30,0.35)]">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ink">{chosen.length} selected</p>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="min-h-11 px-2 text-sm font-medium text-muted"
              >
                Clear
              </button>
            </div>
            <div className="mt-1 flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => bulkUpdateAction(chosen, { available: true }), "Marked Fresh Today")}
                className="min-h-12 shrink-0 rounded-xl bg-leaf px-4 text-sm font-semibold text-white disabled:opacity-60"
              >
                Mark Fresh Today
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => bulkUpdateAction(chosen, { available: false }), "Marked Not available")}
                className="min-h-12 shrink-0 rounded-xl border border-line bg-white px-4 text-sm font-semibold text-ink disabled:opacity-60"
              >
                Mark Not available
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => bulkUpdateAction(chosen, { featured: true }), "Featured")}
                className="min-h-12 shrink-0 rounded-xl border border-line bg-white px-4 text-sm font-semibold text-ink disabled:opacity-60"
              >
                Feature
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => bulkUpdateAction(chosen, { featured: false }), "Removed from Featured")}
                className="min-h-12 shrink-0 rounded-xl border border-line bg-white px-4 text-sm font-semibold text-ink disabled:opacity-60"
              >
                Remove Featured
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (!window.confirm(`Delete ${chosen.length} garland${chosen.length === 1 ? "" : "s"}? This cannot be undone.`)) return;
                  run(() => bulkDeleteAction(chosen), "Deleted");
                }}
                className="min-h-12 shrink-0 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 disabled:opacity-60"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
