"use client";

import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { thumbOf } from "@/lib/catalog";
import { prepareForUpload } from "@/lib/clientImages";

const MAX_PHOTOS = 10;

/** What the form can ask the uploader to do. */
export type UploaderHandle = {
  /**
   * Waits for photos that are still being prepared, uploads every photo that has not been added yet,
   * and returns the full list of photo addresses. Throws with a readable message if an upload fails.
   */
  flush: () => Promise<string[]>;
};
const MAX_SIDE = 1600;

type Item = {
  key: string;
  name: string;
  status: "queued" | "preparing" | "removing" | "ready" | "failed" | "uploading";
  note?: string;
  percent?: number;
  originalBlob?: Blob;
  originalUrl?: string;
  cutBlob?: Blob;
  cutUrl?: string;
  use: "cut" | "original";
  error?: string;
};

/** Shrinks a photo so it uploads quickly and the cleaning step runs fast. Keeps transparency when the file has it. */
async function downscale(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * scale));
  const h = Math.max(1, Math.round(bmp.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  const mayHaveAlpha = /png|webp|gif/.test(file.type);
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not read this photo."))),
      mayHaveAlpha ? "image/webp" : "image/jpeg",
      0.9,
    ),
  );
}

async function uploadBlob(blob: Blob, name: string): Promise<string> {
  // Crop, shrink and convert here in the browser. The server only checks and stores the result.
  const { full, thumb } = await prepareForUpload(blob);
  const form = new FormData();
  form.append("file", full, name);
  form.append("thumb", thumb, "thumb-" + name);
  const res = await fetch("/api/admin/upload", { method: "POST", body: form });
  let data: { url?: string; error?: string } = {};
  try {
    data = await res.json();
  } catch {
    // Not JSON, for example an error page from the host. The status code below still tells us what happened.
  }
  if (!res.ok || !data.url) {
    const why = res.status === 401 ? "Please log in again." : `Upload failed (error ${res.status}). Please try again.`;
    console.error("Photo upload failed", res.status, data);
    throw new Error(data.error || why);
  }
  return data.url;
}

function fileNameFor(name: string, blob: Blob): string {
  return name.replace(/\.[^.]+$/, "") + (blob.type === "image/jpeg" ? ".jpg" : ".webp");
}

