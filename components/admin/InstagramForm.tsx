"use client";

import { useRef, useState, useTransition } from "react";
import { saveInstagramAction } from "@/app/(admin)/admin/actions";
import {
  MAX_REELS,
  cleanHandle,
  profileUrl,
  reelCode,
  reelPageUrl,
  type InstagramSettings,
  type PlayerMode,
} from "@/lib/instagram";
import ImageUploader, { type UploaderHandle } from "./ImageUploader";
import VideoUploader from "./VideoUploader";

type Row = { key: string; url: string; poster?: string; video?: string };

const field =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-base outline-none focus:border-rose focus:ring-2 focus:ring-rose/20";

const newKey = () => crypto.randomUUID();

const MODES: { id: PlayerMode; title: string; text: string }[] = [
  {
    id: "preview",
    title: "Instagram, tap to play",
    text: "Recommended. Light cards that load Instagram's player only when someone taps. Fast, and nothing is loaded from Instagram until then.",
  },
  {
    id: "embed",
    title: "Instagram, official embed",
    text: "Instagram's own post box. It loads Instagram's script when the section comes into view, so it is slower and uses more data.",
  },
  {
    id: "video",
    title: "My own videos",
    text: "Plays videos you upload, right on your website. They start muted as they scroll into view. No Instagram needed.",
  },
];

