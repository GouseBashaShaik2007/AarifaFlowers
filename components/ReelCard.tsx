"use client";

import { useState } from "react";
import { reelEmbedUrl, reelPageUrl } from "@/lib/instagram";
import { InstagramIcon, PlayIcon } from "./icons";

type Props = {
  /** The reel code. null means there is no reel yet, so the card opens the Instagram page. */
  code: string | null;
  poster?: string;
  /** The Instagram profile address, used when there is no reel yet. */
  profileUrl: string;
  /** For screen readers, for example "Reel 1". */
  label: string;
  playLabel: string;
  watchLabel: string;
};

/**
 * One reel. It starts as a light preview card. Instagram's player, which is heavy and sets its own cookies,
 * is loaded only after the visitor taps play, so the home page stays fast.
 */
export default function ReelCard({ code, poster, profileUrl, label, playLabel, watchLabel }: Props) {
  const [playing, setPlaying] = useState(false);

  const frame =
    "relative block aspect-[9/17] w-full overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-rose-soft via-white to-marigold-soft shadow-[0_10px_30px_-14px_rgba(120,60,60,0.45)]";

  const preview = (
    <>
      {poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <span aria-hidden="true" className="absolute inset-x-0 top-8 text-center text-5xl opacity-70">
          🌸
        </span>
      )}
      {poster && <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />}
      <span className="absolute inset-0 grid place-items-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-white/95 text-rose shadow-lg transition group-hover:scale-105">
          {code ? <PlayIcon className="ms-1 h-7 w-7" /> : <InstagramIcon className="h-7 w-7" />}
        </span>
      </span>
      <span
        className={`absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 p-3 text-sm font-semibold ${
          poster ? "text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.55)]" : "text-rose-deep"
        }`}
      >
        <InstagramIcon className="h-4 w-4" />
        {code ? playLabel : watchLabel}
      </span>
    </>
  );

  // No reel yet: the whole card is a link to the Instagram page.
  if (!code) {
    return (
      <a
        href={profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${label}. ${watchLabel}`}
        className={`group ${frame}`}
      >
        {preview}
      </a>
    );
  }

  return (
    <div>
      {playing ? (
        <div className={frame}>
          <iframe
            src={reelEmbedUrl(code)}
            title={label}
            className="absolute inset-0 h-full w-full border-0 bg-white"
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture; clipboard-write"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-presentation"
          />
        </div>
      ) : (
        <button type="button" onClick={() => setPlaying(true)} aria-label={`${playLabel}: ${label}`} className={`group ${frame}`}>
          {preview}
        </button>
      )}
      <a
        href={reelPageUrl(code)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 flex min-h-11 items-center justify-center gap-1.5 text-sm font-medium text-muted hover:text-rose"
      >
        <InstagramIcon className="h-4 w-4" />
        {watchLabel}
      </a>
    </div>
  );
}
