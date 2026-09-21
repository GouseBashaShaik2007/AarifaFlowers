"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LANGS, LANG_LABEL, type Lang } from "@/lib/catalog";
import { ChevronIcon, GlobeIcon } from "./icons";

/** Remembers the visitor's language for their next visit. */
function rememberLanguage(l: Lang) {
  try {
    document.cookie = `lang=${l}; path=/; max-age=31536000; samesite=lax`;
  } catch {
    // The cookie only remembers the choice. Navigation still works without it.
  }
}

export default function LanguageSwitcher({ lang, label }: { lang: Lang; label: string }) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const hrefFor = (l: Lang) => {
    const rest = pathname.replace(/^\/(en|hi|te|ur)(?=\/|$)/, "");
    return `/${l}${rest}${search ? `?${search}` : ""}`;
  };

  const choose = (l: Lang) => {
    rememberLanguage(l);
    setOpen(false);
  };

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        className="flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-2 text-sm font-medium text-ink shadow-sm transition hover:border-rose/50"
      >
        <GlobeIcon />
        <span>{LANG_LABEL[lang]}</span>
        <ChevronIcon className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute end-0 z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-line bg-white py-1 shadow-xl"
        >
          {LANGS.map((l) => (
            <li key={l} role="option" aria-selected={l === lang}>
              <Link
                href={hrefFor(l)}
                hrefLang={l}
                onClick={() => choose(l)}
                className={`block px-4 py-2.5 text-sm transition hover:bg-rose-soft ${
                  l === lang ? "bg-rose-soft font-semibold text-rose-deep" : "text-ink"
                }`}
              >
                {LANG_LABEL[l]}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
