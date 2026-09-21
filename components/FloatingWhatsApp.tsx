"use client";

import { usePathname } from "next/navigation";
import { WhatsAppIcon } from "./icons";
import { trackTap } from "./track";

/** Always visible chat button. Hidden on product pages, which have their own order bar. */
export default function FloatingWhatsApp({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  if (/^\/(en|hi|te|ur)\/garlands\/[^/]+/.test(pathname)) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      onClick={() => trackTap("general")}
      className="fixed bottom-4 end-4 z-40 flex items-center gap-2 rounded-full bg-wa px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_-8px_rgba(21,128,61,0.8)] transition hover:bg-wa-deep active:scale-95 sm:px-5"
    >
      <WhatsAppIcon className="h-6 w-6" />
      <span className="hidden sm:inline">{label}</span>
    </a>
  );
}
