import { CONTACT_TYPE_VALUES } from "@/types/contact-type.types";
import { LEAD_TYPE_VALUES } from "@/types/lead-type.types";
import { TIMEZONE_OPTIONS } from "@/types/timezone.types";

export const leadOptions = [
  "Interested",
  "Qualified",
  "Follow Up",
  "On Interested",
  "Hot Lead",
  "Re-Engaged",
];

export const contactTypeOptions = CONTACT_TYPE_VALUES;

export const leadTypeOptions = LEAD_TYPE_VALUES;

export const assigneeOptions = [
  "Hasib",
  "Nafis",
  "Asha",
  "Rafi",
  "Maliha",
  "Tanvir",
];

export const timezoneOptions = TIMEZONE_OPTIONS;

/**
 * Initials for a company with no ticker symbol.
 *
 * Accepts nullish because a lead can have no company at all — 19 of them do,
 * and the Calls Log LEFT JOINs companies, so `companyName` really does arrive
 * as null. The parameter used to be a bare `string`, which was a lie the type
 * system could not catch: two Calls Log call sites passed the value straight
 * through and `null.split` took the whole page down with it.
 */
export function getCompanySymbol(
  companyName: string | null | undefined,
): string {
  const words = (companyName ?? "")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

  if (words.length === 0) {
    return "";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

export function getLeadId(row: { companyName: string; lead: string }): string {
  const companySymbol = getCompanySymbol(row.companyName);

  if (!companySymbol) {
    return row.lead;
  }

  if (!row.lead) {
    return companySymbol;
  }

  return `${companySymbol}-${row.lead}`;
}

export function getLeadDrawerTitle(row: {
  companySymbol?: string | null;
  companyName?: string | null;
  fullName?: string | null;
}): string {
  const companySymbol =
    row.companySymbol?.trim() || getCompanySymbol(row.companyName ?? "");
  const fullName = row.fullName?.trim() ?? "";

  if (companySymbol && fullName) {
    return `${companySymbol} - ${fullName}`;
  }

  return companySymbol || fullName || "Lead";
}

export function getLeadGridLabel(row: {
  companySymbol?: string | null;
  companyName?: string | null;
  fullName?: string | null;
  /** Airtable record id, used only when there is nothing else to show. */
  leadIdExternal?: string | null;
}): string {
  const companySymbol =
    row.companySymbol?.trim() || getCompanySymbol(row.companyName);
  const fullName = row.fullName?.trim() ?? "";

  if (companySymbol && fullName) {
    return `${companySymbol}-${fullName}`;
  }

  // 19 leads have no company at all, and one of those has no name either.
  // The record id is at least searchable; past that say so plainly rather
  // than printing a bare "Lead" that could be any of them.
  return (
    companySymbol ||
    fullName ||
    row.leadIdExternal?.trim() ||
    "Unnamed lead"
  );
}

export function getRowCompanySymbol(row: {
  companySymbol?: string | null;
  companyName?: string | null;
}): string {
  return row.companySymbol?.trim() || getCompanySymbol(row.companyName ?? "");
}

export function getCompanySymbolOptions(
  rows: { companyName: string; companySymbol?: string | null }[],
): string[] {
  return Array.from(new Set(rows.map(getRowCompanySymbol).filter(Boolean)));
}

export function getLeadIdOptions(
  rows: { companyName: string; lead: string }[],
): string[] {
  return Array.from(new Set(rows.map((row) => getLeadId(row))));
}
