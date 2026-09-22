"use client";

import { useRef, useState } from "react";
import { isCutout, thumbOf } from "@/lib/catalog";

/** How far a finger must travel sideways for a swipe, in pixels. */
const SWIPE_PX = 45;

export default function Gallery({ images, name, altTemplate }: { images: string[]; name: string; altTemplate: string }) {
  const [active, setActive] = useState(0);
  const start = useRef<{ x: number; y: number } | null>(null);
  const alt = (i: number) => altTemplate.replace("{n}", String(i + 1)).replace("{name}", name);

  if (images.length === 0) {
    return <div className="photo-bg grid aspect-[4/5] place-items-center rounded-3xl border border-line text-6xl">💐</div>;
  }

  const go = (step: number) => setActive((i) => Math.min(images.length - 1, Math.max(0, i + step)));

  // A swipe is a mostly sideways move. Up and down still scrolls the page, because the frame allows vertical panning.
  const onRelease = (e: React.PointerEvent) => {
    const from = start.current;
    start.current = null;
    if (!from || images.length < 2) return;
    const dx = e.clientX - from.x;
    const dy = e.clientY - from.y;
    if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    // Swiping towards the reading direction shows the next photo. In Urdu that direction is right to left.
    const rtl = document.documentElement.dir === "rtl";
    go((dx < 0) !== rtl ? 1 : -1);
  };

  return (
    <div className="space-y-3">
      {/* The same tall 4:5 shape as the cards. The whole photo is shown here, so a customer sees all of the garland. */}
      <div
        className="photo-bg relative aspect-[4/5] touch-pan-y select-none overflow-hidden rounded-3xl border border-line"
        onPointerDown={(e) => (start.current = { x: e.clientX, y: e.clientY })}
        onPointerUp={onRelease}
        onPointerCancel={() => (start.current = null)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={images[active]}
          src={images[active]}
          alt={alt(active)}
          draggable={false}
          className={`absolute inset-0 h-full w-full object-contain ${isCutout(images[active]) ? "p-5 sm:p-8" : ""}`}
        />
        {images.length > 1 && (
          <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {images.map((src, i) => (
              <span
                key={src}
                className={`h-2 rounded-full shadow-sm transition-all ${i === active ? "w-5 bg-rose" : "w-2 bg-white/90"}`}
              />
            ))}
          </span>
        )}
      </div>
      {images.length > 1 && (
        <ul className="flex gap-2.5 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <li key={src} className="shrink-0">
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={alt(i)}
                aria-current={i === active}
                className={`photo-bg block h-20 w-20 overflow-hidden rounded-2xl border-2 transition sm:h-24 sm:w-24 ${
                  i === active ? "border-rose" : "border-line hover:border-rose/40"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumbOf(src)} alt="" className={`h-full w-full ${isCutout(src) ? "object-contain p-1.5" : "object-cover"}`} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
