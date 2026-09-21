// Storage for products and photos.
//
// Two backends, chosen automatically:
//  - Supabase (when SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set). Use this on Vercel.
//  - Local files in ./data (default). Fine for running on your own computer.
//
// Server only. Never import this file from a client component.

import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Product } from "./catalog";
import { SEED_PRODUCTS } from "./seed";

const DATA_DIR = path.join(process.cwd(), "data");
const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

const BUCKET = "garlands";
const LOCAL_URL_PREFIX = "/api/uploads/";

export const usingSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

/** On Vercel the disk is read only, so local file storage cannot save anything. */
export const storageReadOnly = !usingSupabase && Boolean(process.env.VERCEL);

let client: SupabaseClient | null = null;
function supabase(): SupabaseClient {
  if (!client) {
    client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });
  }
  return client;
}

function sortProducts(list: Product[]): Product[] {
  return [...list].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

function assertWritable() {
  if (storageReadOnly) {
    throw new Error(
      "Saving is not set up yet. Add the Supabase keys in the Vercel project settings, then redeploy. See README.",
    );
  }
}

// ---------- local file backend ----------

async function readLocal(): Promise<Product[]> {
  try {
    const raw = await fs.readFile(PRODUCTS_FILE, "utf8");
    return JSON.parse(raw) as Product[];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return SEED_PRODUCTS;
    throw err;
  }
}

async function writeLocal(list: Product[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = PRODUCTS_FILE + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(list, null, 2), "utf8");
  await fs.rename(tmp, PRODUCTS_FILE);
}

// ---------- public API ----------

export async function listProducts(): Promise<Product[]> {
  if (usingSupabase) {
    const { data, error } = await supabase().from("products").select("data");
    if (error) throw new Error(`Could not load products: ${error.message}`);
    return sortProducts((data ?? []).map((row) => row.data as Product));
  }
  return sortProducts(await readLocal());
}

export async function getProduct(id: string): Promise<Product | null> {
  if (usingSupabase) {
    const { data, error } = await supabase().from("products").select("data").eq("id", id).maybeSingle();
    if (error) throw new Error(`Could not load product: ${error.message}`);
    return (data?.data as Product) ?? null;
  }
  return (await readLocal()).find((p) => p.id === id) ?? null;
}

export async function saveProduct(product: Product): Promise<void> {
  assertWritable();
  if (usingSupabase) {
    const { error } = await supabase().from("products").upsert({ id: product.id, data: product });
    if (error) throw new Error(`Could not save product: ${error.message}`);
    return;
  }
  const list = await readLocal();
  const i = list.findIndex((p) => p.id === product.id);
  if (i >= 0) list[i] = product;
  else list.push(product);
  await writeLocal(list);
}

export async function deleteProduct(id: string): Promise<void> {
  assertWritable();
  if (usingSupabase) {
    const { error } = await supabase().from("products").delete().eq("id", id);
    if (error) throw new Error(`Could not delete product: ${error.message}`);
    return;
  }
  await writeLocal((await readLocal()).filter((p) => p.id !== id));
}

export async function loadSampleProducts(): Promise<void> {
  assertWritable();
  for (const p of SEED_PRODUCTS) {
    await saveProduct(p);
  }
}

/** Stores a processed photo (full size and thumbnail) and returns the public URL of the full size one. */
export async function putImage(full: Buffer, thumb: Buffer): Promise<string> {
  assertWritable();
  const base = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const fullName = `${base}.webp`;
  const thumbName = `${base}-t.webp`;

  if (usingSupabase) {
    const bucket = supabase().storage.from(BUCKET);
    const opts = { contentType: "image/webp", cacheControl: "31536000" };
    const a = await bucket.upload(fullName, full, opts);
    if (a.error) throw new Error(`Photo upload failed: ${a.error.message}`);
    const b = await bucket.upload(thumbName, thumb, opts);
    if (b.error) throw new Error(`Photo upload failed: ${b.error.message}`);
    return bucket.getPublicUrl(fullName).data.publicUrl;
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, fullName), full);
  await fs.writeFile(path.join(UPLOAD_DIR, thumbName), thumb);
  return LOCAL_URL_PREFIX + fullName;
}

/** Deletes a photo we stored ourselves. Sample photos and unknown URLs are left alone. */
export async function removeImage(url: string): Promise<void> {
  const thumbUrl = url.replace(/\.webp$/, "-t.webp");
  try {
    if (usingSupabase) {
      const marker = `/storage/v1/object/public/${BUCKET}/`;
      const at = url.indexOf(marker);
      if (at < 0) return;
      const name = url.slice(at + marker.length);
      await supabase().storage.from(BUCKET).remove([name, name.replace(/\.webp$/, "-t.webp")]);
      return;
    }
    if (url.startsWith(LOCAL_URL_PREFIX)) {
      for (const u of [url, thumbUrl]) {
        const name = path.basename(u);
        await fs.rm(path.join(UPLOAD_DIR, name), { force: true });
      }
    }
  } catch {
    // A leftover file is harmless. Do not block the admin because of it.
  }
}