export default function ImageUploader({
  images,
  onChange,
  onWaitingChange,
  ref,
}: {
  images: string[];
  onChange: (next: string[]) => void;
  ref?: Ref<UploaderHandle>;
  /** Reports how many photos are still waiting for review, so the form can warn before saving. */
  onWaitingChange?: (count: number) => void;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [autoRemove, setAutoRemove] = useState(true);
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<Item[]>([]);
  const imagesRef = useRef(images);

  const patch = useCallback((key: string, changes: Partial<Item>) => {
    setItems((list) => list.map((it) => (it.key === key ? { ...it, ...changes } : it)));
  }, []);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    itemsRef.current = items;
    onWaitingChange?.(items.length);
  }, [items, onWaitingChange]);

  // Free browser memory for previews when leaving the page.
  useEffect(
    () => () => {
      itemsRef.current.forEach((it) => {
        if (it.originalUrl) URL.revokeObjectURL(it.originalUrl);
        if (it.cutUrl) URL.revokeObjectURL(it.cutUrl);
      });
    },
    [],
  );

  const drop = (key: string) => {
    setItems((list) => {
      const it = list.find((x) => x.key === key);
      if (it?.originalUrl) URL.revokeObjectURL(it.originalUrl);
      if (it?.cutUrl) URL.revokeObjectURL(it.cutUrl);
      return list.filter((x) => x.key !== key);
    });
  };

  const processOne = async (key: string, file: File, removeBg: boolean) => {
    try {
      patch(key, { status: "preparing", note: "Preparing photo…" });
      const original = await downscale(file);
      patch(key, { originalBlob: original, originalUrl: URL.createObjectURL(original) });

      if (!removeBg) {
        patch(key, { status: "ready", use: "original", note: undefined });
        return;
      }

      patch(key, { status: "removing", note: "Removing background…", percent: undefined });
      try {
        const lib = await import("@imgly/background-removal");
        const remove = lib.removeBackground ?? lib.default;
        const cut = await remove(original, {
          model: "isnet_fp16",
          output: { format: "image/webp", quality: 0.92 },
          progress: (progressKey: string, current: number, total: number) => {
            if (progressKey.startsWith("fetch") && total > 0) {
              patch(key, {
                note: "Downloading the cleaning tool. This only happens the first time.",
                percent: Math.round((current / total) * 100),
              });
            } else if (progressKey.startsWith("compute")) {
              patch(key, { note: "Removing background…", percent: undefined });
            }
          },
        });
        patch(key, {
          status: "ready",
          cutBlob: cut,
          cutUrl: URL.createObjectURL(cut),
          use: "cut",
          note: undefined,
          percent: undefined,
        });
      } catch (err) {
        // Cleaning failed. The original photo can still be used.
        console.error("Background removal failed", err);
        patch(key, {
          status: "ready",
          use: "original",
          note: undefined,
          percent: undefined,
          error: "Background removal did not work for this photo. You can still use the original.",
        });
      }
    } catch (err) {
      console.error(err);
      patch(key, {
        status: "failed",
        note: undefined,
        error: "Could not read this photo. Please try a JPG or PNG.",
      });
    }
  };

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setMessage("");
    const room = MAX_PHOTOS - imagesRef.current.length - itemsRef.current.length;
    const chosen = Array.from(files).slice(0, Math.max(0, room));
    if (files.length > chosen.length) setMessage(`You can add up to ${MAX_PHOTOS} photos per garland.`);
    if (inputRef.current) inputRef.current.value = "";

    const fresh: Item[] = chosen.map((f) => ({
      key: crypto.randomUUID(),
      name: f.name,
      status: "queued",
      note: "Waiting…",
      use: "cut",
    }));
    setItems((list) => [...list, ...fresh]);

    // One at a time keeps phones from running out of memory.
    for (let i = 0; i < chosen.length; i++) {
      await processOne(fresh[i].key, chosen[i], autoRemove);
    }
  };

  const addItem = async (key: string) => {
    const it = itemsRef.current.find((x) => x.key === key);
    if (!it) return;
    const blob = it.use === "cut" && it.cutBlob ? it.cutBlob : it.originalBlob;
    if (!blob) return;
    patch(key, { status: "uploading", error: undefined });
    try {
      const url = await uploadBlob(blob, fileNameFor(it.name, blob));
      onChange([...imagesRef.current, url]);
      drop(key);
    } catch (err) {
      patch(key, { status: "ready", error: err instanceof Error ? err.message : "Upload failed." });
    }
  };

  const addAll = async () => {
    for (const it of itemsRef.current.filter((x) => x.status === "ready")) {
      await addItem(it.key);
    }
  };

  // Lets the form add every chosen photo when you press Save, so the extra button is optional.
  const flush = async (): Promise<string[]> => {
    const busy = ["queued", "preparing", "removing", "uploading"];
    while (itemsRef.current.some((it) => busy.includes(it.status))) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    const urls = [...imagesRef.current];
    for (const it of itemsRef.current.filter((x) => x.status === "ready")) {
      const blob = it.use === "cut" && it.cutBlob ? it.cutBlob : it.originalBlob;
      if (!blob) continue;
      patch(it.key, { status: "uploading", error: undefined });
      try {
        urls.push(await uploadBlob(blob, fileNameFor(it.name, blob)));
      } catch (err) {
        patch(it.key, { status: "ready", error: err instanceof Error ? err.message : "Upload failed." });
        throw err instanceof Error ? err : new Error("A photo could not be uploaded.");
      }
      // Keep the list up to date after every photo, so nothing is lost if a later one fails.
      imagesRef.current = [...urls];
      onChange([...urls]);
      drop(it.key);
    }
    return urls;
  };

  useImperativeHandle(ref, () => ({ flush }));

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const readyCount = items.filter((x) => x.status === "ready").length;
  const full = images.length + items.length >= MAX_PHOTOS;

  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((url, i) => (
            <li key={url} className="overflow-hidden rounded-2xl border border-line bg-white">
              <div className="photo-bg relative aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumbOf(url)} alt={`Photo ${i + 1}`} className="h-full w-full object-contain p-2" />
                {i === 0 && (
                  <span className="absolute start-2 top-2 rounded-full bg-rose px-2 py-0.5 text-[11px] font-semibold text-white">
                    Main photo
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-1 p-2 text-xs">
                <span className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label="Move earlier"
                    className="rounded-full border border-line px-2 py-1 disabled:opacity-30"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === images.length - 1}
                    aria-label="Move later"
                    className="rounded-full border border-line px-2 py-1 disabled:opacity-30"
                  >
                    →
                  </button>
                </span>
                <button
                  type="button"
                  onClick={() => onChange(images.filter((u) => u !== url))}
                  className="rounded-full px-2 py-1 font-medium text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {items.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-ink">Check your new photos</h3>
            {readyCount > 1 && (
              <button
                type="button"
                onClick={addAll}
                className="rounded-full bg-leaf px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90"
              >
                Add all {readyCount} photos
              </button>
            )}
          </div>
          <ul className="space-y-3">
            {items.map((it) => (
              <li key={it.key} className="rounded-2xl border border-line bg-white p-3">
                {(it.status === "queued" || it.status === "preparing" || it.status === "removing") && !it.cutUrl ? (
                  <div className="flex items-center gap-3">
                    <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-rose border-t-transparent" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{it.name}</p>
                      <p className="text-xs text-muted">
                        {it.note}
                        {it.percent !== undefined ? ` ${it.percent}%` : ""}
                      </p>
                      {it.percent !== undefined && (
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
                          <div className="h-full bg-rose transition-all" style={{ width: `${it.percent}%` }} />
                        </div>
                      )}
                    </div>
                    <button type="button" onClick={() => drop(it.key)} className="text-xs text-muted hover:text-red-600">
                      Cancel
                    </button>
                  </div>
                ) : it.status === "failed" ? (
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-red-700">
                      {it.name}: {it.error}
                    </p>
                    <button type="button" onClick={() => drop(it.key)} className="text-xs font-medium text-muted hover:text-red-600">
                      Dismiss
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-2 gap-3">
                      <figure>
                        <div className="photo-bg aspect-square overflow-hidden rounded-xl border border-line">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={it.originalUrl} alt="Original" className="h-full w-full object-contain" />
                        </div>
                        <figcaption className="mt-1 text-center text-xs text-muted">Before</figcaption>
                      </figure>
                      <figure>
                        <div className="checker aspect-square overflow-hidden rounded-xl border border-line">
                          {it.cutUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={it.cutUrl} alt="Background removed" className="h-full w-full object-contain" />
                          ) : (
                            <span className="grid h-full place-items-center p-3 text-center text-xs text-muted">
                              No cleaned version
                            </span>
                          )}
                        </div>
                        <figcaption className="mt-1 text-center text-xs text-muted">After</figcaption>
                      </figure>
                    </div>

                    {it.cutUrl && (
                      <div role="radiogroup" aria-label="Which photo to use" className="mt-3 flex gap-2 text-sm">
                        {(["cut", "original"] as const).map((v) => (
                          <button
                            key={v}
                            type="button"
                            role="radio"
                            aria-checked={it.use === v}
                            onClick={() => patch(it.key, { use: v })}
                            className={`flex-1 rounded-full border px-3 py-2 font-medium transition ${
                              it.use === v
                                ? "border-rose bg-rose text-white"
                                : "border-line bg-white text-ink hover:border-rose/50"
                            }`}
                          >
                            {v === "cut" ? "Use cleaned photo" : "Use original"}
                          </button>
                        ))}
                      </div>
                    )}
                    {it.error && <p className="mt-2 text-xs text-amber-700">{it.error}</p>}

                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => addItem(it.key)}
                        disabled={it.status === "uploading"}
                        className="flex-1 rounded-full bg-leaf px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                      >
                        {it.status === "uploading" ? "Adding…" : "Add this photo"}
                      </button>
                      <button
                        type="button"
                        onClick={() => drop(it.key)}
                        disabled={it.status === "uploading"}
                        className="rounded-full border border-line px-4 py-2.5 text-sm font-medium text-muted hover:text-red-600"
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <label
          className={`inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-dashed border-rose px-5 py-3 text-sm font-semibold text-rose transition hover:bg-rose-soft ${
            full ? "pointer-events-none opacity-40" : ""
          }`}
        >
          <span aria-hidden="true">📷</span>
          Choose photos
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            disabled={full}
            onChange={(e) => onFiles(e.target.files)}
          />
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={autoRemove}
            onChange={(e) => setAutoRemove(e.target.checked)}
            className="h-4 w-4 accent-rose"
          />
          Remove background automatically
        </label>
      </div>
      {message && <p className="text-sm text-amber-700">{message}</p>}
      <p className="text-xs text-muted">
        The first photo is the main photo. Photos you have chosen are added automatically when you press Save. Background
        removal runs on your device, so the first photo takes longer while the cleaning tool downloads.
      </p>
    </div>
  );
}
