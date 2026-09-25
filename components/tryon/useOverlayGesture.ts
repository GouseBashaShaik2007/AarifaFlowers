"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type RefObject } from "react";
import type { Placement } from "@/lib/tryonCanvas";

const MIN_WIDTH = 0.12;
const MAX_WIDTH = 1.8;
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

type Point = { x: number; y: number };
/** What the garland looked like when the current finger movement began. */
type Anchor =
  | { kind: "drag"; from: Placement; start: Point }
  | { kind: "pinch"; from: Placement; distance: number; angle: number; middle: Point };

/**
 * Moves, resizes and turns a garland on a photo. One finger (or the mouse) drags it. Two fingers pinch to resize
 * and twist to turn, around the point between the fingers. The mouse wheel resizes, and the arrow keys, + - [ ] work too.
 * Plain pointer events, so nothing extra is downloaded.
 */
export function useOverlayGesture(stage: RefObject<HTMLElement | null>, initial: Placement) {
  const [placement, setPlacement] = useState<Placement>(initial);
  const latest = useRef(placement);
  const pointers = useRef(new Map<number, Point>());
  const anchor = useRef<Anchor | null>(null);

  const commit = useCallback((next: Placement) => {
    latest.current = next;
    setPlacement(next);
  }, []);

  const begin = useCallback(() => {
    const points = [...pointers.current.values()];
    if (points.length >= 2) {
      const [a, b] = points;
      anchor.current = {
        kind: "pinch",
        from: latest.current,
        distance: Math.hypot(b.x - a.x, b.y - a.y),
        angle: Math.atan2(b.y - a.y, b.x - a.x),
        middle: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      };
    } else if (points.length === 1) {
      anchor.current = { kind: "drag", from: latest.current, start: points[0] };
    } else {
      anchor.current = null;
    }
  }, []);

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (pointers.current.size >= 2) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    begin();
  };

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const from = anchor.current;
    const box = stage.current?.getBoundingClientRect();
    if (!from || !box || box.width === 0 || box.height === 0) return;

    if (from.kind === "drag") {
      const point = pointers.current.values().next().value as Point;
      commit({
        ...from.from,
        cx: clamp(from.from.cx + (point.x - from.start.x) / box.width, -0.25, 1.25),
        cy: clamp(from.from.cy + (point.y - from.start.y) / box.height, -0.25, 1.25),
      });
      return;
    }

    const [a, b] = [...pointers.current.values()];
    const distance = Math.hypot(b.x - a.x, b.y - a.y);
    if (distance < 1 || from.distance < 1) return;
    const width = clamp(from.from.w * (distance / from.distance), MIN_WIDTH, MAX_WIDTH);
    const scale = width / from.from.w;
    // Only the twist since the fingers touched, kept between -180 and 180 degrees.
    const change = Math.atan2(b.y - a.y, b.x - a.x) - from.angle;
    const twist = Math.atan2(Math.sin(change), Math.cos(change));
    const middle = { x: (a.x + b.x) / 2 - box.left, y: (a.y + b.y) / 2 - box.top };
    // Scale and twist the garland around the point between the fingers, then follow the fingers as they move.
    const offset = {
      x: from.from.cx * box.width - (from.middle.x - box.left),
      y: from.from.cy * box.height - (from.middle.y - box.top),
    };
    const turned = {
      x: offset.x * Math.cos(twist) - offset.y * Math.sin(twist),
      y: offset.x * Math.sin(twist) + offset.y * Math.cos(twist),
    };
    commit({
      cx: clamp((middle.x + turned.x * scale) / box.width, -0.25, 1.25),
      cy: clamp((middle.y + turned.y * scale) / box.height, -0.25, 1.25),
      w: width,
      rot: from.from.rot + (twist * 180) / Math.PI,
    });
  };

  const onPointerEnd = (event: PointerEvent<HTMLElement>) => {
    if (!pointers.current.delete(event.pointerId)) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    begin(); // A finger lifted: carry on from here with the fingers that are left.
  };

  /** Bigger or smaller by a factor, and turned by some degrees. */
  const nudge = useCallback(
    (factor: number, degrees = 0) => {
      const now = latest.current;
      commit({ ...now, w: clamp(now.w * factor, MIN_WIDTH, MAX_WIDTH), rot: now.rot + degrees });
    },
    [commit],
  );

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const now = latest.current;
    const step = event.shiftKey ? 0.04 : 0.01;
    const moves: Record<string, Partial<Placement>> = {
      ArrowLeft: { cx: now.cx - step },
      ArrowRight: { cx: now.cx + step },
      ArrowUp: { cy: now.cy - step },
      ArrowDown: { cy: now.cy + step },
    };
    if (moves[event.key]) {
      event.preventDefault();
      commit({ ...now, ...moves[event.key] });
    } else if (event.key === "+" || event.key === "=") nudge(1.06);
    else if (event.key === "-") nudge(1 / 1.06);
    else if (event.key === "[") nudge(1, -3);
    else if (event.key === "]") nudge(1, 3);
  };

  // The mouse wheel and a trackpad pinch resize the garland. This needs a listener that is allowed to cancel the scroll.
  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      nudge(Math.exp(-event.deltaY * (event.ctrlKey ? 0.01 : 0.0015)));
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [stage, nudge]);

  return {
    placement,
    /** Puts the garland somewhere new, for example back to where it started. */
    place: commit,
    nudge,
    handlers: { onPointerDown, onPointerMove, onPointerUp: onPointerEnd, onPointerCancel: onPointerEnd, onKeyDown },
  };
}
