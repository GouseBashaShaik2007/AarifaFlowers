import type { Dictionary } from "@/lib/i18n";
import { MAX_REELS, profileUrl, reelCode, type InstagramSettings } from "@/lib/instagram";
import { InstagramIcon } from "./icons";
import ReelCard from "./ReelCard";

/**
 * "See Our Garlands in Action". A sideways swipe carousel on phones, a three column grid on larger screens.
 * The reels and the Instagram name come from the admin page (Instagram tab).
 */
export default function InstagramShowcase({ t, settings }: { t: Dictionary; settings: InstagramSettings }) {
  const reels = settings.reels.slice(0, MAX_REELS);
  const profile = profileUrl(settings.handle);
  return (
    <section id="instagram-reels" className="mx-auto mt-16 max-w-6xl px-4 sm:px-6" aria-labelledby="reels-heading">
      <div className="rounded-[2rem] border border-line bg-[#FFFDF9] p-5 shadow-[0_2px_18px_-8px_rgba(120,60,60,0.25)] sm:p-8">
        <h2 id="reels-heading" className="h-display text-3xl font-semibold text-ink sm:text-4xl">
          {t.reelsTitle}
        </h2>
        <p className="mt-2 max-w-2xl text-muted">{t.reelsSub}</p>

        <ul
          aria-label={t.reelsTitle}
          className="-mx-5 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pb-2 [scrollbar-width:none] sm:-mx-8 sm:scroll-px-8 sm:px-8 md:mx-0 md:grid md:snap-none md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0 md:pb-0 [&::-webkit-scrollbar]:hidden"
        >
          {reels.map((reel, i) => (
            <li key={i} className="w-[72%] max-w-[300px] shrink-0 snap-start md:w-auto md:max-w-none">
              <ReelCard
                code={reelCode(reel.url)}
                poster={reel.poster}
                profileUrl={profile}
                label={reel.title ? reel.title : `Reel ${i + 1}`}
                playLabel={t.reelsPlay}
                watchLabel={t.reelsWatch}
              />
            </li>
          ))}
        </ul>

        <div className="mt-6 flex justify-center">
          <a
            href={profile}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-rose to-rose-deep px-6 text-center text-sm font-semibold leading-tight text-white shadow-[0_8px_20px_-8px_rgba(184,50,90,0.8)] transition hover:opacity-95 active:scale-[0.98] sm:text-base"
          >
            <InstagramIcon className="h-5 w-5 shrink-0" />
            <span dir="auto">{t.reelsFollow.replace("{handle}", `@${settings.handle}`)}</span>
          </a>
        </div>
      </div>
    </section>
  );
}
