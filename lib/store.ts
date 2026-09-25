// Storage for products and photos.
//
// Two backends, chosen automatically:
//  - Supabase (when SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set). Use this on Cloudflare or Vercel.
//  - Local files in ./data (default). Fine for running on your own computer.
//
// Server only. Never import this file from a client component.

import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { thumbOf, type Product } from "./catalog";
import { SEED_PRODUCTS } from "./seed";

const DATA_DIR = path.join(process.cwd(), "data");
const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

export const BUCKET = "garlands";
const LOCAL_URL_PREFIX = "/api/uploads/";

export const usingSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

/** True when running on Cloudflare Workers, which have no disk to save files on. */
const onCloudflare = typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";

/** On Cloudflare and Vercel the disk is read only, so local file storage cannot save anything. */
export const storageReadOnly = !usingSupabase && (onCloudflare || Boolean(process.env.VERCEL));

let client: SupabaseClient | null = null;
export function supabase(): SupabaseClient {
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
      "Saving is not set up yet. Add the Supabase keys (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY) in your hosting settings, then redeploy. See README.",
    );
  }
}

// ---------- local file backend ----------

async function readLocal(): Promise<Product[]> {
  try {
    const raw = await fs.readFile(PRODUCTS_FILE, "utf8");
    return JSON.parse(raw) as Product[];
  } catch (err) {
    // A copy, so saving a garland never changes the built-in sample list itself.
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [...SEED_PRODUCTS];
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

/** Saves many garlands with one write. Faster and safer than saving them one by one. */
export async function saveProducts(products: Product[]): Promise<void> {
  assertWritable();
  if (products.length === 0) return;
  if (usingSupabase) {
    const { error } = await supabase()
      .from("products")
      .upsert(products.map((p) => ({ id: p.id, data: p })));
    if (error) throw new Error(`Could not save products: ${error.message}`);
    return;
  }
  const list = await readLocal();
  for (const product of products) {
    const i = list.findIndex((p) => p.id === product.id);
    if (i >= 0) list[i] = product;
    else list.push(product);
  }
  await writeLocal(list);
}

/** Deletes many garlands with one write. */
export async function deleteProducts(ids: string[]): Promise<void> {
  assertWritable();
  if (ids.length === 0) return;
  if (usingSupabase) {
    const { error } = await supabase().from("products").delete().in("id", ids);
    if (error) throw new Error(`Could not delete products: ${error.message}`);
    return;
  }
  const gone = new Set(ids);
  await writeLocal((await readLocal()).filter((p) => !gone.has(p.id)));
}

export async function loadSampleProducts(): Promise<void> {
  assertWritable();
  for (const p of SEED_PRODUCTS) {
    await saveProduct(p);
  }
}

// ---------- documents: announcements and reviews ----------
// A tiny key-value store for content that is not a garland. Supabase uses the "settings" table.

const CONTENT_FILE = path.join(DATA_DIR, "content.json");

async function readContentFile(): Promise<Record<string, unknown>> {
  try {
    return JSON.parse(await fs.readFile(CONTENT_FILE, "utf8")) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/** Returns null when nothing is saved yet, or when it cannot be read. The site then falls back to its defaults. */
export async function readDoc<T>(key: string): Promise<T | null> {
  if (usingSupabase) {
    const { data, error } = await supabase().from("settings").select("data").eq("key", key).maybeSingle();
    if (error) {
      console.error(`Could not read "${key}": ${error.message}`);
      return null;
    }
    return (data?.data as T) ?? null;
  }
  return ((await readContentFile())[key] as T) ?? null;
}

/**
 * Reads several documents with a single request to the database. Every page needs the announcement texts, the FAQ,
 * the reels and the stories, and asking for them one by one made each page wait for four extra round trips.
 * A key with nothing saved is simply missing from the result.
 */
export async function readDocs(keys: string[]): Promise<Record<string, unknown>> {
  if (usingSupabase) {
    const { data, error } = await supabase().from("settings").select("key, data").in("key", keys);
    if (error) {
      console.error(`Could not read ${keys.join(", ")}: ${error.message}`);
      return {};
    }
    return Object.fromEntries((data ?? []).map((row) => [row.key as string, row.data]));
  }
  const all = await readContentFile();
  return Object.fromEntries(keys.filter((k) => all[k] !== undefined).map((k) => [k, all[k]]));
}

export async function writeDoc(key: string, value: unknown): Promise<void> {
  assertWritable();
  if (usingSupabase) {
    const { error } = await supabase()
      .from("settings")
      .upsert({ key, data: value, updated_at: new Date().toISOString() });
    if (error) {
      throw new Error(
        `Could not save. In Supabase, run supabase.sql again so the settings table exists. Details: ${error.message}`,
      );
    }
    return;
  }
  const docs = await readContentFile();
  docs[key] = value;
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = CONTENT_FILE + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(docs, null, 2), "utf8");
  await fs.rename(tmp, CONTENT_FILE);
}

// ---------- WhatsApp tap counts ----------
// One counter per garland per day (India time). No visitor information is stored.

const TAPS_FILE = path.join(DATA_DIR, "taps.json");
type TapData = Record<string, Record<string, number>>;
let tapQueue: Promise<unknown> = Promise.resolve();

const indiaDay = (msAgo = 0) =>
  new Date(Date.now() - msAgo).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

async function readTaps(): Promise<TapData> {
  try {
    return JSON.parse(await fs.readFile(TAPS_FILE, "utf8")) as TapData;
  } catch {
    return {};
  }
}

export async function recordTap(id: string): Promise<void> {
  if (usingSupabase) {
    const { error } = await supabase().rpc("increment_tap", { p_id: id, p_day: indiaDay() });
    if (error) throw new Error(`Could not count tap: ${error.message}`);
    return;
  }
  if (storageReadOnly) return; // nowhere to save on a read only disk
  // One at a time, so two quick taps do not overwrite each other.
  tapQueue = tapQueue
    .then(async () => {
      const data = await readTaps();
      const day = indiaDay();
      data[id] = { ...data[id], [day]: (data[id]?.[day] ?? 0) + 1 };
      const oldest = indiaDay(90 * 86_400_000);
      for (const key of Object.keys(data)) {
        for (const d of Object.keys(data[key])) if (d < oldest) delete data[key][d];
      }
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(TAPS_FILE, JSON.stringify(data), "utf8");
    })
    .catch(() => undefined);
  await tapQueue;
}

/** Taps per garland id (plus "general" and "custom") over the last N days. */
export async function getTapCounts(days = 30): Promise<Record<string, number>> {
  const since = indiaDay((days - 1) * 86_400_000);
  const totals: Record<string, number> = {};
  if (usingSupabase) {
    const { data, error } = await supabase().from("taps").select("product_id, count").gte("day", since);
    if (error) throw new Error(`Could not load tap counts: ${error.message}`);
    for (const row of data ?? []) {
      totals[row.product_id] = (totals[row.product_id] ?? 0) + Number(row.count);
    }
    return totals;
  }
  const data = await readTaps();
  for (const [id, byDay] of Object.entries(data)) {
    for (const [day, n] of Object.entries(byDay)) if (day >= since) totals[id] = (totals[id] ?? 0) + n;
  }
  return totals;
}

const IMAGE_EXTENSION: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };

/**
 * Stores a processed photo (full size and thumbnail) and returns the public URL of the full size one.
 * The file name says what the file really is. A cut-out with a see-through background gets -c in its name.
 */
export async function putImage(full: Buffer, thumb: Buffer, contentType = "image/webp", cutout = false): Promise<string> {
  assertWritable();
  const ext = IMAGE_EXTENSION[contentType] ?? "webp";
  const base = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}${cutout ? "-c" : ""}`;
  const fullName = `${base}.${ext}`;
  const thumbName = `${base}-t.${ext}`;

  if (usingSupabase) {
    const bucket = supabase().storage.from(BUCKET);
    const opts = { contentType, cacheControl: "31536000" };
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

/** Stores an MP4 video and returns its public address. */
export async function putVideo(data: Buffer): Promise<string> {
  assertWritable();
  const name = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.mp4`;

  if (usingSupabase) {
    const bucket = supabase().storage.from(BUCKET);
    const { error } = await bucket.upload(name, data, { contentType: "video/mp4", cacheControl: "31536000" });
    if (error) throw new Error(`Video upload failed: ${error.message}`);
    return bucket.getPublicUrl(name).data.publicUrl;
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, name), data);
  return LOCAL_URL_PREFIX + name;
}

/** Deletes a photo we stored ourselves. Sample photos and unknown URLs are left alone. */
export async function removeImage(url: string): Promise<void> {
  const thumbUrl = thumbOf(url);
  try {
    if (usingSupabase) {
      const marker = `/storage/v1/object/public/${BUCKET}/`;
      const at = url.indexOf(marker);
      if (at < 0) return;
      const name = url.slice(at + marker.length);
      await supabase().storage.from(BUCKET).remove([name, thumbOf(name)]);
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
