"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteProductAction, toggleProductAction } from "@/app/(admin)/admin/actions";

export type RowData = {
  id: string;
  name: string;
  price: string;
  thumb: string | null;
  tags: string[];
  available: boolean;
  featured: boolean;
};

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
      className="flex items-center gap-2 text-sm text-ink disabled:opacity-60"
    >
      <span className={`relative h-6 w-11 rounded-full transition ${on ? "bg-leaf" : "bg-line"}`}>
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            on ? "start-[1.4rem]" : "start-0.5"
          }`}
        />
      </span>
      <span>{label}</span>
    </button>
  );
}

export default function ProductRow({ row }: { row: RowData }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [state, setState] = useState({ available: row.available, featured: row.featured });
  const [error, setError] = useState("");

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

  return (
    <li className="rounded-2xl border border-line bg-white p-3 sm:p-4">
      <div className="flex gap-3 sm:gap-4">
        <div className="photo-bg h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-line sm:h-24 sm:w-24">
          {row.thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.thumb} alt="" className="h-full w-full object-contain p-1.5" />
          ) : (
            <span className="grid h-full place-items-center text-3xl">💐</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{row.name}</p>
              <p className="text-sm text-rose-deep">From {row.price}</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Link
                href={`/admin/products/${row.id}`}
                className="rounded-full border border-line px-4 py-1.5 font-medium text-ink hover:border-rose hover:text-rose"
              >
                Edit
              </Link>
              <button
                type="button"
                onClick={remove}
                disabled={pending}
                className="rounded-full px-3 py-1.5 font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
              >
                Delete
              </button>
            </div>
          </div>
          {row.tags.length > 0 && (
            <p className="mt-1 line-clamp-1 text-xs text-muted">{row.tags.join(" · ")}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
            <Switch on={state.available} onClick={() => toggle("available")} label="Fresh Today" disabled={pending} />
            <Switch on={state.featured} onClick={() => toggle("featured")} label="Featured" disabled={pending} />
          </div>
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </li>
  );
}
