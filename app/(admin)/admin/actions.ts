"use server";

import { redirect } from "next/navigation";
import { endSession, isAdmin, loginConfigured, passwordMatches, startSession } from "@/lib/auth";
import {
  FLOWER_IDS,
  LANGS,
  OCCASION_IDS,
  TYPE_IDS,
  type FlowerId,
  type OccasionId,
  type Product,
  type Text,
  type TypeId,
} from "@/lib/catalog";
import { deleteProduct, getProduct, loadSampleProducts, removeImage, saveProduct } from "@/lib/store";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

async function guard(): Promise<ActionResult | null> {
  return (await isAdmin()) ? null : { ok: false, error: "Please log in again." };
}

// ---------- login ----------

export async function loginAction(_prev: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  if (!loginConfigured()) {
    return { error: "The admin password is not set. Add ADMIN_PASSWORD in the environment settings." };
  }
  const password = String(formData.get("password") ?? "");
  if (!passwordMatches(password)) {
    // A short pause makes guessing passwords slow.
    await new Promise((r) => setTimeout(r, 800));
    return { error: "That password is not correct." };
  }
  await startSession();
  redirect("/admin");
}

export async function logoutAction() {
  await endSession();
  redirect("/admin/login");
}

// ---------- products ----------

export type ProductInput = {
  id?: string;
  name: Text;
  description: Text;
  price: number;
  occasions: string[];
  types: string[];
  flowers: string[];
  images: string[];
  available: boolean;
  featured: boolean;
};

function cleanText(input: Text, max: number): Text {
  const out: Text = {};
  for (const l of LANGS) {
    const v = (input?.[l] ?? "").toString().trim().slice(0, max);
    if (v) out[l] = v;
  }
  return out;
}

function pick<T extends string>(values: string[], allowed: readonly T[]): T[] {
  return allowed.filter((a) => values.includes(a));
}

function slugify(s: string): string {
  const base = s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${base || "garland"}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function saveProductAction(input: ProductInput): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;

  try {
    const name = cleanText(input.name, 120);
    if (!name.en) return { ok: false, error: "Please enter the English name." };

    const price = Math.round(Number(input.price));
    if (!Number.isFinite(price) || price < 0 || price > 10_000_000) {
      return { ok: false, error: "Please enter a valid starting price." };
    }

    const images = (input.images ?? [])
      .filter((u) => typeof u === "string" && u.length < 600 && (u.startsWith("/") || u.startsWith("https://")))
      .slice(0, 10);

    const existing = input.id ? await getProduct(input.id) : null;
    const now = new Date().toISOString();

    const product: Product = {
      id: existing?.id ?? slugify(name.en),
      name,
      description: cleanText(input.description, 1200),
      price,
      occasions: pick<OccasionId>(input.occasions ?? [], OCCASION_IDS),
      types: pick<TypeId>(input.types ?? [], TYPE_IDS),
      flowers: pick<FlowerId>(input.flowers ?? [], FLOWER_IDS),
      images,
      available: Boolean(input.available),
      featured: Boolean(input.featured),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    await saveProduct(product);

    // Delete photos that were taken off this product.
    if (existing) {
      for (const old of existing.images) {
        if (!images.includes(old)) await removeImage(old);
      }
    }
    return { ok: true, id: product.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not save." };
  }
}

export async function deleteProductAction(id: string): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;
  try {
    const existing = await getProduct(id);
    await deleteProduct(id);
    if (existing) for (const url of existing.images) await removeImage(url);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not delete." };
  }
}

export async function toggleProductAction(id: string, field: "available" | "featured"): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;
  try {
    const p = await getProduct(id);
    if (!p) return { ok: false, error: "Product not found." };
    await saveProduct({ ...p, [field]: !p[field], updatedAt: new Date().toISOString() });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not update." };
  }
}

export async function loadSamplesAction(): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;
  try {
    await loadSampleProducts();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not add sample products." };
  }
}
