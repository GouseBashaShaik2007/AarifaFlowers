import Link from "next/link";
import { Suspense } from "react";
import type { Lang } from "@/lib/catalog";
import { getDict } from "@/lib/i18n";
import { BUSINESS_NAME } from "@/lib/whatsapp";
import { FlowerLogo } from "./icons";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Header({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href={`/${lang}`} className="flex items-center gap-2.5" aria-label={BUSINESS_NAME}>
          <FlowerLogo className="h-9 w-9" />
          <span className="font-display text-xl font-semibold leading-none text-rose-deep" style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
            {BUSINESS_NAME}
          </span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-5">
          <Link
            href={`/${lang}/garlands`}
            className="hidden rounded-full px-3 py-2 text-sm font-medium text-ink transition hover:text-rose sm:block"
          >
            {t.navGarlands}
          </Link>
          <Suspense fallback={<div className="h-9 w-28" />}>
            <LanguageSwitcher lang={lang} label={t.language} />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}
