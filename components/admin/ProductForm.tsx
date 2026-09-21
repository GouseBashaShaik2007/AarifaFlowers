"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteProductAction, saveProductAction } from "@/app/(admin)/admin/actions";
import {
  FLOWERS,
  LANGS,
  LANG_LABEL,
  OCCASIONS,
  TYPES,
  type Lang,
  type Product,
  type Text,
} from "@/lib/catalog";
import ImageUploader from "./ImageUploader";

type Option = { id: string; label: Record<Lang, string>; emoji: string };

function Chips({
  options,
  value,
  onChange,
}: {
  options: readonly Option[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o.id);
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((v) => v !== o.id) : [...value, o.id])}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              on ? "border-rose bg-rose text-white" : "border-line bg-white text-ink hover:border-rose/50"
            }`}
          >
            {o.emoji} {o.label.en}
          </button>
        );
      })}
    </div>
  );
}

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-line bg-white p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Toggle({
  on,
  onChange,
  title,
  text,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  title: string;
  text: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-line p-4 text-start transition hover:border-rose/40"
    >
      <span>
        <span className="block font-medium text-ink">{title}</span>
        <span className="block text-sm text-muted">{text}</span>
      </span>
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? "bg-leaf" : "bg-line"}`}>
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
            on ? "start-[1.4rem]" : "start-0.5"
          }`}
        />
      </span>
    </button>
  );
}

const input =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-base outline-none focus:border-rose focus:ring-2 focus:ring-rose/20";

export default function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [waiting, setWaiting] = useState(0);

  const [name, setName] = useState<Text>(product?.name ?? {});
  const [description, setDescription] = useState<Text>(product?.description ?? {});
  const [tab, setTab] = useState<Lang>("en");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [occasions, setOccasions] = useState<string[]>(product?.occasions ?? []);
  const [types, setTypes] = useState<string[]>(product?.types ?? []);
  const [flowers, setFlowers] = useState<string[]>(product?.flowers ?? []);
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [available, setAvailable] = useState(product?.available ?? true);
  const [featured, setFeatured] = useState(product?.featured ?? false);

  const setLang = (setter: typeof setName, lang: Lang, value: string) =>
    setter((prev) => ({ ...prev, [lang]: value }));

  const save = () => {
    setError("");
    if (!name.en?.trim()) {
      setTab("en");
      setError("Please enter the English name of the garland.");
      return;
    }
    const numeric = Number(price);
    if (price.trim() === "" || !Number.isFinite(numeric) || numeric < 0) {
      setError("Please enter the starting price in rupees.");
      return;
    }
    if (waiting > 0 && !window.confirm(`${waiting} new photo(s) have not been added yet and will be lost. Save anyway?`)) {
      return;
    }
    start(async () => {
      const res = await saveProductAction({
        id: product?.id,
        name,
        description,
        price: numeric,
        occasions,
        types,
        flowers,
        images,
        available,
        featured,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push("/admin");
      router.refresh();
    });
  };

  const remove = () => {
    if (!product) return;
    if (!window.confirm(`Delete "${product.name.en}"? This cannot be undone.`)) return;
    start(async () => {
      const res = await deleteProductAction(product.id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push("/admin");
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="space-y-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink">{product ? "Edit garland" : "Add a garland"}</h1>
        <Link href="/admin" className="text-sm font-medium text-muted hover:text-rose">
          ← Back to list
        </Link>
      </div>

      <Card
        title="Photos"
        hint="Add clear photos. The background is removed automatically, and you can compare before and after."
      >
        <ImageUploader images={images} onChange={setImages} onWaitingChange={setWaiting} />
      </Card>

      <Card title="Name and description" hint="English is required. Other languages are optional. If empty, the English text is shown.">
        <div role="tablist" className="mb-4 flex flex-wrap gap-2">
          {LANGS.map((l) => {
            const filled = Boolean(name[l]?.trim());
            return (
              <button
                key={l}
                type="button"
                role="tab"
                aria-selected={tab === l}
                onClick={() => setTab(l)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  tab === l ? "border-rose bg-rose text-white" : "border-line bg-white text-ink hover:border-rose/50"
                }`}
              >
                {LANG_LABEL[l]}
                {l !== "en" && filled && <span className="ms-1.5 text-xs opacity-80">✓</span>}
              </button>
            );
          })}
        </div>
        <div className="space-y-4" dir={tab === "ur" ? "rtl" : "ltr"}>
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-ink" dir="ltr">
              Name {tab === "en" && <span className="text-rose">*</span>}
            </label>
            <input
              id="name"
              className={input}
              value={name[tab] ?? ""}
              onChange={(e) => setLang(setName, tab, e.target.value)}
              placeholder={tab === "en" ? "Premium Rose & Jasmine Bridal Garland" : name.en || ""}
              maxLength={120}
              lang={tab}
            />
          </div>
          <div>
            <label htmlFor="desc" className="mb-1.5 block text-sm font-medium text-ink" dir="ltr">
              Description
            </label>
            <textarea
              id="desc"
              rows={4}
              className={input}
              value={description[tab] ?? ""}
              onChange={(e) => setLang(setDescription, tab, e.target.value)}
              placeholder={tab === "en" ? "Two to four lines about the garland." : description.en || ""}
              maxLength={1200}
              lang={tab}
            />
          </div>
        </div>
      </Card>

      <Card title="Price" hint="Customers see this as the starting price. You confirm the final price on WhatsApp.">
        <label htmlFor="price" className="mb-1.5 block text-sm font-medium text-ink">
          Starting price (₹) <span className="text-rose">*</span>
        </label>
        <div className="relative max-w-xs">
          <span className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-muted">₹</span>
          <input
            id="price"
            className={`${input} ps-9`}
            inputMode="numeric"
            type="number"
            min={0}
            step={1}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="1499"
          />
        </div>
      </Card>

      <Card title="Occasion and type" hint="Pick everything that fits. A garland can belong to more than one.">
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium text-ink">Occasion</p>
            <Chips options={OCCASIONS} value={occasions} onChange={setOccasions} />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-ink">Type (optional)</p>
            <Chips options={TYPES} value={types} onChange={setTypes} />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-ink">Flowers used (optional)</p>
            <Chips options={FLOWERS} value={flowers} onChange={setFlowers} />
          </div>
        </div>
      </Card>

      <Card title="Show on website">
        <div className="space-y-3">
          <Toggle
            on={available}
            onChange={setAvailable}
            title="Fresh Today"
            text="Shows the green Fresh Today badge. Turn off when you cannot make it today."
          />
          <Toggle
            on={featured}
            onChange={setFeatured}
            title="Featured"
            text="Shows this garland in Best sellers on the home page."
          />
        </div>
      </Card>

      {error && (
        <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-cream/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        {product ? (
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="rounded-full px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            Delete garland
          </button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3">
          <Link href="/admin" className="rounded-full border border-line bg-white px-5 py-2.5 text-sm font-medium text-ink">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-rose px-7 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgba(184,50,90,0.8)] transition hover:bg-rose-deep disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save garland"}
          </button>
        </div>
      </div>
    </form>
  );
}
