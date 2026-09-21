"use client";

import { HeartIcon } from "./icons";
import { showToast, toggleSaved, useSaved } from "@/lib/saved";

export type SaveLabels = {
  save: string;
  unsave: string;
  /** Shown when the list is full, already worded for the visitor. */
  full: string;
  added: string;
};

/**
 * The heart. Saves a garland on this phone so several can be sent together in one WhatsApp message.
 * "icon" sits on a garland card. "pill" is the larger button with words, for a garland page.
 */
export default function SaveButton({
  id,
  labels,
  variant = "icon",
  className = "",
}: {
  id: string;
  labels: SaveLabels;
  variant?: "icon" | "pill";
  className?: string;
}) {
  const saved = useSaved().includes(id);

  const onClick = () => {
    const result = toggleSaved(id);
    if (result === "full") showToast(labels.full);
    else if (result === "added") showToast(labels.added);
  };

  if (variant === "pill") {
    return (
      <button
        type="button"
        aria-pressed={saved}
        onClick={onClick}
        className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition active:scale-95 ${
          saved ? "border-rose bg-rose-soft text-rose-deep" : "border-line bg-white text-ink hover:border-rose/50"
        } ${className}`}
      >
        <HeartIcon filled={saved} className={`h-5 w-5 ${saved ? "text-rose" : ""}`} />
        {saved ? labels.unsave : labels.save}
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? labels.unsave : labels.save}
      onClick={onClick}
      className={`group/heart grid h-11 w-11 place-items-center ${className}`}
    >
      <span
        className={`grid h-9 w-9 place-items-center rounded-full shadow-sm transition group-active/heart:scale-90 ${
          saved ? "bg-white text-rose" : "bg-white/90 text-ink/60 group-hover/heart:text-rose"
        }`}
      >
        <HeartIcon filled={saved} className="h-5 w-5" />
      </span>
    </button>
  );
}
