import Link from "next/link";
import { Suspense } from "react";
import type { Lang } from "@/lib/catalog";
import { getDict } from "@/lib/i18n";
import { BUSINESS_NAME } from "@/lib/whatsapp";
import { FlowerLogo } from "./icons";
import LanguageSwitcher from "./LanguageSwitcher";
import SavedLink from "./SavedLink";
import ScrollHeader from "./ScrollHeader";

export default function Header({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  return (
    <ScrollHeader>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:gap-3 sm:px-6">
        {/* min-w-0 lets the name shrink instead of pushing the page sideways on a very narrow screen. */}
        <Link href={`/${lang}`} className="flex min-w-0 items-center gap-2.5" aria-label={BUSINESS_NAME}>
          <FlowerLogo className="h-9 w-9 shrink-0" />
          <span
            className="truncate font-display text-xl font-semibold leading-none text-rose-deep"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            {BUSINESS_NAME}
          </span>
        </Link>
        <nav className="flex shrink-0 items-center gap-1 sm:gap-5">
          <Link
            href={`/${lang}/garlands`}
            className="hidden rounded-full px-3 py-2 text-sm font-medium text-ink transition hover:text-rose sm:block"
          >
            {t.navGarlands}
          </Link>
          <Link
            href={`/${lang}/custom`}
            className="hidden rounded-full px-3 py-2 text-sm font-medium text-ink transition hover:text-rose sm:block"
          >
            {t.navCustom}
          </Link>
          <SavedLink href={`/${lang}/saved`} label={t.savedNav} />
          <Suspense fallback={<div className="h-11 w-16" />}>
            <LanguageSwitcher lang={lang} label={t.language} />
          </Suspense>
        </nav>
      </div>
    </ScrollHeader>
  );
}
