"use client";

import { useEffect, useRef } from "react";

/** The height of the header including its bottom border. The bar under it (the filter chips) moves up by this much. */
const HEADER_PX = 65;
/** How far the page must move before the header reacts, so a tiny wobble of the thumb does nothing. */
const MOVE_PX = 8;
/** Near the top of the page the header is always shown. */
const TOP_PX = 60;

/**
 * The top bar. It stays at the top, slides away while the visitor scrolls down to read, and slides back as soon as
 * they scroll up. Screen space is small on a phone, so this gives the garlands more room.
 * The page's --header-offset variable follows it, so a bar that sticks below the header (the filter chips) moves
 * up into the free space and back.
 */
export default function ScrollHeader({ children }: { children: React.ReactNode }) {
  const header = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    let last = window.scrollY;
    let hidden = false;
    let waiting = false;

    const show = (value: boolean) => {
      const shouldHide = !value;
      if (shouldHide === hidden) return;
      hidden = shouldHide;
      header.current?.setAttribute("data-hidden", String(hidden));
      root.style.setProperty("--header-offset", hidden ? "0px" : `${HEADER_PX}px`);
    };

    const check = () => {
      waiting = false;
      const y = window.scrollY;
      const moved = y - last;
      if (y < TOP_PX) show(true);
      // Someone using the keyboard or the language menu has a reason to see the header, so leave it alone.
      else if (moved > MOVE_PX && !header.current?.contains(document.activeElement)) show(false);
      else if (moved < -MOVE_PX) show(true);
      if (Math.abs(moved) > MOVE_PX) last = y;
    };

    const onScroll = () => {
      if (waiting) return;
      waiting = true;
      requestAnimationFrame(check);
    };
    const onFocus = () => show(true);

    const node = header.current;
    window.addEventListener("scroll", onScroll, { passive: true });
    node?.addEventListener("focusin", onFocus);
    return () => {
      window.removeEventListener("scroll", onScroll);
      node?.removeEventListener("focusin", onFocus);
      root.style.removeProperty("--header-offset");
    };
  }, []);

  return (
    <header
      ref={header}
      className="sticky top-0 z-40 border-b border-line bg-cream/90 backdrop-blur transition-transform duration-200 motion-reduce:transition-none data-[hidden=true]:-translate-y-full"
    >
      {children}
    </header>
  );
}
