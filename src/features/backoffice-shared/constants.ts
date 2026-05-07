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

export const timezoneOptions = TIMEZONE_OPTIONS.map((option) =>
  option.value.replace(/^\d+-/, ""),
);

export function getCompanySymbol(companyName: string): string {
  const words = companyName
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

export function getCompanySymbolOptions(
  rows: { companyName: string }[],
): string[] {
  return Array.from(
    new Set(rows.map((row) => getCompanySymbol(row.companyName))),
  );
}

export function getLeadIdOptions(
  rows: { companyName: string; lead: string }[],
): string[] {
  return Array.from(new Set(rows.map((row) => getLeadId(row))));
}
