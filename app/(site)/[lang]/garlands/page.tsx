import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import FilterBar from "@/components/FilterBar";
import { SearchIcon } from "@/components/icons";
import SortSelect from "@/components/SortSelect";
import ProductCard from "@/components/ProductCard";
import WhatsAppButton from "@/components/WhatsAppButton";
import { FLOWERS, LANGS, OCCASIONS, TYPES, isLang, label, type Lang } from "@/lib/catalog";
import { fmt, getDict } from "@/lib/i18n";
import { getProducts } from "@/lib/publicData";
import { customMessage, waLink } from "@/lib/whatsapp";

type Search = { occasion?: string; type?: string; fresh?: string; q?: string; sort?: string };

/** The ways to order the list. Newest first is the normal order and is not written in the address. */
const SORTS = ["newest", "low", "high"] as const;

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
  if (q.q) sp.set("q", q.q);
  if (q.sort) sp.set("sort", q.sort);
  const s = sp.toString();
  return `/${lang}/garlands${s ? `?${s}` : ""}`;
}

function Chip({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={to}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={`flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full border px-4 text-sm font-medium transition ${
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
  // What the visitor typed in the search box. Every word has to match somewhere in the garland's details.
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 60) : "";
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const sort = sp.sort === "low" || sp.sort === "high" ? sp.sort : undefined;
  const current: Search = { occasion, type, fresh, q: q || undefined, sort };

  const all = await getProducts();
  const searchable = (p: (typeof all)[number]) =>
    [
      ...LANGS.map((l) => p.name[l] ?? ""),
      p.description.en ?? "",
      p.description[lang] ?? "",
      ...p.flowers.flatMap((f) => [label(FLOWERS, f, "en"), label(FLOWERS, f, lang)]),
      ...p.occasions.flatMap((o) => [label(OCCASIONS, o, "en"), label(OCCASIONS, o, lang)]),
      ...p.types.flatMap((o) => [label(TYPES, o, "en"), label(TYPES, o, lang)]),
    ]
      .join(" ")
      .toLowerCase();
  const matching = all.filter(
    (p) =>
      (!occasion || p.occasions.includes(occasion as never)) &&
      (!type || p.types.includes(type as never)) &&
      (!fresh || p.available) &&
      (words.length === 0 || words.every((w) => searchable(p).includes(w))),
  );
  const shown = sort === "low" ? [...matching].sort((a, b) => a.price - b.price) : sort === "high" ? [...matching].sort((a, b) => b.price - a.price) : matching;
  const hasFilters = Boolean(occasion || type || fresh || q);

  return (
    <div>
      <div className="mx-auto max-w-6xl px-4 pb-5 pt-8 sm:px-6 sm:pt-10">
        <h1 className="h-display text-3xl font-semibold text-ink sm:text-4xl">{t.allGarlands}</h1>

        {/* An ordinary form, so it works without any script. The other choices ride along as hidden fields. */}
        <form action={`/${lang}/garlands`} method="get" role="search" className="mt-5 flex gap-2">
          {occasion && <input type="hidden" name="occasion" value={occasion} />}
          {type && <input type="hidden" name="type" value={type} />}
          {fresh && <input type="hidden" name="fresh" value="1" />}
          {sort && <input type="hidden" name="sort" value={sort} />}
          <div className="relative min-w-0 flex-1">
            <SearchIcon className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              maxLength={60}
              placeholder={t.searchPlaceholder}
              aria-label={t.searchPlaceholder}
              enterKeyHint="search"
              className="min-h-12 w-full rounded-full border border-line bg-white ps-11 pe-4 text-base outline-none focus:border-rose focus:ring-2 focus:ring-rose/20"
            />
          </div>
          <button
            type="submit"
            className="min-h-12 shrink-0 rounded-full bg-rose px-5 text-sm font-semibold text-white transition hover:bg-rose-deep active:scale-[0.98]"
          >
            {t.searchButton}
          </button>
        </form>
      </div>

      {/* Stays under the header while the list scrolls, so you can switch occasion from anywhere in the list. */}
      <FilterBar
          label={t.filters}
          activeCount={[type, fresh].filter(Boolean).length}
          primary={
            <>
              <Chip to={href(lang, { ...current, occasion: undefined })} active={!occasion}>
                {t.all}
              </Chip>
              {OCCASIONS.map((o) => (
                <Chip key={o.id} to={href(lang, { ...current, occasion: o.id })} active={occasion === o.id}>
                  {o.label[lang]}
                </Chip>
              ))}
            </>
          }
          more={
            <>
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
              </div>
            </>
          }
      />

      <div className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted">{fmt(t.garlandsCount, { n: shown.length })}</p>
          <div className="flex items-center gap-1">
            {hasFilters && (
              <Link href={href(lang, { sort })} className="flex min-h-11 items-center px-2 text-sm font-medium text-rose hover:text-rose-deep">
                {t.clearFilters}
              </Link>
            )}
            <SortSelect
              label={t.sortLabel}
              value={sort ?? "newest"}
              options={SORTS.map((s) => ({
                value: s,
                label: s === "low" ? t.sortPriceLow : s === "high" ? t.sortPriceHigh : t.sortNewest,
                href: href(lang, { ...current, sort: s === "newest" ? undefined : s }),
              }))}
            />
          </div>
        </div>

        {shown.length > 0 ? (
          <ul className="mt-2 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {shown.map((p, i) => (
              <li key={p.id}>
                {/* The first row is what a visitor sees first, so its pictures are fetched at once. */}
                <ProductCard product={p} lang={lang} t={t} priority={i < 2} />
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
            <WhatsAppButton href={waLink(customMessage)} track="custom">
              {t.customCta}
            </WhatsAppButton>
          </div>
        )}
      </div>
    </div>
  );
}
