"use client";

import { WhatsAppIcon } from "./icons";
import { trackTap } from "./track";

type Props = {
  href: string;
  children: React.ReactNode;
  size?: "md" | "lg";
  full?: boolean;
  variant?: "solid" | "white" | "outline";
  className?: string;
  /** A garland id, or "general" / "custom" for buttons that are not about one garland. Counts the tap. */
  track?: string;
  /** What a screen reader says, when the visible words are shorter than the full meaning. */
  ariaLabel?: string;
};

/** The green "Order on WhatsApp" button. Opens WhatsApp with a ready made message. */
export default function WhatsAppButton({
  href,
  children,
  size = "md",
  full,
  variant = "solid",
  className = "",
  track,
  ariaLabel,
}: Props) {
  const sizing = size === "lg" ? "px-6 py-3.5 text-base" : "px-3 py-2.5 text-sm sm:px-4";
  const colors =
    variant === "white"
      ? "bg-white text-wa hover:bg-cream"
      : variant === "outline"
        ? "border-2 border-white/80 text-white hover:bg-white/15"
        : "bg-wa text-white hover:bg-wa-deep shadow-[0_6px_18px_-6px_rgba(21,128,61,0.7)]";
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      onClick={track ? () => trackTap(track) : undefined}
      onAuxClick={track ? () => trackTap(track) : undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition active:scale-[0.98] ${sizing} ${colors} ${
        full ? "w-full" : ""
      } ${className}`}
    >
      <WhatsAppIcon className={size === "lg" ? "h-6 w-6" : "h-5 w-5"} />
      <span className="text-center leading-tight">{children}</span>
    </a>
  );
}
