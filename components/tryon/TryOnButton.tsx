"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { Product } from "@/lib/catalog";
import type { Dictionary } from "@/lib/i18n";

// The Try On screen is only downloaded when someone presses the button.
const VirtualTryOnModal = dynamic(() => import("./VirtualTryOnModal"), { ssr: false });

/** The "Try it on" button on a garland page. */
export default function TryOnButton({ product, t }: { product: Product; t: Dictionary }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-rose bg-white px-6 py-3 text-base font-semibold text-rose transition hover:bg-rose-soft active:scale-[0.98] sm:w-auto"
      >
        <span aria-hidden="true">✨</span>
        {t.tryOn}
      </button>
      {open && <VirtualTryOnModal product={product} t={t} onClose={() => setOpen(false)} />}
    </>
  );
}
