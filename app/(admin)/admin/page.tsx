import Link from "next/link";
import DailyReset from "@/components/admin/DailyReset";
import LoadSamplesButton from "@/components/admin/LoadSamplesButton";
import ProductList from "@/components/admin/ProductList";
import type { RowData } from "@/components/admin/ProductRow";
import { FLOWERS, LANGS, OCCASIONS, TYPES, label, thumbOf, tr } from "@/lib/catalog";
import { requireAdmin } from "@/lib/auth";
import { getTapCounts, listProducts, storageReadOnly, usingSupabase } from "@/lib/store";
import { formatPrice, formatPriceRange, productMessage, waLink } from "@/lib/whatsapp";

export default async function AdminDashboard() {
  await requireAdmin();
  const products = await listProducts();

  // Counting taps is a bonus. If it fails, the rest of the page still works.
  let taps: Record<string, number> = {};
  try {
    taps = await getTapCounts(30);
  } catch (err) {
    console.error(err);
  }

  const rows: RowData[] = products.map((p) => ({
    id: p.id,
    name: tr(p.name, "en"),
    priceText: p.maxPrice && p.maxPrice > p.price ? formatPriceRange(p.price, p.maxPrice) : `From ${formatPrice(p.price)}`,
    priceValue: p.price,
    thumb: p.images[0] ? thumbOf(p.images[0]) : null,
    tags: [...p.occasions.map((o) => label(OCCASIONS, o, "en")), ...p.types.map((o) => label(TYPES, o, "en"))],
    search: [
      ...LANGS.map((l) => p.name[l] ?? ""),
      ...p.flowers.map((f) => label(FLOWERS, f, "en")),
      ...p.occasions.map((o) => label(OCCASIONS, o, "en")),
      ...p.types.map((o) => label(TYPES, o, "en")),
    ]
      .join(" ")
      .toLowerCase(),
    occasions: p.occasions,
    types: p.types,
    available: p.available,
    featured: p.featured,
    taps: taps[p.id] ?? 0,
    waMessage: productMessage(p),
    waHref: waLink(productMessage(p)),
  }));

  const top = rows
    .filter((r) => r.taps > 0)
    .sort((a, b) => b.taps - a.taps)
    .slice(0, 5);
  const topMax = top[0]?.taps ?? 1;
  const otherTaps = (taps.general ?? 0) + (taps.custom ?? 0);
  const freshCount = products.filter((p) => p.available).length;

  return (
    <div>
      {storageReadOnly && (
        <div role="alert" className="mb-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Saving is not set up yet</p>
          <p className="mt-1">
            You can look around, but changes cannot be saved until the Supabase keys are added in your hosting settings (Cloudflare). The README
            explains the steps.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Garlands</h1>
          <p className="text-sm text-muted">
            {products.length} products · {freshCount} fresh today · {usingSupabase ? "saved online" : "saved on this computer"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DailyReset total={products.length} notFresh={products.length - freshCount} />
          <Link
            href="/admin/products/new"
            className="flex min-h-12 items-center rounded-full bg-rose px-6 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgba(184,50,90,0.8)] transition hover:bg-rose-deep"
          >
            + Add garland
          </Link>
        </div>
      </div>

      {rows.length > 0 && (
        <section className="mt-5 rounded-2xl border border-line bg-white p-4" aria-labelledby="top-heading">
          <h2 id="top-heading" className="text-sm font-semibold text-ink">
            Most requested on WhatsApp <span className="font-normal text-muted">last 30 days</span>
          </h2>
          {top.length > 0 ? (
            <ol className="mt-3 space-y-2.5">
              {top.map((r, i) => (
                <li key={r.id}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate text-ink">
                      {i + 1}. {r.name}
                    </span>
                    <span className="shrink-0 font-semibold text-wa">{r.taps}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
                    <div className="h-full rounded-full bg-wa" style={{ width: `${Math.max(6, (r.taps / topMax) * 100)}%` }} />
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-2 text-sm text-muted">
              No taps yet. A tap is counted each time a customer presses Order on WhatsApp. Your own taps are not counted.
            </p>
          )}
          {otherTaps > 0 && (
            <p className="mt-3 text-xs text-muted">
              Other buttons (general chat and custom design): {otherTaps}
            </p>
          )}
        </section>
      )}

      {rows.length > 0 ? (
        <div className="mt-5">
          <ProductList rows={rows} />
        </div>
      ) : (
        <div className="mt-8 rounded-3xl border border-dashed border-line bg-white/60 p-10 text-center">
          <p className="text-4xl">💐</p>
          <p className="mt-3 font-medium text-ink">No garlands yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            Add your first garland, or load a few sample garlands to see how the website looks.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/admin/products/new"
              className="flex min-h-12 items-center rounded-full bg-rose px-5 text-sm font-semibold text-white hover:bg-rose-deep"
            >
              + Add garland
            </Link>
            <LoadSamplesButton />
          </div>
        </div>
      )}
    </div>
  );
}
