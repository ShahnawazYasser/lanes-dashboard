export const KARACHI_TZ = "Asia/Karachi";

/**
 * Formats a Date to its Y-M-D key in a given IANA timezone, independent of
 * the runtime's local timezone (important on serverless, which usually runs UTC).
 */
function dateKeyInTz(date: Date, timeZone: string): { y: string; m: string; d: string } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return { y: get("year"), m: get("month"), d: get("day") };
}

/** A UTC-midnight Date representing the calendar day of `date` in Asia/Karachi. */
export function karachiDateOnly(date: Date): Date {
  const { y, m, d } = dateKeyInTz(date, KARACHI_TZ);
  return new Date(`${y}-${m}-${d}T00:00:00Z`);
}

/** "Today" as a UTC-midnight Date, computed in the Asia/Karachi timezone. */
export function todayKarachi(): Date {
  return karachiDateOnly(new Date());
}

/** Parses a Postgres `date` string ("YYYY-MM-DD") into a UTC-midnight Date. */
export function parseDateOnly(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00Z`);
}

/** Formats a Postgres `date` string ("YYYY-MM-DD") as DD/MM/YYYY. */
export function fmtDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = parseDateOnly(dateStr);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/** Formats an ISO timestamp as "DD/MM/YYYY, HH:MM" in Asia/Karachi. */
export function fmtDateTime(isoTimestamp: string): string {
  const d = new Date(isoTimestamp);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: KARACHI_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${get("day")}/${get("month")}/${get("year")}, ${get("hour")}:${get("minute")}`;
}

/** Shifts a Postgres `date` string ("YYYY-MM-DD") by `days` (may be negative), returned in the same format. */
export function shiftDateOnly(dateStr: string, days: number): string {
  const d = parseDateOnly(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Formats an integer PKR amount, e.g. 85000 -> "PKR 85,000". */
export function fmtPKR(amount: number): string {
  return `PKR ${Math.round(amount).toLocaleString("en-US")}`;
}

/** Builds a wa.me link, converting Pakistani local format 03XXXXXXXXX to 92XXXXXXXXXX. */
export function waLink(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  let normalized = digits;
  if (normalized.startsWith("0")) {
    normalized = `92${normalized.slice(1)}`;
  } else if (!normalized.startsWith("92")) {
    normalized = `92${normalized}`;
  }
  return `https://wa.me/${normalized}`;
}
