"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { swapPhotosAction } from "@/app/(admin)/admin/actions";
import { prepareForUpload } from "@/lib/clientImages";

type Item = { id: string; name: string; images: string[] };

/** A photo is worth redoing when it is a PNG or bigger than this. A good full size photo is about 100 to 250 KB. */
const HEAVY_BYTES = 250 * 1024;
/** The new copy must be at least this much smaller, or the photo is left alone. Stops photos being redone again and again. */
const MUST_SAVE = 0.75;

const MB = 1024 * 1024;
const mb = (bytes: number) => `${(bytes / MB).toFixed(1)} MB`;

/** Only photos we stored ourselves. The sample drawings that come with the site are left alone. */
const isOurs = (url: string) => url.startsWith("/api/uploads/") || url.includes("/storage/v1/object/public/");

async function uploadCopy(full: Blob, thumb: Blob, cutout: boolean): Promise<string> {
  const form = new FormData();
  form.append("file", full, "photo");
  form.append("thumb", thumb, "thumb-photo");
  if (cutout) form.append("cutout", "1");
  const res = await fetch("/api/admin/upload", { method: "POST", body: form });
  let data: { url?: string; error?: string } = {};
  try {
    data = await res.json();
  } catch {
    // Not JSON. The status code below still says what happened.
  }
  if (!res.ok || !data.url) throw new Error(data.error || `Upload failed (error ${res.status}).`);
  return data.url;
}

/**
 * Makes the photos already on the site load faster. Photos uploaded from some phones were saved as very large
 * PNG files. This downloads each heavy photo, saves a light copy through the same steps a new upload uses,
 * points the garland at the copy and deletes the heavy one. Nothing is changed for photos that are already light.
 */
export default function PhotoTuneUp({ items }: { items: Item[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<{ ok: boolean; lines: string[] } | null>(null);

  // A photo being swapped when the page closes would be left half done, so ask first.
  useEffect(() => {
    if (!busy) return;
    const stop = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", stop);
    return () => window.removeEventListener("beforeunload", stop);
  }, [busy]);

  const total = items.reduce((n, it) => n + it.images.filter(isOurs).length, 0);

  const run = async () => {
    setBusy(true);
    setResult(null);
    let seen = 0;
    let fixed = 0;
    let garlands = 0;
    let before = 0;
    let after = 0;
    const problems: string[] = [];

    for (const item of items) {
      const swaps: { from: string; to: string }[] = [];
      for (const url of item.images.filter(isOurs)) {
        seen++;
        setProgress(`Checking photo ${seen} of ${total}…`);
        try {
          const res = await fetch(url, { cache: "no-store" });
          if (!res.ok) throw new Error(`could not be read (error ${res.status})`);
          const original = await res.blob();
          if (original.type !== "image/png" && original.size <= HEAVY_BYTES) continue;

          setProgress(`Making photo ${seen} of ${total} lighter…`);
          const { full, thumb, transparent } = await prepareForUpload(original);
          if (full.size > original.size * MUST_SAVE) continue;

          const to = await uploadCopy(full, thumb, transparent);
          swaps.push({ from: url, to });
          before += original.size;
          after += full.size;
        } catch (err) {
          problems.push(`${item.name}: ${err instanceof Error ? err.message : "a photo could not be redone"}`);
        }
      }
      if (swaps.length === 0) continue;
      const saved = await swapPhotosAction(item.id, swaps);
      if (saved.ok) {
        fixed += swaps.length;
        garlands++;
      } else {
        problems.push(`${item.name}: ${saved.error}`);
      }
    }

    const lines: string[] = [];
    if (fixed > 0) {
      lines.push(
        `Made ${fixed} photo${fixed === 1 ? "" : "s"} lighter in ${garlands} garland${garlands === 1 ? "" : "s"}. The full size photos went from ${mb(before)} to ${mb(after)}, and the small previews shrank in the same way.`,
      );
    } else if (problems.length === 0) {
      lines.push("All your photos are already light. Nothing needed changing.");
    }
    lines.push(...problems);
    setResult({ ok: problems.length === 0, lines });
    setProgress("");
    setBusy(false);
    router.refresh();
  };

  if (total === 0) return null;

  return (
    <section className="mt-5 rounded-2xl border border-line bg-white p-4" aria-labelledby="speed-heading">
      <h2 id="speed-heading" className="text-sm font-semibold text-ink">
        Photo speed
      </h2>
      <p className="mt-1 text-sm text-muted">
        Photos added from some phones are saved as very large files, which makes the website slow on mobile data. This
        makes them lighter without changing how they look. Keep this page open while it works, on Wi-Fi if you can.
      </p>
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="mt-3 min-h-12 rounded-full border-2 border-rose px-5 text-sm font-semibold text-rose transition hover:bg-rose-soft disabled:opacity-60"
      >
        {busy ? "Working…" : "Make photos load faster"}
      </button>
      {busy && progress && (
        <p role="status" className="mt-3 text-sm text-muted">
          {progress}
        </p>
      )}
      {result && (
        <div role={result.ok ? "status" : "alert"} className={`mt-3 space-y-1 rounded-xl px-4 py-3 text-sm ${result.ok ? "bg-mint-soft text-leaf" : "bg-red-50 text-red-700"}`}>
          {result.lines.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      )}
    </section>
  );
}
