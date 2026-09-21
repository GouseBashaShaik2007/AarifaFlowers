"use client";

import Link from "next/link";
import { HeartIcon } from "./icons";
import { useSaved } from "@/lib/saved";

/** The heart in the header. Shows how many garlands are saved on this phone. */
export default function SavedLink({ href, label }: { href: string; label: string }) {
  const count = useSaved().length;
  return (
    <Link
      href={href}
      aria-label={count > 0 ? `${label} (${count})` : label}
      className="relative grid h-11 w-11 place-items-center rounded-full text-ink transition hover:text-rose"
    >
      <HeartIcon filled={count > 0} className={`h-6 w-6 ${count > 0 ? "text-rose" : ""}`} />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute end-0.5 top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-rose px-1 text-[11px] font-semibold leading-none text-white"
        >
          {count}
        </span>
      )}
    </Link>
  );
}
