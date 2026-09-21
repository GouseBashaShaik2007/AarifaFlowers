"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { reelPageUrl } from "@/lib/instagram";
import ReelCard from "./ReelCard";

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

const EMBED_SCRIPT = "https://www.instagram.com/embed.js";

let scriptPromise: Promise<void> | null = null;

/** Loads Instagram's embed script once, however many times this is called. */
function loadEmbedScript(): Promise<void> {
  if (window.instgrm) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = EMBED_SCRIPT;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = null; // allow another try later
        script.remove();
        reject(new Error("Instagram's script could not be loaded."));
      };
      document.body.appendChild(script);
    });
  }
  return scriptPromise;
}

/** Instagram's own embed markup for one reel. The code was checked earlier, so it is safe to place in a page. */
function embedMarkup(code: string): string {
  const link = `${reelPageUrl(code)}?utm_source=ig_embed&amp;utm_campaign=loading`;
  return (
    `<blockquote class="instagram-media" data-instgrm-permalink="${link}" data-instgrm-version="14" ` +
    `style="background:#FFF;border:0;border-radius:16px;box-shadow:0 1px 10px rgba(0,0,0,.15);margin:1px;max-width:540px;min-width:0;padding:0;width:calc(100% - 2px)">` +
    `<div style="padding:16px"><a href="${link}" target="_blank" rel="noopener noreferrer" ` +
    `style="color:#c9c8cd;font-family:Arial,sans-serif;font-size:14px;text-decoration:none">View this reel on Instagram</a></div></blockquote>`
  );
}

/**
 * Instagram's official embeds, in one column on a phone and three on a computer.
 * Instagram's script is loaded only when the grid is about to come into view.
 * Cards with no reel yet show a card that opens the Instagram page.
 */
export default function InstagramReelsGrid({
  items,
  profileUrl,
  playLabel,
  watchLabel,
}: {
  /** One entry per card. `code` is the reel code, or null for a card with no reel yet. */
  items: { code: string | null; title: string }[];
  profileUrl: string;
  playLabel: string;
  watchLabel: string;
}) {
  const host = useRef<HTMLUListElement>(null);
  const [failed, setFailed] = useState(false);

  // Built once per list. React never touches the inside of an embed again, because Instagram's script
  // replaces it, and React changing it afterwards would cause errors.
  const markup = useMemo(() => items.map((it) => (it.code ? embedMarkup(it.code) : null)), [items]);
  const anyEmbeds = markup.some(Boolean);

  useEffect(() => {
    const el = host.current;
    if (!el || !anyEmbeds) return;
    let cancelled = false;
    const start = () =>
      loadEmbedScript()
        .then(() => {
          if (!cancelled) window.instgrm?.Embeds.process();
        })
        .catch(() => {
          if (!cancelled) setFailed(true);
        });

    if (!("IntersectionObserver" in window)) {
      start();
      return () => {
        cancelled = true;
      };
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          start();
        }
      },
      { rootMargin: "400px" },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
    };
  }, [anyEmbeds, markup]);

  return (
    <ul
      ref={host}
      className="mx-auto grid max-w-[420px] grid-cols-1 items-start gap-5 md:max-w-none md:grid-cols-3 [&_.instagram-media]:!m-0 [&_.instagram-media]:!min-w-0 [&_.instagram-media]:!w-full [&_.instagram-media]:!max-w-full"
    >
      {items.map((it, i) => (
        <li key={`${it.code ?? "empty"}-${i}`} className="min-w-0">
          {markup[i] ? (
            <div dangerouslySetInnerHTML={{ __html: markup[i]! }} />
          ) : (
            <ReelCard code={null} profileUrl={profileUrl} label={it.title} playLabel={playLabel} watchLabel={watchLabel} />
          )}
        </li>
      ))}
      {failed && (
        <li className="col-span-full text-center text-sm text-muted">
          <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-rose underline">
            {watchLabel}
          </a>
        </li>
      )}
    </ul>
  );
}
