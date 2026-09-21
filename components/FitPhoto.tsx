"use client";

import { isCutout } from "@/lib/catalog";

/**
 * How much of a photo may be cut off when it fills a tall 4:5 frame. A photo between these shapes loses at most
 * about a quarter of its width or height. Anything narrower or wider than that would lose too much of the
 * garland, so it is shown whole instead.
 */
const FILL_MIN_RATIO = 0.57;
const FILL_MAX_RATIO = 1.15;

/** Looks at the real shape of the loaded photo. Only sets a marker on the element, so nothing re-renders. */
function markFit(img: HTMLImageElement | null) {
  if (!img || !img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) return;
  const ratio = img.naturalWidth / img.naturalHeight;
  img.dataset.fit = ratio < FILL_MIN_RATIO || ratio > FILL_MAX_RATIO ? "whole" : "fill";
}

/**
 * A garland photo inside a frame that its parent has made `relative` with a shape and `overflow-hidden`.
 * An ordinary photo fills the frame and is cropped a little at the edges, leaning towards the top so the
 * top of the garland stays in view. A cut-out, or a photo that is much narrower or wider than the frame,
 * is shown whole on the soft backdrop. Nothing is ever stretched.
 */
export default function FitPhoto({
  src,
  alt,
  eager = false,
  priority = false,
  shade = false,
  className = "",
}: {
  src: string;
  alt: string;
  eager?: boolean;
  /** For the pictures a visitor sees first. Fetched at once and ahead of everything else on the page. */
  priority?: boolean;
  /** Adds a soft dark shade along the top, so a badge or button placed there can be read on any photo. */
  shade?: boolean;
  className?: string;
}) {
  const whole = isCutout(src);
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        // A photo that finished loading before the page came alive is measured here. Later ones use onLoad.
        ref={markFit}
        onLoad={(e) => markFit(e.currentTarget)}
        src={src}
        alt={alt}
        loading={eager || priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        className={`peer absolute inset-0 h-full w-full ${
          whole
            ? "object-contain p-4"
            : "object-cover object-[50%_35%] data-[fit=whole]:object-contain data-[fit=whole]:object-center data-[fit=whole]:p-4"
        } ${className}`}
      />
      {/* The shade is only for a photo that fills the frame. On the pink backdrop it would look dirty. */}
      {shade && !whole && (
        <span className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/30 to-transparent peer-data-[fit=whole]:hidden" />
      )}
    </>
  );
}
