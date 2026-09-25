// Storage for the merged "look" photos that customers share from the Try On screen.
// Server only. Never import this file from a client component.
//
// A look lives for LOOK_DAYS days. The page for it stops working after that, and a daily job deletes the file.
// Files go in the same Supabase bucket as the garland photos, in a "looks" folder. On a computer they go in ./data/uploads.

import { promises as fs } from "node:fs";
import path from "node:path";
import type { ImageType } from "./images";
import { BUCKET, UPLOAD_DIR, storageReadOnly, supabase, usingSupabase } from "./store";
import { LOOK_DAYS } from "./tryon";

const FOLDER = "looks";
const EXTENSION: Record<ImageType, string> = { "image/jpeg": "jpg", "image/webp": "webp", "image/png": "png" };
const FILE_NAME = /^[0-9a-f-]{36}\.(jpg|webp|png)$/;
const LOCAL_URL_PREFIX = "/api/uploads/";
const DAY_MS = 86_400_000;

export type Look = { url: string; createdAt: number };

/** Saves a look and returns its id. The id is random, so nobody can guess another customer's address. */
export async function putLook(data: Buffer, type: ImageType): Promise<{ id: string }> {
  if (storageReadOnly) {
    throw new Error("Saving is not set up yet. Add the Supabase keys in your hosting settings, then redeploy.");
  }
  const id = crypto.randomUUID();
  const name = `${id}.${EXTENSION[type]}`;

  if (usingSupabase) {
    // A short cache time, so a deleted look does not stay visible from a cache for long.
    const { error } = await supabase()
      .storage.from(BUCKET)
      .upload(`${FOLDER}/${name}`, data, { contentType: type, cacheControl: "3600" });
    if (error) throw new Error(`Look upload failed: ${error.message}`);
    return { id };
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, `look-${name}`), data);
  return { id };
}

/** Finds a look that has not expired. Returns null for an unknown, deleted or expired look. */
export async function findLook(id: string): Promise<Look | null> {
  const oldest = Date.now() - LOOK_DAYS * DAY_MS;

  if (usingSupabase) {
    const bucket = supabase().storage.from(BUCKET);
    const { data, error } = await bucket.list(FOLDER, { search: id, limit: 5 });
    if (error) throw new Error(`Could not load the look: ${error.message}`);
    const file = (data ?? []).find((f) => f.name.startsWith(id) && FILE_NAME.test(f.name));
    if (!file) return null;
    const createdAt = Date.parse(file.created_at ?? file.updated_at ?? "");
    if (!Number.isFinite(createdAt) || createdAt < oldest) return null;
    return { url: bucket.getPublicUrl(`${FOLDER}/${file.name}`).data.publicUrl, createdAt };
  }

  for (const ext of Object.values(EXTENSION)) {
    const name = `look-${id}.${ext}`;
    try {
      const stat = await fs.stat(path.join(UPLOAD_DIR, name));
      if (stat.mtimeMs < oldest) return null;
      return { url: LOCAL_URL_PREFIX + name, createdAt: stat.mtimeMs };
    } catch {
      // Not saved with this extension. Try the next one.
    }
  }
  return null;
}

/** Deletes looks older than LOOK_DAYS days. Returns how many were removed. Safe to run as often as you like. */
export async function purgeOldLooks(): Promise<number> {
  const oldest = Date.now() - LOOK_DAYS * DAY_MS;

  if (usingSupabase) {
    const bucket = supabase().storage.from(BUCKET);
    const { data, error } = await bucket.list(FOLDER, {
      limit: 1000,
      sortBy: { column: "created_at", order: "asc" },
    });
    if (error) throw new Error(`Could not list looks: ${error.message}`);
    const expired = (data ?? [])
      .filter((f) => FILE_NAME.test(f.name) && Date.parse(f.created_at ?? "") < oldest)
      .map((f) => `${FOLDER}/${f.name}`);
    if (expired.length === 0) return 0;
    const removal = await bucket.remove(expired);
    if (removal.error) throw new Error(`Could not delete old looks: ${removal.error.message}`);
    return expired.length;
  }

  let names: string[];
  try {
    names = await fs.readdir(UPLOAD_DIR);
  } catch {
    return 0;
  }
  let removed = 0;
  for (const name of names.filter((n) => /^look-/.test(n))) {
    const file = path.join(UPLOAD_DIR, name);
    const stat = await fs.stat(file).catch(() => null);
    if (stat && stat.mtimeMs < oldest) {
      await fs.rm(file, { force: true });
      removed++;
    }
  }
  return removed;
}
