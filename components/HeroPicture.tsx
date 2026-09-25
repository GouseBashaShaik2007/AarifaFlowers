import { isCutout, thumbOf } from "@/lib/catalog";
import FitPhoto from "./FitPhoto";

export type HeroPic = { image: string; alt: string };

/**
 * The photo cluster in the home page hero: one large framed photo and up to two smaller round ones.
 * Used on the home page itself and in the admin Home page tab, so the admin's preview can never drift from what
 * visitors actually see: both call this same component with the same kind of data.
 */
export default function HeroPicture({ pics }: { pics: HeroPic[] }) {
  if (pics.length === 0) return null;
  const [main, second, third] = pics;
  return (
    <div className="relative mx-auto aspect-square w-full max-w-md">
      <div className="absolute inset-4 rounded-full bg-gradient-to-br from-rose-soft via-white to-marigold-soft" />
      {isCutout(main.image) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbOf(main.image)}
          alt={main.alt}
          className="absolute inset-0 h-full w-full object-contain p-3 drop-shadow-xl"
        />
      ) : (
        // An ordinary photo is shown as a tall framed picture, not as a rectangle inside the round shape.
        <div className="absolute inset-y-1 left-1/2 aspect-[4/5] -translate-x-1/2 overflow-hidden rounded-[2rem] border-4 border-white bg-cream shadow-xl">
          <FitPhoto src={thumbOf(main.image)} alt={main.alt} priority />
        </div>
      )}
      {second && (
        <div className="absolute -bottom-1 start-0 h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-cream shadow-lg sm:h-32 sm:w-32">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbOf(second.image)}
            alt={second.alt}
            className={`h-full w-full ${isCutout(second.image) ? "object-contain p-2" : "object-cover"}`}
          />
        </div>
      )}
      {third && (
        <div className="absolute end-0 top-2 h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-cream shadow-lg sm:h-28 sm:w-28">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbOf(third.image)}
            alt={third.alt}
            className={`h-full w-full ${isCutout(third.image) ? "object-contain p-2" : "object-cover"}`}
          />
        </div>
      )}
    </div>
  );
}