export default function InstagramForm({ initial, neverSaved }: { initial: InstagramSettings; neverSaved: boolean }) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [handle, setHandle] = useState(initial.handle);
  const [mode, setMode] = useState<PlayerMode>(initial.mode);
  const [rows, setRows] = useState<Row[]>(() =>
    // Fixed keys for the rows that exist at the start, so the server and the browser agree. Rows you add later get random ones.
    initial.reels.map((r, i) => ({ key: `row-${i}`, url: r.url, poster: r.poster, video: r.video })),
  );
  const [pending, start] = useTransition();
  const [stage, setStage] = useState("");
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  // One photo uploader per reel. They are looked up by the reel's own key, so moving reels around is safe.
  const uploaders = useRef(new Map<string, UploaderHandle>());
  const waiting = useRef(new Map<string, number>());

  const update = (key: string, changes: Partial<Row>) =>
    setRows((list) => list.map((r) => (r.key === key ? { ...r, ...changes } : r)));

  const move = (i: number, dir: -1 | 1) =>
    setRows((list) => {
      const j = i + dir;
      if (j < 0 || j >= list.length) return list;
      const next = [...list];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const save = () => {
    setNote(null);
    start(async () => {
      // Preview pictures you chose but did not press "Add this photo" for are added now.
      const finalRows: Row[] = [];
      for (const r of rows) {
        let poster = r.poster;
        if ((waiting.current.get(r.key) ?? 0) > 0) {
          setStage("Adding your pictures…");
          try {
            poster = ((await uploaders.current.get(r.key)?.flush()) ?? [])[0] ?? poster;
          } catch (err) {
            setStage("");
            setNote({ ok: false, text: err instanceof Error ? err.message : "A picture could not be uploaded. Nothing was saved." });
            return;
          }
        }
        finalRows.push({ ...r, poster });
      }
      setStage("Saving…");
      const res = await saveInstagramAction({
        enabled,
        handle,
        mode,
        reels: finalRows.map((r) => ({
          url: r.url,
          ...(r.poster ? { poster: r.poster } : {}),
          ...(r.video ? { video: r.video } : {}),
        })),
      });
      setStage("");
      if (res.ok) {
        setRows(finalRows);
        setNote({ ok: true, text: "Saved. The website shows your reels now." });
      } else {
        setNote({ ok: false, text: res.error });
      }
    });
  };

  const cleanedHandle = cleanHandle(handle);
  const videoMode = mode === "video";
  const shown = videoMode ? rows.filter((r) => r.video).length : rows.length;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="space-y-5"
    >
      <div>
        <h1 className="text-2xl font-semibold text-ink">Instagram reels</h1>
        <p className="mt-1 text-sm text-muted">
          Controls the See Our Garlands in Action section on the home page. Choose how the reels play, then add reel
          links or your own videos.
        </p>
        {neverSaved && (
          <p className="mt-2 rounded-xl bg-marigold-soft px-3 py-2 text-sm text-ink">
            You have not saved anything here yet, so the website shows three starter cards that open your Instagram page.
          </p>
        )}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => setEnabled((v) => !v)}
        className="flex min-h-14 w-full items-center justify-between gap-4 rounded-2xl border border-line bg-white p-4 text-start"
      >
        <span>
          <span className="block font-medium text-ink">Show on the website</span>
          <span className="block text-sm text-muted">Turn off to hide the whole section from the home page.</span>
        </span>
        <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${enabled ? "bg-leaf" : "bg-line"}`}>
          <span
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
              enabled ? "start-[1.4rem]" : "start-0.5"
            }`}
          />
        </span>
      </button>

      <section className="rounded-3xl border border-line bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-ink">How the reels play</h2>
        <div role="radiogroup" aria-label="How the reels play" className="mt-3 space-y-2">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={mode === m.id}
              onClick={() => setMode(m.id)}
              className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-start transition ${
                mode === m.id ? "border-rose bg-rose-soft/50" : "border-line bg-white hover:border-rose/40"
              }`}
            >
              <span
                aria-hidden="true"
                className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
                  mode === m.id ? "border-rose" : "border-line"
                }`}
              >
                {mode === m.id && <span className="h-2.5 w-2.5 rounded-full bg-rose" />}
              </span>
              <span>
                <span className="block font-medium text-ink">{m.title}</span>
                <span className="block text-sm text-muted">{m.text}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-line bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-ink">Instagram name</h2>
        <label htmlFor="handle" className="mt-3 mb-1.5 block text-sm font-medium text-ink">
          Your Instagram name
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-muted">@</span>
          <input
            id="handle"
            className={`${field} ps-9`}
            value={handle.replace(/^@/, "")}
            onChange={(e) => setHandle(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="aarifashaik31"
          />
        </div>
        <p className="mt-1 text-xs text-muted">
          {cleanedHandle ? (
            <>
              The Follow button opens{" "}
              <a href={profileUrl(cleanedHandle)} target="_blank" rel="noopener noreferrer" className="font-medium text-rose underline">
                instagram.com/{cleanedHandle}
              </a>
              .
            </>
          ) : (
            "Use letters, numbers, dots and underscores only."
          )}
        </p>
      </section>

      <section className="rounded-3xl border border-line bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-ink">{videoMode ? "Videos" : "Reels"}</h2>
        <p className="mt-0.5 text-sm text-muted">
          {videoMode
            ? "Upload a video for each card. You can also paste the Instagram link, which adds a small Watch on Instagram link under the video."
            : "On Instagram open a reel, tap Share, then Copy link, and paste it below. The first three show first on a computer. On a phone customers swipe through all of them."}
        </p>

        <ol className="mt-4 space-y-4">
          {rows.map((r, i) => {
            const code = reelCode(r.url);
            const filled = r.url.trim() !== "";
            return (
              <li key={r.key} className="rounded-2xl border border-line bg-cream/60 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-ink">
                    {videoMode ? "Video" : "Reel"} {i + 1}
                  </p>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      aria-label={`Move reel ${i + 1} earlier`}
                      className="h-11 w-11 rounded-full border border-line bg-white text-lg disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === rows.length - 1}
                      aria-label={`Move reel ${i + 1} later`}
                      className="h-11 w-11 rounded-full border border-line bg-white text-lg disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => setRows((list) => list.filter((x) => x.key !== r.key))}
                      className="min-h-11 rounded-full px-3 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {videoMode && (
                  <div className="mt-3 rounded-xl border border-line bg-white p-4">
                    <p className="mb-2 text-sm font-medium text-ink">Video file</p>
                    <VideoUploader
                      video={r.video}
                      hasPoster={Boolean(r.poster)}
                      onVideo={(url) => update(r.key, { video: url })}
                      onPoster={(url) => update(r.key, { poster: url })}
                    />
                  </div>
                )}

                <label htmlFor={`url-${r.key}`} className="mt-3 mb-1.5 block text-sm font-medium text-ink">
                  {videoMode ? "Instagram link (optional)" : "Reel link"}
                </label>
                <input
                  id={`url-${r.key}`}
                  className={field}
                  value={r.url}
                  onChange={(e) => update(r.key, { url: e.target.value })}
                  inputMode="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="https://www.instagram.com/reel/…"
                />
                <p className={`mt-1 text-xs ${filled && !code ? "text-red-700" : code ? "text-leaf" : "text-muted"}`}>
                  {!filled && !videoMode && "Empty. This card will open your Instagram page."}
                  {!filled && videoMode && "Empty. No Instagram link is shown under this video."}
                  {filled && code && (
                    <>
                      This looks like a reel.{" "}
                      <a href={reelPageUrl(code)} target="_blank" rel="noopener noreferrer" className="font-medium underline">
                        Open it to check
                      </a>
                      .
                    </>
                  )}
                  {filled && !code && "This does not look like an Instagram reel link. Copy it again from Instagram."}
                </p>

                <details className="mt-3 rounded-xl border border-line bg-white">
                  <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-2 px-4 text-sm font-medium text-ink">
                    <span>Preview picture</span>
                    <span className="text-xs font-normal text-muted">{r.poster ? "Added" : "Optional"}</span>
                  </summary>
                  <div className="border-t border-line p-4">
                    <p className="mb-3 text-xs text-muted">
                      {videoMode
                        ? "Shown before the video starts. One is made from the video for you. Add your own to replace it."
                        : "Shown on the card before someone taps play. Use a screenshot of the reel. Without one, the card shows a soft flower design."}
                    </p>
                    <ImageUploader
                      ref={(handle) => {
                        if (handle) uploaders.current.set(r.key, handle);
                        else uploaders.current.delete(r.key);
                      }}
                      images={r.poster ? [r.poster] : []}
                      onChange={(next) => update(r.key, { poster: next[0] })}
                      onWaitingChange={(n) => waiting.current.set(r.key, n)}
                      maxPhotos={1}
                      autoRemoveDefault={false}
                    />
                  </div>
                </details>
              </li>
            );
          })}
        </ol>

        {shown === 0 && (
          <p className="mt-4 rounded-2xl bg-cream px-4 py-3 text-sm text-muted">
            {videoMode
              ? "No videos yet. The section is hidden on the website until at least one card has a video."
              : "No reels. The section is hidden on the website until you add at least one."}
          </p>
        )}

        <button
          type="button"
          onClick={() => setRows((list) => (list.length >= MAX_REELS ? list : [...list, { key: newKey(), url: "" }]))}
          disabled={rows.length >= MAX_REELS}
          className="mt-4 min-h-12 rounded-full border border-dashed border-rose px-5 text-sm font-semibold text-rose hover:bg-rose-soft disabled:opacity-40"
        >
          {rows.length >= MAX_REELS ? `You can add up to ${MAX_REELS}` : videoMode ? "+ Add a video" : "+ Add a reel"}
        </button>
      </section>

      {note && (
        <p
          role={note.ok ? "status" : "alert"}
          className={`rounded-2xl px-4 py-3 text-sm ${note.ok ? "bg-mint-soft text-leaf" : "bg-red-50 text-red-700"}`}
        >
          {note.text}
        </p>
      )}

      <div className="sticky bottom-0 -mx-4 border-t border-line bg-cream/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <button
          type="submit"
          disabled={pending}
          className="min-h-12 w-full rounded-full bg-rose px-7 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgba(184,50,90,0.8)] transition hover:bg-rose-deep disabled:opacity-60 sm:w-auto"
        >
          {pending ? stage || "Saving…" : "Save Instagram settings"}
        </button>
      </div>
    </form>
  );
}
