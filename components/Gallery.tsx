"use client";

import { useState } from "react";
import { isCutout, thumbOf } from "@/lib/catalog";

export default function Gallery({ images, name, altTemplate }: { images: string[]; name: string; altTemplate: string }) {
  const [active, setActive] = useState(0);
  const alt = (i: number) => altTemplate.replace("{n}", String(i + 1)).replace("{name}", name);

  if (images.length === 0) {
    return <div className="photo-bg grid aspect-[4/5] place-items-center rounded-3xl border border-line text-6xl">💐</div>;
  }

  return (
    <div className="space-y-3">
      {/* The same tall 4:5 shape as the cards. The whole photo is shown here, so a customer sees all of the garland. */}
      <div className="photo-bg relative aspect-[4/5] overflow-hidden rounded-3xl border border-line">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={images[active]}
          src={images[active]}
          alt={alt(active)}
          className={`absolute inset-0 h-full w-full object-contain ${isCutout(images[active]) ? "p-5 sm:p-8" : ""}`}
        />
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
