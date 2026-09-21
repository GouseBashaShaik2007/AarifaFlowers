import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import WhatsAppButton from "@/components/WhatsAppButton";
import { OCCASIONS, TYPES, isLang, type Lang } from "@/lib/catalog";
import { fmt, getDict } from "@/lib/i18n";
import { listProducts } from "@/lib/store";
import { customMessage, waLink } from "@/lib/whatsapp";

type Search = { occasion?: string; type?: string; fresh?: string };

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return { title: getDict(lang).allGarlands };
}

function href(lang: Lang, q: Search) {
  const sp = new URLSearchParams();
  if (q.occasion) sp.set("occasion", q.occasion);
  if (q.type) sp.set("type", q.type);
  if (q.fresh) sp.set("fresh", "1");
  const s = sp.toString();
  return `/${lang}/garlands${s ? `?${s}` : ""}`;
}

function Chip({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={to}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition ${
        active
          ? "border-rose bg-rose text-white shadow-sm"
          : "border-line bg-white text-ink hover:border-rose/50 hover:text-rose"
      }`}
    >
      {children}
    </Link>
  );
}

export default async function GarlandsPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Search>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getDict(lang);
  const sp = await searchParams;

  const occasion = OCCASIONS.some((o) => o.id === sp.occasion) ? sp.occasion : undefined;
  const type = TYPES.some((o) => o.id === sp.type) ? sp.type : undefined;
  const fresh = sp.fresh === "1" ? "1" : undefined;
  const current: Search = { occasion, type, fresh };

  const all = await listProducts();
  const shown = all.filter(
    (p) =>
      (!occasion || p.occasions.includes(occasion as never)) &&
      (!type || p.types.includes(type as never)) &&
      (!fresh || p.available),
  );
  const hasFilters = Boolean(occasion || type || fresh);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="h-display text-3xl font-semibold text-ink sm:text-4xl">{t.allGarlands}</h1>

      <div className="mt-6 space-y-4 rounded-3xl border border-line bg-white p-4 sm:p-5">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t.filterOccasion}</p>
          <div className="flex flex-wrap gap-2">
            <Chip to={href(lang, { ...current, occasion: undefined })} active={!occasion}>
              {t.all}
            </Chip>
            {OCCASIONS.map((o) => (
              <Chip key={o.id} to={href(lang, { ...current, occasion: o.id })} active={occasion === o.id}>
                {o.label[lang]}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t.filterType}</p>
          <div className="flex flex-wrap gap-2">
            <Chip to={href(lang, { ...current, type: undefined })} active={!type}>
              {t.all}
            </Chip>
            {TYPES.map((o) => (
              <Chip key={o.id} to={href(lang, { ...current, type: o.id })} active={type === o.id}>
                {o.label[lang]}
              </Chip>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Chip to={href(lang, { ...current, fresh: fresh ? undefined : "1" })} active={Boolean(fresh)}>
            🌿 {t.freshOnly}
          </Chip>
          {hasFilters && (
            <Link href={href(lang, {})} className="px-2 text-sm font-medium text-rose hover:text-rose-deep">
              {t.clearFilters}
            </Link>
          )}
        </div>
      </div>

      <p className="mt-6 text-sm text-muted">{fmt(t.garlandsCount, { n: shown.length })}</p>

      {shown.length > 0 ? (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {shown.map((p) => (
            <li key={p.id}>
              <ProductCard product={p} lang={lang} t={t} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 rounded-3xl border border-dashed border-line bg-white/60 p-10 text-center text-muted">
          <p className="text-4xl">💐</p>
          <p className="mt-3">{t.noResults}</p>
        </div>
      )}

      {occasion === "custom" && (
        <div className="mt-10 flex flex-col items-start gap-4 rounded-3xl bg-peach-soft p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-ink">✨ {t.customTitle}</h2>
            <p className="mt-1 text-sm text-muted">{t.customText}</p>
          </div>
          <WhatsAppButton href={waLink(customMessage)}>{t.customCta}</WhatsAppButton>
        </div>
      )}
    </div>
  );
}
