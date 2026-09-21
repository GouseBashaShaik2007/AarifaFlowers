"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { WhatsAppIcon } from "./icons";
import { trackTap } from "./track";

/** How far down the home page you scroll before the floating button appears. About one screen of the hero. */
const HOME_REVEAL_PX = 520;

/**
 * Always available chat button. Two exceptions:
 * on garland pages it is hidden because they have their own order bar, and on the home page it stays
 * out of the way until you scroll past the hero, whose own button does the same job.
 */
export default function FloatingWhatsApp({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isHome = /^\/(en|hi|te|ur)\/?$/.test(pathname);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => setScrolled(window.scrollY > HOME_REVEAL_PX);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  if (/^\/(en|hi|te|ur)\/garlands\/[^/]+/.test(pathname)) return null;
  const hidden = isHome && !scrolled;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      aria-hidden={hidden}
      tabIndex={hidden ? -1 : undefined}
      onClick={() => trackTap("general")}
      className={`fixed bottom-4 end-4 z-40 flex items-center gap-2 rounded-full bg-wa px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_-8px_rgba(21,128,61,0.8)] transition duration-300 hover:bg-wa-deep active:scale-95 sm:px-5 ${
        hidden ? "pointer-events-none translate-y-4 opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <WhatsAppIcon className="h-6 w-6" />
      <span className="hidden sm:inline">{label}</span>
    </a>
  );
}
