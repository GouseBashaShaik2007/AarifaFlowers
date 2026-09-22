// How much notice each kind of order needs, and whether a chosen date fits. Safe to import anywhere.

/** Orders placed after this hour (India time) are too late for the same day. */
export const SAME_DAY_CUTOFF_HOUR = 14;

/** Occasions and types that need 2 days' notice. Everything else needs 1 day (24 hours). */
const TWO_DAY_OCCASIONS: readonly string[] = ["wedding", "custom"];
const TWO_DAY_TYPES: readonly string[] = ["stage", "car"];

export type Notice = 1 | 2;

/**
 * Days of notice for an order. With nothing known it says 2, because promising too little notice is worse
 * than asking for a little too much.
 */
export function noticeDays(occasions: readonly string[], types: readonly string[] = []): Notice {
  if (occasions.length === 0 && types.length === 0) return 2;
  if (occasions.some((o) => TWO_DAY_OCCASIONS.includes(o)) || types.some((t) => TWO_DAY_TYPES.includes(t))) return 2;
  return 1;
}

export type DateStatus = "ok" | "sameDay" | "sameDayLate" | "soon" | "past";

const YMD = /^\d{4}-\d{2}-\d{2}$/;

const dayNumber = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
};

/** Today's date (yyyy-mm-dd) and hour in India, whatever the visitor's own time zone is. */
export function indiaNow(now: Date = new Date()): { ymd: string; hour: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  return { ymd: `${get("year")}-${get("month")}-${get("day")}`, hour: Number(get("hour")) };
}

/** Whether a yyyy-mm-dd date fits the notice time. Null when there is no valid date yet. */
export function assessDate(ymd: string, days: Notice, now: Date = new Date()): DateStatus | null {
  if (!YMD.test(ymd)) return null;
  const today = indiaNow(now);
  const diff = dayNumber(ymd) - dayNumber(today.ymd);
  if (diff < 0) return "past";
  if (diff === 0) {
    if (days === 2) return "soon";
    return today.hour < SAME_DAY_CUTOFF_HOUR ? "sameDay" : "sameDayLate";
  }
  return diff < days ? "soon" : "ok";
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Whether today falls between two days, both included. A missing or badly written day means no limit on that side.
 * All three are yyyy-mm-dd, which sort the same way as the dates they stand for.
 */
export function withinDates(today: string, from?: string, until?: string): boolean {
  if (from && YMD.test(from) && today < from) return false;
  if (until && YMD.test(until) && today > until) return false;
  return true;
}

/** "12 Nov 2026" for the WhatsApp message. Spelled out here so every browser writes the same thing. */
export function formatDate(ymd: string): string {
  if (!YMD.test(ymd)) return "";
  const [y, m, d] = ymd.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return "";
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** The lines added to a WhatsApp message when the visitor picked a usable date. */
export function dateLines(ymd: string, status: DateStatus | null): string[] {
  if (!status || status === "past" || !formatDate(ymd)) return [];
  const lines = [`Event date: ${formatDate(ymd)}`];
  if (status !== "ok") lines.push("(Short notice, please confirm if possible)");
  return lines;
}
