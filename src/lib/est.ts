import type { DateRange } from "react-day-picker";

// ── Eastern-time (EST/EDT) convention ────────────────────────────────────────
//
// The backend keys every piece of call activity on the *Eastern* business day:
// daily scores live under `user_daily_scores.score_date` (America/New_York) and
// the call-report / call-details endpoints slice `called_at` by
// `startDate 00:00` → `endDate+1 day 00:00` in America/New_York.
//
// The browser, meanwhile, has its own timezone — for our users several hours
// ahead of New York — so its "today" (and `toISOString()`'s UTC "today") can be
// a different calendar day than the Eastern one the server counts under. When
// the two disagree the UI shows the wrong day's data and neighbouring days bleed
// together near midnight.
//
// Everything date-related in the dashboards funnels through this module so the
// day a user picks, the day sent to the API, and the clock shown against each
// call all mean the same Eastern day.

export const EASTERN_TIME_ZONE = "America/New_York";

// The current calendar day *in Eastern time*, returned as a Date pinned to local
// midnight of that day. Seed date pickers and "today" defaults with this: the
// day the picker highlights (react-day-picker compares by local day) and the day
// `toDateParam` serialises both become the Eastern day — never the browser's
// local or UTC day.
export function easternTodayDate(): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: EASTERN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value);
  return new Date(part("year"), part("month") - 1, part("day"));
}

// A Date's wall-calendar day → 'YYYY-MM-DD'. react-day-picker hands back a Date
// pinned to local midnight of the clicked day, so reading the local Y/M/D keeps
// exactly the day the user clicked (which they intend as the Eastern day). Pair
// with easternTodayDate() for any "today" fallback.
export function toDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// A Date's wall-calendar month → 'YYYY-MM'.
export function toMonthParam(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${y}-${m}`;
}

// DateRange (from a range picker) → { startDate, endDate } params. An open range
// end mirrors the start; a missing range falls back to the Eastern today.
export function rangeToDateParams(range: DateRange | undefined): {
  startDate: string;
  endDate: string;
} {
  const from = range?.from ?? easternTodayDate();
  const to = range?.to ?? from;
  return { startDate: toDateParam(from), endDate: toDateParam(to) };
}

// Absolute timestamp → 'Mon D, hh:mm AM ET'. Always rendered in Eastern so the
// clock an agent reads matches the Eastern day the row is filed under.
export function formatEasternDateTime(ts: string): string {
  const label = new Date(ts).toLocaleString("en-US", {
    timeZone: EASTERN_TIME_ZONE,
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${label} ET`;
}

// Absolute timestamp → 'hh:mm AM ET' (time only), rendered in Eastern.
export function formatEasternTime(ts: string): string {
  const label = new Date(ts).toLocaleTimeString("en-US", {
    timeZone: EASTERN_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${label} ET`;
}
