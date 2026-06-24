export const TIMEZONE_VALUES = [
  "1-EST",
  "2-CST",
  "3-MST",
  "4-PST",
  "5-GMT",
  "6-UTC",
  "7-BST",
  "8-IST",
  "9-JST",
  "10-AEST",
] as const;

export type TIMEZONE = (typeof TIMEZONE_VALUES)[number];

export function stripTimezonePrefix(tz?: string | null): string {
  return (tz ?? "").trim().replace(/^\d+-/, "");
}

export const TIMEZONE_OPTIONS: { value: TIMEZONE; label: string }[] =
  TIMEZONE_VALUES.map((tz) => ({
    value: tz,
    label: stripTimezonePrefix(tz),
  }));

/** Tailwind badge classes — one fixed colour per timezone abbreviation app-wide. */
const TIMEZONE_STYLE_CLASSES = [
  "border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  "border-violet-200 bg-violet-100 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300",
  "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  "border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
  "border-pink-200 bg-pink-100 text-pink-700 dark:border-pink-800 dark:bg-pink-950/40 dark:text-pink-300",
  "border-orange-200 bg-orange-100 text-orange-700 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300",
  "border-cyan-200 bg-cyan-100 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300",
  "border-teal-200 bg-teal-100 text-teal-700 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-300",
] as const;

const TIMEZONE_FALLBACK_STYLE =
  "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";

export function normalizeTimezoneAbbrev(tz: string): string {
  return stripTimezonePrefix(tz).toUpperCase();
}

export function resolveTimezoneLabel(tz: string): string {
  return normalizeTimezoneAbbrev(tz);
}

export function getTimezoneBadgeStyle(tz: string): string {
  const abbrev = normalizeTimezoneAbbrev(tz);
  const index = TIMEZONE_VALUES.findIndex(
    (value) => stripTimezonePrefix(value).toUpperCase() === abbrev,
  );

  if (index >= 0) {
    return TIMEZONE_STYLE_CLASSES[index];
  }

  return TIMEZONE_FALLBACK_STYLE;
}

export function resolveLeadTimezone(
  leadTimezone?: string | null,
  companyTimezone?: string | null,
): string | null {
  const timezone = leadTimezone?.trim() || companyTimezone?.trim();
  return timezone || null;
}

export function getRandomTimezone(): TIMEZONE {
  const randomIndex = Math.floor(Math.random() * TIMEZONE_VALUES.length);
  return TIMEZONE_VALUES[randomIndex];
}
