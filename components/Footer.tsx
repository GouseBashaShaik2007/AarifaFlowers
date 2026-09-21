import Link from "next/link";
import type { Lang } from "@/lib/catalog";
import { getDict } from "@/lib/i18n";
import { BUSINESS_NAME, WHATSAPP_DISPLAY, WHATSAPP_NUMBER, generalMessage, waLink } from "@/lib/whatsapp";
import { FlowerLogo, WhatsAppIcon } from "./icons";

export default function Footer({ lang, delivery }: { lang: Lang; delivery: string }) {
  const t = getDict(lang);
  return (
    <footer className="mt-20 border-t border-line bg-cream-deep/60">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <FlowerLogo className="h-9 w-9" />
            <span className="text-xl font-semibold text-rose-deep" style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
              {BUSINESS_NAME}
            </span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-muted">{t.tagline}</p>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">{t.navGarlands}</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <Link className="hover:text-rose" href={`/${lang}`}>
                {t.navHome}
              </Link>
            </li>
            <li>
              <Link className="hover:text-rose" href={`/${lang}/garlands`}>
                {t.allGarlands}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">{t.contactUs}</h2>
          <a
            href={waLink(generalMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-wa hover:text-wa-deep"
          >
            <WhatsAppIcon />
            <bdi>{WHATSAPP_DISPLAY}</bdi>
          </a>
          {delivery && (
            <p className="mt-3 text-sm text-muted">
              <span className="font-semibold text-ink">{t.delivery}: </span>
              {delivery}
            </p>
          )}
          <span className="sr-only">{WHATSAPP_NUMBER}</span>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} {BUSINESS_NAME}. {t.rights}.
      </div>
    </footer>
  );
}
