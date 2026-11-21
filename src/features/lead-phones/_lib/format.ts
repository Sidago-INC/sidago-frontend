import { EASTERN_TIME_ZONE } from "@/lib/est";
import type { LeadPhone, LeadPhoneStatus } from "./types";

/**
 * E.164 -> something an agent can read and type into a dialler.
 * "+16046020001" -> "+1 (604) 602-0001". Anything that is not a North American
 * number is shown as stored.
 */
export function formatPhone(value: string | null | undefined): string {
  if (!value) return "";
  const m = value.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  return m ? `+1 (${m[1]}) ${m[2]}-${m[3]}` : value;
}

/** Number plus extension, ready to display. */
export function formatPhoneWithExtension(
  phone: string | null | undefined,
  extension: string | null | undefined,
): string {
  const number = formatPhone(phone);
  if (!number) return "";
  return extension ? `${number} ext. ${extension}` : number;
}

/** Under every field that edits a lead's main number, so the effect is visible. */
export const PREFERRED_PHONE_HINT =
  "A new number here replaces the preferred one; the old number is kept as retired.";

/**
 * Label for that field. The API's `phone` is the preferred number or, when none
 * is flagged (the preferred one was marked wrong, say), the best live one - so
 * "Preferred" is only true while a live number carries the flag. `phones`
 * undefined means the list has not loaded; nothing contradicts the plain label.
 */
export function preferredPhoneLabel(phones: LeadPhone[] | undefined): string {
  if (!phones) return "Preferred Phone";
  const live = phones.filter((p) => p.retiredAt === null);
  if (live.length === 0 || live.some((p) => p.isPreferred)) return "Preferred Phone";
  return "Phone (none preferred)";
}

export const STATUS_LABELS: Record<LeadPhoneStatus, string> = {
  active: "Active",
  unknown: "Unknown",
  wrong_person: "Wrong person",
  invalid_number: "Invalid number",
  disconnected_number: "Disconnected",
};

export const STATUS_STYLES: Record<LeadPhoneStatus, string> = {
  active:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  unknown:
    "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  wrong_person:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  invalid_number:
    "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300",
  disconnected_number:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300",
};

/** '12 Sep', in Eastern, matching the rest of the CRM's day boundaries. */
export function shortDate(ts: string | null | undefined): string {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("en-GB", {
    timeZone: EASTERN_TIME_ZONE,
    day: "numeric",
    month: "short",
  });
}

/** "answered 12 Sep · 4 attempts" - the one-line history shown under a number. */
export function phoneActivity(phone: LeadPhone): string {
  const parts: string[] = [];
  if (phone.retiredAt) parts.push(`retired ${shortDate(phone.retiredAt)}`);
  else if (phone.lastSuccessAt) parts.push(`answered ${shortDate(phone.lastSuccessAt)}`);
  else if (phone.lastAttemptedAt) parts.push(`last tried ${shortDate(phone.lastAttemptedAt)}`);
  else parts.push("not tried yet");
  parts.push(`${phone.attemptCount} attempt${phone.attemptCount === 1 ? "" : "s"}`);
  return parts.join(" · ");
}

/**
 * A live number that has never been dialled but already has No Answer / Bad
 * Number counts. They were carried over from the lead's earlier history, not
 * earned by calling this number - and they count toward its limit, which is why
 * rotation can skip a number that still reads "not tried yet".
 */
export function hasCarriedOverCounts(phone: LeadPhone): boolean {
  return (
    phone.retiredAt === null &&
    phone.attemptCount === 0 &&
    phone.lastAttemptedAt === null &&
    (phone.counterF > 0 || phone.counterB > 0)
  );
}

/** Order for display: live before retired, preferred first, then oldest first. */
export function sortPhones(phones: LeadPhone[]): LeadPhone[] {
  return [...phones].sort((a, b) => {
    if ((a.retiredAt === null) !== (b.retiredAt === null)) return a.retiredAt === null ? -1 : 1;
    if (a.isPreferred !== b.isPreferred) return a.isPreferred ? -1 : 1;
    return a.firstSeenAt.localeCompare(b.firstSeenAt);
  });
}
