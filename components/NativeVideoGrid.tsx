"use client";

import { useEffect, useRef, useState } from "react";
import { InstagramIcon, PauseIcon, PlayIcon, SoundOffIcon, SoundOnIcon } from "./icons";

export type NativeVideo = {
  /** Address of an MP4 file. */
  src: string;
  /** Picture shown before the video starts. */
  poster?: string;
  /** Read out loud by screen readers. */
  title: string;
  /** Optional link to the same reel on Instagram. */
  instagramUrl?: string;
};

export type NativeVideoLabels = {
  play: string;
  pause: string;
  soundOn: string;
  soundOff: string;
  unavailable: string;
  watch: string;
};

/** How much of a card must be on screen before its video starts by itself. */
const START_AT = 0.6;
/** A video the visitor started by hand keeps playing until less than this much of it is on screen. */
const STAY_AT = 0.3;

/**
 * Your own videos, played by the browser. Nothing is downloaded from Instagram.
 *
 * - The most visible video starts by itself, muted, and stops when it scrolls away. Only one plays at a time,
 *   which saves the visitor's data and battery.
 * - Tap a video to pause or play it. The round button turns sound on or off for every video.
 * - Nothing starts by itself if the visitor asked their phone for less motion or for data saving.
 * - One column on a phone, three columns on a computer.
 */
export default function NativeVideoGrid({ videos, labels }: { videos: NativeVideo[]; labels: NativeVideoLabels }) {
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const ratios = useRef<number[]>([]);
  const userPaused = useRef(new Set<number>());
  const manual = useRef(-1);
  const autoAllowed = useRef(true);
  const [active, setActive] = useState(-1);
  const [sound, setSound] = useState(false);
  const decideRef = useRef<() => void>(() => {});

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
    autoAllowed.current = !reduced && !saveData;

    // Pick the video that should be playing right now.
    const decide = () => {
      let best = -1;
      let bestRatio = START_AT - 0.001;
      if (autoAllowed.current && !document.hidden) {
        ratios.current.forEach((r, i) => {
          if (!userPaused.current.has(i) && r > bestRatio) {
            best = i;
            bestRatio = r;
          }
        });
      }
      if (manual.current >= 0) {
        if ((ratios.current[manual.current] ?? 0) >= STAY_AT && !document.hidden) best = manual.current;
        else manual.current = -1;
      }
      setActive(best);
    };
    decideRef.current = decide;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const i = Number((entry.target as HTMLElement).dataset.index);
          ratios.current[i] = entry.isIntersecting ? entry.intersectionRatio : 0;
          // Once a video the visitor paused has mostly left the screen, it may start by itself next time.
          if (ratios.current[i] < 0.2) userPaused.current.delete(i);
        }
        decide();
      },
      { threshold: [0, 0.2, 0.3, 0.5, 0.6, 0.75, 0.9, 1] },
    );
    cards.current.forEach((el) => el && io.observe(el));

    document.addEventListener("visibilitychange", decide);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", decide);
    };
  }, [videos.length]);

  const request = (index: number, play: boolean) => {
    if (play) {
      userPaused.current.delete(index);
      manual.current = index;
      setActive(index);
    } else {
      userPaused.current.add(index);
      if (manual.current === index) manual.current = -1;
      decideRef.current();
    }
  };

  return (
    <ul className="mx-auto grid max-w-sm grid-cols-1 gap-6 md:max-w-none md:grid-cols-3 md:gap-5">
      {videos.map((video, i) => (
        <li key={video.src}>
          <VideoCard
            video={video}
            index={i}
            wantPlay={active === i}
            sound={sound}
            labels={labels}
            register={(el) => {
              cards.current[i] = el;
            }}
            onRequest={request}
            onToggleSound={() => setSound((s) => !s)}
            onSoundBlocked={() => setSound(false)}
          />
          {video.instagramUrl && (
            <a
              href={video.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 flex min-h-11 items-center justify-center gap-1.5 text-sm font-medium text-muted hover:text-rose"
            >
              <InstagramIcon className="h-4 w-4" />
              {labels.watch}
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

function VideoCard({
  video,
  index,
  wantPlay,
  sound,
  labels,
  register,
  onRequest,
  onToggleSound,
  onSoundBlocked,
}: {
  video: NativeVideo;
  index: number;
  wantPlay: boolean;
  sound: boolean;
  labels: NativeVideoLabels;
  register: (el: HTMLDivElement | null) => void;
  onRequest: (index: number, play: boolean) => void;
  onToggleSound: () => void;
  onSoundBlocked: () => void;
}) {
  const player = useRef<HTMLVideoElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (player.current) player.current.muted = !sound;
  }, [sound]);

  useEffect(() => {
    const v = player.current;
    if (!v) return;
    if (!wantPlay) {
      v.pause();
      return;
    }
    v.muted = !sound;
    v.play()?.catch(() => {
      // Browsers refuse to start a video with sound on their own. Fall back to muted.
      if (!v.muted) {
        v.muted = true;
        onSoundBlocked();
        v.play().catch(() => {});
      }
    });
    // Only re-run when this card is told to start or stop. Sound changes are handled above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantPlay]);

  // A tap is a real user action, so the browser always allows the video to start here.
  const toggle = () => {
    const v = player.current;
    if (!v) return;
    if (playing) {
      v.pause();
      onRequest(index, false);
    } else {
      v.muted = !sound;
      v.play().catch(() => {});
      onRequest(index, true);
    }
  };

  return (
    <div
      ref={register}
      data-index={index}
      className="group relative aspect-[9/16] overflow-hidden rounded-2xl border border-line bg-cream-deep shadow-[0_10px_30px_-14px_rgba(120,60,60,0.45)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-16px_rgba(120,60,60,0.55)]"
    >
      <video
        ref={player}
        src={video.src}
        poster={video.poster}
        aria-label={video.title}
        muted
        loop
        playsInline
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => setFailed(true)}
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          if (bar.current && v.duration) bar.current.style.transform = `scaleX(${v.currentTime / v.duration})`;
        }}
        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
      />

      {failed ? (
        <p role="alert" className="absolute inset-0 grid place-items-center bg-cream-deep p-6 text-center text-sm text-muted">
          {labels.unavailable}
        </p>
      ) : (
        <>
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? labels.pause : labels.play}
            className="absolute inset-0 grid place-items-center focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-rose/60"
          >
            <span
              className={`grid h-16 w-16 place-items-center rounded-full bg-white/95 text-rose shadow-lg transition duration-300 ${
                playing
                  ? "scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 group-focus-within:scale-100 group-focus-within:opacity-100"
                  : "scale-100 opacity-100 group-hover:scale-105"
              }`}
            >
              {playing ? <PauseIcon className="h-7 w-7" /> : <PlayIcon className="ms-1 h-7 w-7" />}
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleSound}
            aria-pressed={sound}
            aria-label={sound ? labels.soundOff : labels.soundOn}
            className="absolute bottom-4 end-3 grid h-11 w-11 place-items-center rounded-full bg-rose text-white shadow-lg transition hover:bg-rose-deep focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/80 active:scale-95"
          >
            {sound ? <SoundOnIcon /> : <SoundOffIcon />}
          </button>

          <span dir="ltr" aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1 bg-white/40">
            <span ref={bar} className="block h-full origin-left bg-rose" style={{ transform: "scaleX(0)" }} />
          </span>
        </>
      )}
    </div>
  );
}
