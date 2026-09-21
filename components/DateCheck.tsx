"use client";

import { assessDate, type DateStatus, type Notice } from "@/lib/orderRules";
import type { Dictionary } from "@/lib/i18n";

const TONE: Record<DateStatus, string> = {
  ok: "bg-mint-soft text-leaf",
  sameDay: "bg-marigold-soft text-ink",
  sameDayLate: "bg-marigold-soft text-ink",
  soon: "bg-marigold-soft text-ink",
  past: "bg-red-50 text-red-700",
};

const MESSAGE: Record<DateStatus, "dateOk" | "dateSameDay" | "dateSameDayLate" | "dateSoon" | "datePast"> = {
  ok: "dateOk",
  sameDay: "dateSameDay",
  sameDayLate: "dateSameDayLate",
  soon: "dateSoon",
  past: "datePast",
};

/**
 * Asks for an event date and says whether it fits our notice time. It cannot see the shop's bookings,
 * so a good date only says availability is confirmed on WhatsApp.
 */
export default function DateCheck({
  id,
  t,
  days,
  value,
  onChange,
  title,
}: {
  id: string;
  t: Dictionary;
  days: Notice;
  value: string;
  onChange: (ymd: string) => void;
  /** Heading above the picker. Leave out when the page already has a heading for this step. */
  title?: string;
}) {
  const status = assessDate(value, days);
  return (
    <div>
      {title && <p className="font-semibold text-ink">📅 {title}</p>}
      <p className={`text-sm text-muted ${title ? "mt-1" : ""}`}>{days === 2 ? t.notice2 : t.notice1}</p>
      <label htmlFor={id} className="mt-3 block text-sm font-medium text-ink">
        {t.dateLabel}
      </label>
      <input
        id={id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 min-h-12 w-full rounded-xl border border-line bg-white px-4 text-base outline-none focus:border-rose focus:ring-2 focus:ring-rose/20"
      />
      <div role="status" aria-live="polite">
        {status && <p className={`mt-3 rounded-xl px-4 py-3 text-sm font-medium ${TONE[status]}`}>{t[MESSAGE[status]]}</p>}
      </div>
    </div>
  );
}
