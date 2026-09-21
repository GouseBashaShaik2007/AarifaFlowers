"use client";

import { useState } from "react";
import { LANGS, LANG_LABEL, isRtl, thumbOf } from "@/lib/catalog";
import type { Suggestion } from "@/lib/suggestion";

const MAX_PHOTOS_FOR_AI = 3;

/** Loads a saved photo, puts it on white (cut-outs are transparent) and returns base64 JPEG data. */
async function photoForAi(url: string): Promise<string> {
  const res = await fetch(thumbOf(url));
  if (!res.ok) throw new Error("Could not read one of the photos.");
  const bmp = await createImageBitmap(await res.blob());
  const scale = Math.min(1, 768 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bmp.width * scale));
  canvas.height = Math.max(1, Math.round(bmp.height * scale));
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  return canvas.toDataURL("image/jpeg", 0.85).split(",")[1];
}

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "result"; suggestion: Suggestion };

export default function AiSuggest({
  images,
  occasions,
  types,
  flowers,
  enabled,
  onUse,
}: {
  images: string[];
  occasions: string[];
  types: string[];
  flowers: string[];
  enabled: boolean;
  onUse: (s: Suggestion) => void;
}) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const hasPhotos = images.length > 0;
  const canRun = enabled && hasPhotos && state.kind !== "loading";

  const run = async () => {
    setState({ kind: "loading" });
    try {
      const photos = await Promise.all(images.slice(0, MAX_PHOTOS_FOR_AI).map(photoForAi));
      const res = await fetch("/api/admin/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: photos, occasions, types, flowers }),
      });
      let data: (Suggestion & { error?: string }) | { error?: string } = {};
      try {
        data = await res.json();
      } catch {
        // Not JSON. The generic message below covers it.
      }
      if (!res.ok || !("name" in data)) {
        throw new Error(("error" in data && data.error) || "Could not get a suggestion. Please try again.");
      }
      setState({ kind: "result", suggestion: data });
    } catch (err) {
      setState({ kind: "error", message: err instanceof Error ? err.message : "Could not get a suggestion." });
    }
  };

  return (
    <div className="mb-5 rounded-2xl border border-line bg-cream/60 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={run}
          disabled={!canRun}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span aria-hidden="true">✨</span>
          {state.kind === "loading" ? "Looking at your photos…" : "Suggest name and description with AI"}
        </button>
        <p className="text-xs text-muted">
          {!enabled
            ? "Not turned on yet. Add ANTHROPIC_API_KEY in the settings (see README)."
            : !hasPhotos
              ? "Add a photo first, then the AI can look at it."
              : "Writes English, Hindi, Telugu and Urdu text from your photos. You can edit it afterwards."}
        </p>
      </div>

      {state.kind === "loading" && (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-rose border-t-transparent" />
          This takes about 10 to 20 seconds.
        </p>
      )}

      {state.kind === "error" && (
        <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.message}
        </p>
      )}

      {state.kind === "result" && (
        <div className="mt-4 space-y-3">
          <ul className="grid gap-3 md:grid-cols-2">
            {LANGS.map((l) => (
              <li key={l} className="rounded-xl border border-line bg-white p-3" dir={isRtl(l) ? "rtl" : "ltr"} lang={l}>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted" dir="ltr">
                  {LANG_LABEL[l]}
                </p>
                <p className="mt-1 font-semibold text-ink">{state.suggestion.name[l]}</p>
                <p className="mt-1 text-sm text-ink/80">{state.suggestion.description[l]}</p>
              </li>
            ))}
          </ul>
          <p className="text-xs text-amber-700">
            Please read the Hindi, Telugu and Urdu once before you publish. The AI can make mistakes.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                onUse(state.suggestion);
                setState({ kind: "idle" });
              }}
              className="rounded-full bg-leaf px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              Use this text
            </button>
            <button
              type="button"
              onClick={run}
              className="rounded-full border border-line bg-white px-5 py-2.5 text-sm font-medium text-ink hover:border-rose"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => setState({ kind: "idle" })}
              className="rounded-full px-4 py-2.5 text-sm font-medium text-muted hover:text-red-600"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
