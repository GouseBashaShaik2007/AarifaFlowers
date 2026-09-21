import Link from "next/link";
import LoadSamplesButton from "@/components/admin/LoadSamplesButton";
import ProductRow, { type RowData } from "@/components/admin/ProductRow";
import { OCCASIONS, TYPES, label, thumbOf, tr } from "@/lib/catalog";
import { requireAdmin } from "@/lib/auth";
import { listProducts, storageReadOnly, usingSupabase } from "@/lib/store";
import { formatPrice } from "@/lib/whatsapp";

export default async function AdminDashboard() {
  await requireAdmin();
  const products = await listProducts();

  const rows: RowData[] = products.map((p) => ({
    id: p.id,
    name: tr(p.name, "en"),
    price: formatPrice(p.price),
    thumb: p.images[0] ? thumbOf(p.images[0]) : null,
    tags: [...p.occasions.map((o) => label(OCCASIONS, o, "en")), ...p.types.map((o) => label(TYPES, o, "en"))],
    available: p.available,
    featured: p.featured,
  }));

  const freshCount = products.filter((p) => p.available).length;

  return (
    <div>
      {storageReadOnly && (
        <div role="alert" className="mb-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Saving is not set up yet</p>
          <p className="mt-1">
            You can look around, but changes cannot be saved until the Supabase keys are added in Vercel. The README
            explains the steps.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Garlands</h1>
          <p className="text-sm text-muted">
            {products.length} products · {freshCount} fresh today ·{" "}
            {usingSupabase ? "saved online" : "saved on this computer"}
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-rose px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgba(184,50,90,0.8)] transition hover:bg-rose-deep"
        >
          + Add garland
        </Link>
      </div>

      {rows.length > 0 ? (
        <ul className="mt-6 space-y-3">
          {rows.map((r) => (
            <ProductRow key={r.id} row={r} />
          ))}
        </ul>
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
              className="rounded-full bg-rose px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-deep"
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
