"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isCutout } from "@/lib/catalog";
import { CloseIcon } from "./icons";

/** How far a finger travels sideways before it counts as a swipe to the next photo. */
const SWIPE_PX = 50;
/** How far a finger travels downwards before the photo is let go of. */
const DISMISS_PX = 110;
const MAX_SCALE = 4;
/** What a double tap zooms to. */
const TAP_SCALE = 2.5;

type Point = { x: number; y: number };

/**
 * A photo on its own, filling the screen, with zoom.
 *
 * Pinch with two fingers or double tap to zoom in, then drag to move around. Swipe sideways for the next photo
 * and down to close. On a computer the wheel zooms and the arrow keys change photo. Written by hand rather than
 * with a library, because all of this is a few pointer events and the site stays light.
 */
export default function PhotoZoom({
  images,
  index,
  onIndexChange,
  onClose,
  alt,
  labels,
}: {
  images: string[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
  alt: (i: number) => string;
  labels: { close: string; previous: string; next: string; hint: string; counter: string };
}) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  // Only while a finger is down: how far the photo has been dragged before we know what the drag means.
  const [drag, setDrag] = useState<Point>({ x: 0, y: 0 });

  const dialogRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const pointers = useRef(new Map<number, Point>());
  const dragFrom = useRef<{ x: number; y: number; ox: number; oy: number; at: number } | null>(null);
  const pinchFrom = useRef<{ gap: number; scale: number } | null>(null);
  const lastTap = useRef<{ at: number; x: number; y: number } | null>(null);

  const zoomed = scale > 1;

  /** The size the photo is actually drawn at when it is not zoomed, and the space it sits in. */
  const measure = useCallback(() => {
    const box = frameRef.current?.getBoundingClientRect();
    const img = imgRef.current;
    if (!box || !img?.naturalWidth) return null;
    const ratio = img.naturalWidth / img.naturalHeight;
    const width = Math.min(box.width, box.height * ratio);
    return { width, height: width / ratio, boxWidth: box.width, boxHeight: box.height };
  }, []);

  /** Keeps the photo from being dragged away past its own edges. */
  const contain = useCallback(
    (s: number, x: number, y: number): Point => {
      const m = measure();
      if (!m) return { x: 0, y: 0 };
      const roomX = Math.max(0, (m.width * s - m.boxWidth) / 2);
      const roomY = Math.max(0, (m.height * s - m.boxHeight) / 2);
      return { x: Math.min(roomX, Math.max(-roomX, x)), y: Math.min(roomY, Math.max(-roomY, y)) };
    },
    [measure],
  );

  /** Zooms while keeping whatever is under the fingers (or the pointer) in the same place on screen. */
  const zoomAround = useCallback(
    (next: number, clientX: number, clientY: number) => {
      const box = frameRef.current?.getBoundingClientRect();
      if (!box) return;
      const wanted = Math.min(MAX_SCALE, Math.max(1, next));
      setScale((current) => {
        setOffset((o) => {
          const fromCentreX = clientX - (box.left + box.width / 2);
          const fromCentreY = clientY - (box.top + box.height / 2);
          const ratio = wanted / current;
          return contain(wanted, fromCentreX - (fromCentreX - o.x) * ratio, fromCentreY - (fromCentreY - o.y) * ratio);
        });
        return wanted;
      });
    },
    [contain],
  );

  const reset = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setDrag({ x: 0, y: 0 });
  }, []);

  const step = useCallback(
    (by: number) => {
      const next = index + by;
      if (next < 0 || next >= images.length) return;
      reset();
      onIndexChange(next);
    },
    [index, images.length, onIndexChange, reset],
  );

  // A new photo always starts unzoomed.
  useEffect(() => {
    reset();
  }, [index, reset]);

  // The page behind must not scroll while the photo is open.
  useEffect(() => {
    const body = document.body;
    const before = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = before;
    };
  }, []);

  // Keyboard: Escape closes, the arrows change photo, and Tab stays inside the photo view.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
      if (e.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled])");
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, step]);

  // The wheel has to be listened for directly, so that zooming does not scroll the page as well.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomAround(scale * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.clientX, e.clientY);
    };
    frame.addEventListener("wheel", onWheel, { passive: false });
    return () => frame.removeEventListener("wheel", onWheel);
  }, [scale, zoomAround]);

  const gapBetween = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
  const middleOf = (a: Point, b: Point) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

  const onPointerDown = (e: React.PointerEvent) => {
    // Keeping the pointer is only a convenience; a browser that refuses must not break the gesture.
    try {
      (e.target as Element).setPointerCapture?.(e.pointerId);
    } catch {
      // carry on without it
    }
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      dragFrom.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y, at: Date.now() };
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchFrom.current = { gap: gapBetween(a, b), scale };
      dragFrom.current = null;
      setDrag({ x: 0, y: 0 });
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size >= 2 && pinchFrom.current) {
      const [a, b] = [...pointers.current.values()];
      const middle = middleOf(a, b);
      zoomAround((pinchFrom.current.scale * gapBetween(a, b)) / pinchFrom.current.gap, middle.x, middle.y);
      return;
    }

    const from = dragFrom.current;
    if (!from) return;
    const dx = e.clientX - from.x;
    const dy = e.clientY - from.y;
    if (zoomed) {
      setOffset(contain(scale, from.ox + dx, from.oy + dy));
    } else {
      setDrag({ x: dx, y: dy });
    }
  };

  const finishTap = (x: number, y: number) => {
    const previous = lastTap.current;
    const now = Date.now();
    if (previous && now - previous.at < 320 && Math.hypot(x - previous.x, y - previous.y) < 32) {
      lastTap.current = null;
      if (zoomed) reset();
      else zoomAround(TAP_SCALE, x, y);
      return;
    }
    lastTap.current = { at: now, x, y };
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchFrom.current = null;
    // Lifting one of two fingers should not start a drag with the finger that is still down.
    if (pointers.current.size === 1) {
      const [only] = [...pointers.current.values()];
      dragFrom.current = { x: only.x, y: only.y, ox: offset.x, oy: offset.y, at: Date.now() };
      return;
    }

    const from = dragFrom.current;
    dragFrom.current = null;
    setDrag({ x: 0, y: 0 });
    if (!from) return;

    const dx = e.clientX - from.x;
    const dy = e.clientY - from.y;
    const moved = Math.hypot(dx, dy);

    // A tap counts whether or not the photo is zoomed, so that a double tap always zooms back out again.
    if (moved < 10 && Date.now() - from.at < 400) {
      finishTap(e.clientX, e.clientY);
      return;
    }
    // Anything else while zoomed was a drag to move the photo, which has already happened.
    if (zoomed) return;

    if (dy > DISMISS_PX && dy > Math.abs(dx)) {
      onClose();
      return;
    }
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy)) {
      // Swiping against the reading direction shows the next photo. In Urdu that direction is the other way.
      const rtl = document.documentElement.dir === "rtl";
      step((dx < 0) !== rtl ? 1 : -1);
    }
  };

  const src = images[index];
  const cutout = isCutout(src);
  // While a finger is dragging an unzoomed photo it follows the finger, and fades a little on the way down.
  const sliding = !zoomed && (drag.x !== 0 || drag.y !== 0);
  const fade = sliding && drag.y > 0 ? Math.max(0.35, 1 - drag.y / (DISMISS_PX * 2.4)) : 1;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={labels.counter}
      className="fixed inset-0 z-[70] flex flex-col bg-ink/95 backdrop-blur-sm"
    >
      <div className="flex shrink-0 items-center justify-between gap-3 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 text-white">
        <p className="ps-2 text-sm font-medium tabular-nums">{images.length > 1 ? labels.counter : ""}</p>
        <button
          type="button"
          autoFocus
          onClick={onClose}
          aria-label={labels.close}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white/25 active:scale-95"
        >
          <CloseIcon className="h-6 w-6" />
        </button>
      </div>

      <div
        ref={frameRef}
        className="relative min-h-0 flex-1 touch-none overflow-hidden"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          key={src}
          src={src}
          alt={alt(index)}
          draggable={false}
          onLoad={reset}
          style={{
            transform: `translate3d(${offset.x + drag.x}px, ${offset.y + drag.y}px, 0) scale(${scale})`,
            transition: sliding ? "none" : "transform 180ms ease-out",
            opacity: fade,
          }}
          className={`absolute inset-0 m-auto max-h-full max-w-full select-none object-contain ${
            cutout ? "photo-bg rounded-3xl p-4" : ""
          }`}
        />
      </div>

      <div className="flex shrink-0 items-center justify-center gap-3 px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              disabled={index === 0}
              aria-label={labels.previous}
              className="grid h-11 w-11 place-items-center rounded-full bg-white/15 text-2xl text-white transition hover:bg-white/25 disabled:opacity-30 rtl:rotate-180"
            >
              <span aria-hidden="true">‹</span>
            </button>
            <p className="max-w-[60%] text-center text-xs text-white/70">{labels.hint}</p>
            <button
              type="button"
              onClick={() => step(1)}
              disabled={index === images.length - 1}
              aria-label={labels.next}
              className="grid h-11 w-11 place-items-center rounded-full bg-white/15 text-2xl text-white transition hover:bg-white/25 disabled:opacity-30 rtl:rotate-180"
            >
              <span aria-hidden="true">›</span>
            </button>
          </>
        )}
        {images.length === 1 && <p className="text-center text-xs text-white/70">{labels.hint}</p>}
      </div>
    </div>
  );
}
