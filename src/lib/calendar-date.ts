// Calendar dates ("YYYY-MM-DD") are not instants. Parsing them as UTC and
// formatting with toISOString() shifts the day in any timezone east of UTC
// (a Dec 20 pick in UTC+6 is saved as Dec 19). These helpers keep the calendar
// day exactly as written, using the local date getters both ways.

const CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Parses a "YYYY-MM-DD" value to local midnight. Anything else falls back to
 * Date parsing, as before, so non-calendar values keep their old behavior.
 */
export function parseCalendarDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const match = CALENDAR_DATE.exec(trimmed);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    const date = new Date(year, month, day);
    // Reject impossible dates such as 2026-02-31 instead of rolling them over.
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month ||
      date.getDate() !== day
    ) {
      return null;
    }
    return date;
  }

  const fallback = new Date(trimmed);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

/** Formats a date as "YYYY-MM-DD" using its local calendar day. */
export function formatCalendarDate(date: Date | null): string {
  if (!date || Number.isNaN(date.getTime())) return "";
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
