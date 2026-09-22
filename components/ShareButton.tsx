"use client";

import { ShareIcon } from "./icons";

/**
 * Shares the garland page. On a phone this opens the phone's own share sheet, where WhatsApp is one tap away.
 * Where a browser has no share sheet, it opens WhatsApp with the message ready to send.
 */
export default function ShareButton({ label, title, text }: { label: string; title: string; text: string }) {
  const share = async () => {
    // The address without any filters or tracking that may follow it.
    const url = window.location.origin + window.location.pathname;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title, text, url });
        return;
      }
    } catch (err) {
      // Closing the share sheet is not an error, and nothing more should open.
      if (err instanceof DOMException && err.name === "AbortError") return;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-white px-4 text-sm font-semibold text-ink transition hover:border-rose/50 active:scale-95"
    >
      <ShareIcon className="h-5 w-5" />
      {label}
    </button>
  );
}
