"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteProductAction, toggleProductAction } from "@/app/(admin)/admin/actions";
import Modal from "./Modal";

export type RowData = {
  id: string;
  name: string;
  /** "From ₹1,499" or "₹1,499 – ₹2,499". */
  priceText: string;
  /** Starting price in rupees, used for sorting. */
  priceValue: number;
  thumb: string | null;
  tags: string[];
  /** Lowercase text the search box looks through: names in every language, flowers, occasions, types. */
  search: string;
  occasions: string[];
  types: string[];
  available: boolean;
  featured: boolean;
  /** WhatsApp taps in the last 30 days. */
  taps: number;
  /** The exact text a customer's WhatsApp order message starts with, and the link that opens it. */
  waMessage: string;
  waHref: string;
};

/** A large, thumb friendly on/off button. */
function Switch({
  on,
  onClick,
  label,
  disabled,
}: {
  on: boolean;
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      disabled={disabled}
      className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border px-3 text-sm font-medium transition disabled:opacity-60 ${
        on ? "border-leaf/40 bg-mint-soft text-ink" : "border-line bg-white text-muted"
      }`}
    >
      <span>{label}</span>
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? "bg-leaf" : "bg-line"}`}>
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
            on ? "start-[1.4rem]" : "start-0.5"
          }`}
        />
      </span>
    </button>
  );
}

function Preview({ row, open, onClose }: { row: RowData; open: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(row.waMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Some browsers block copying. The text stays selectable in the box.
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="WhatsApp message preview">
      <p className="text-sm text-muted">This is what a customer sends you when they press Order on WhatsApp for this garland.</p>
      <div className="mt-3 rounded-2xl rounded-tr-sm bg-[#d9fdd3] p-4 text-sm text-[#111b21]">
        <p className="whitespace-pre-wrap break-words" data-testid="wa-message">
          {row.waMessage}
        </p>
      </div>
      <p className="mt-2 text-xs text-muted">
        The message is always in English, whichever language the customer browses in. It opens in a chat with your
        number.
      </p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
        <a
          href={row.waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-12 flex-1 items-center justify-center rounded-xl bg-wa px-5 text-sm font-semibold text-white"
        >
          Open in WhatsApp
        </a>
        <button
          type="button"
          onClick={copy}
          className="min-h-12 flex-1 rounded-xl border border-line bg-white px-5 text-sm font-semibold text-ink"
        >
          {copied ? "Copied" : "Copy message"}
        </button>
        <button type="button" onClick={onClose} className="min-h-12 rounded-xl px-5 text-sm font-medium text-muted">
          Close
        </button>
      </div>
    </Modal>
  );
}

export default function ProductRow({
  row,
  selected,
  onSelect,
  compact,
}: {
  row: RowData;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  compact: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [state, setState] = useState({ available: row.available, featured: row.featured });
  const [error, setError] = useState("");
  const [previewing, setPreviewing] = useState(false);

  const toggle = (field: "available" | "featured") => {
    setError("");
    setState((s) => ({ ...s, [field]: !s[field] }));
    start(async () => {
      const res = await toggleProductAction(row.id, field);
      if (!res.ok) {
        setState((s) => ({ ...s, [field]: !s[field] }));
        setError(res.error);
      } else {
        router.refresh();
      }
    });
  };

  const remove = () => {
    if (!window.confirm(`Delete "${row.name}"? This cannot be undone.`)) return;
    setError("");
    start(async () => {
      const res = await deleteProductAction(row.id);
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  };

  const frame = `rounded-2xl border bg-white transition ${selected ? "border-rose ring-2 ring-rose/25" : "border-line"}`;

  const checkbox = (
    <label className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center">
      <input
        type="checkbox"
        checked={selected}
        onChange={(e) => onSelect(e.target.checked)}
        aria-label={`Select ${row.name}`}
        className="h-6 w-6 cursor-pointer accent-rose"
      />
    </label>
  );

  // One short line per garland, for scrolling through a long list.
  if (compact) {
    return (
      <li className={`${frame} flex flex-wrap items-center gap-1 px-1 py-1`}>
        {checkbox}
        <div className="photo-bg h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-line">
          {row.thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.thumb} alt="" className="h-full w-full object-contain p-1" />
          ) : (
            <span className="grid h-full place-items-center text-xl">💐</span>
          )}
        </div>
        <Link href={`/admin/products/${row.id}`} className="flex min-h-12 min-w-0 flex-1 flex-col justify-center px-2">
          <span className="truncate text-sm font-semibold text-ink">{row.name}</span>
          <span className="truncate text-xs text-rose-deep">
            {row.priceText}
            {state.featured ? " · ★ Featured" : ""}
          </span>
        </Link>
        <button
          type="button"
          role="switch"
          aria-checked={state.available}
          aria-label={`Fresh Today: ${row.name}`}
          onClick={() => toggle("available")}
          disabled={pending}
          className="flex min-h-12 w-16 shrink-0 flex-col items-center justify-center gap-0.5 disabled:opacity-60"
        >
          <span className={`relative h-6 w-11 rounded-full transition ${state.available ? "bg-leaf" : "bg-line"}`}>
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                state.available ? "start-[1.4rem]" : "start-0.5"
              }`}
            />
          </span>
          <span className="text-[10px] font-medium text-muted">Fresh</span>
        </button>
        {error && (
          <p role="alert" className="basis-full rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}
      </li>
    );
  }

  return (
    <li className={`${frame} p-3 sm:p-4`}>
      <div className="flex items-start gap-2 sm:gap-3">
        <div className="-ms-1 -mt-1">{checkbox}</div>
        <div className="photo-bg h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-xl border border-line sm:h-24 sm:w-24">
          {row.thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.thumb} alt="" className="h-full w-full object-contain p-1.5" />
          ) : (
            <span className="grid h-full place-items-center text-3xl">💐</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 font-semibold leading-snug text-ink">{row.name}</p>
          <p className="mt-0.5 text-sm text-rose-deep">{row.priceText}</p>
          {row.tags.length > 0 && <p className="mt-0.5 line-clamp-1 text-xs text-muted">{row.tags.join(" · ")}</p>}
          {row.taps > 0 && (
            <p className="mt-0.5 text-xs font-medium text-wa">
              {row.taps} WhatsApp {row.taps === 1 ? "tap" : "taps"} in 30 days
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Switch on={state.available} onClick={() => toggle("available")} label="Fresh Today" disabled={pending} />
        <Switch on={state.featured} onClick={() => toggle("featured")} label="Featured" disabled={pending} />
      </div>

      <div className="mt-2 flex gap-2">
        <Link
          href={`/admin/products/${row.id}`}
          className="flex min-h-12 flex-1 items-center justify-center rounded-xl border border-line font-semibold text-ink transition hover:border-rose hover:text-rose"
        >
          Edit
        </Link>
        <button
          type="button"
          onClick={() => setPreviewing(true)}
          aria-label={`Preview WhatsApp message for ${row.name}`}
          className="flex min-h-12 min-w-12 items-center justify-center gap-1.5 rounded-xl border border-line px-3 text-sm font-medium text-wa transition hover:border-wa"
        >
          <span aria-hidden="true">💬</span>
          <span>Preview</span>
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="min-h-12 rounded-xl px-4 font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
        >
          Delete
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {previewing && <Preview row={row} open={previewing} onClose={() => setPreviewing(false)} />}
    </li>
  );
}
