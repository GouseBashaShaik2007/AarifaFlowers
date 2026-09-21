"use client";

import { useToast } from "@/lib/saved";

/** A short message near the bottom of the screen, for example "Saved to your list". Announced to screen readers. */
export default function SavedToast() {
  const message = useToast();
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
      {message && (
        <p className="max-w-sm rounded-full bg-ink px-5 py-3 text-center text-sm font-medium text-white shadow-lg">{message}</p>
      )}
    </div>
  );
}
