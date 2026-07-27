export const TIMEZONE_VALUES = [
  "EST",
  "CST",
  "MST",
  "PST",
  "INTL",
] as const;

export type TIMEZONE = (typeof TIMEZONE_VALUES)[number];

const INTERNATIONAL_ALIASES = new Set([
  "GMT",
  "UTC",
  "BST",
  "CET",
  "IST",
  "JST",
  "AEST",
  "INTL",
]);

export const TIMEZONE_LABELS: Record<TIMEZONE, string> = {
  EST: "EST -- Eastern Standard Time (United States)",
  CST: "CST -- Central Standard Time (United States)",
  MST: "MST -- Mountain Standard Time (United States)",
  PST: "PST -- Pacific Standard Time (United States)",
  INTL: "INTL -- International (any country outside the United States)",
};

/** Strips a leading digits-and-dash prefix from timezone strings if present. */
export function stripTimezonePrefix(tz?: string | null): string {
  return (tz ?? "").trim().replace(/^\d+-/, "");
}

export const TIMEZONE_OPTIONS: { value: TIMEZONE; label: string }[] =
  TIMEZONE_VALUES.map((tz) => ({
    value: tz,
    label: TIMEZONE_LABELS[tz],
  }));

/** Tailwind badge classes — one fixed colour per timezone abbreviation app-wide. */
const TIMEZONE_STYLE_CLASSES = [
  "border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  "border-violet-200 bg-violet-100 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300",
  "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
] as const;

const TIMEZONE_FALLBACK_STYLE =
  "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";

export function normalizeTimezoneAbbrev(tz: string): string {
  const abbrev = stripTimezonePrefix(tz).toUpperCase();
  if (INTERNATIONAL_ALIASES.has(abbrev)) {
    return "INTL";
  }
  return abbrev;
}

export function resolveTimezoneLabel(tz: string): string {
  return normalizeTimezoneAbbrev(tz);
}

export function normalizeTimezoneValue(tz?: string | null): TIMEZONE | "" {
  if (!tz?.trim()) return "";

  const exact = TIMEZONE_VALUES.find((value) => value === tz.trim());
  if (exact) return exact;

  const abbrev = normalizeTimezoneAbbrev(tz);
  return (
    TIMEZONE_VALUES.find(
      (value) => stripTimezonePrefix(value).toUpperCase() === abbrev,
    ) ?? ""
  );
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
