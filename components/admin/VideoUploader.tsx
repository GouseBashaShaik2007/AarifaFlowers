"use client";

import { useRef, useState } from "react";
import { inspectVideo, uploadPosterBlob, uploadVideoFile } from "@/lib/clientVideos";
import { LONG_VIDEO_SECONDS, MAX_VIDEO_BYTES } from "@/lib/videos";

const MB = 1024 * 1024;

/**
 * Adds one MP4 video. It checks that the browser can play the file, uploads it with a progress bar,
 * and makes a preview picture from the video when there is none yet.
 */
export default function VideoUploader({
  video,
  hasPoster,
  onVideo,
  onPoster,
}: {
  video?: string;
  hasPoster: boolean;
  onVideo: (url: string | undefined) => void;
  onPoster: (url: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState("");
  const [percent, setPercent] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState<string[]>([]);

  const choose = async (file: File | undefined) => {
    if (input.current) input.current.value = "";
    if (!file) return;
    setError("");
    setNotes([]);

    if (file.size > MAX_VIDEO_BYTES) {
      setError(
        `This video is ${(file.size / MB).toFixed(1)} MB. The limit is ${MAX_VIDEO_BYTES / MB} MB. Shorten it or compress it, then try again.`,
      );
      return;
    }

    try {
      setBusy("Checking the video…");
      const info = await inspectVideo(file);
      const warnings: string[] = [];
      if (info.width >= info.height) warnings.push("This video is wide. Tall 9:16 videos look best in the cards.");
      if (info.duration > LONG_VIDEO_SECONDS) {
        warnings.push(`This video is ${Math.round(info.duration)} seconds long. Short clips load faster on a phone.`);
      }
      if (file.size > 5 * MB) warnings.push("Videos under 5 MB start faster on mobile data.");

      setBusy("Uploading");
      setPercent(0);
      const url = await uploadVideoFile(file, setPercent);
      onVideo(url);

      if (!hasPoster && info.poster) {
        setBusy("Making a preview picture…");
        try {
          onPoster(await uploadPosterBlob(info.poster));
          warnings.push("A preview picture was made from the video. You can replace it under Preview picture.");
        } catch {
          warnings.push("The video was added, but a preview picture could not be made. You can add one by hand.");
        }
      }
      setNotes(warnings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The video could not be added.");
    } finally {
      setBusy("");
      setPercent(null);
    }
  };

  return (
    <div>
      {video ? (
        <div className="space-y-3">
          <video src={video} controls muted playsInline preload="metadata" className="mx-auto h-64 rounded-xl bg-black" />
          <button
            type="button"
            onClick={() => {
              setNotes([]);
              onVideo(undefined);
            }}
            className="min-h-11 rounded-full px-3 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Remove video
          </button>
        </div>
      ) : (
        <p className="text-sm text-muted">No video yet. This card is not shown on the website until you add one.</p>
      )}

      <div className="mt-3">
        <label
          className={`inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-full border-2 border-dashed border-rose px-5 text-sm font-semibold text-rose transition hover:bg-rose-soft ${
            busy ? "pointer-events-none opacity-50" : ""
          }`}
        >
          <span aria-hidden="true">🎬</span>
          {video ? "Replace the video" : "Choose a video"}
          <input
            ref={input}
            type="file"
            accept="video/mp4,video/quicktime,.mp4,.mov"
            className="sr-only"
            disabled={Boolean(busy)}
            onChange={(e) => choose(e.target.files?.[0])}
          />
        </label>
      </div>

      {busy && (
        <div className="mt-3" role="status">
          <p className="text-sm text-muted">
            {busy}
            {percent !== null ? ` ${percent}%` : ""}
          </p>
          {percent !== null && (
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
              <div className="h-full bg-rose transition-all" style={{ width: `${percent}%` }} />
            </div>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {notes.map((n) => (
        <p key={n} className="mt-2 text-xs text-amber-700">
          {n}
        </p>
      ))}

      <p className="mt-3 text-xs text-muted">
        MP4 video, tall 9:16, under {MAX_VIDEO_BYTES / MB} MB and about 30 seconds. Made with H.264, which most phones use.
        An iPhone video may need Camera settings, Formats, Most Compatible.
      </p>
    </div>
  );
}
