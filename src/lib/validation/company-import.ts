import type { CompanyImportRow } from "@/types/company-import.types";
import type { COMPANY } from "@/types/company.types";
import { COUNTRY_OPTIONS, type COUNTRY } from "@/types/country.types";
import { TIMEZONE_OPTIONS, type TIMEZONE } from "@/types/timezone.types";
import { validateForm } from "./index";
import { companyValidationSchema } from "./company";

const IMPORT_FIELDS: (keyof CompanyImportRow)[] = [
  "symbol",
  "name",
  "timezone",
  "country",
  "description",
  "estimatedMarketCap",
  "primaryVenue",
  "city",
  "state",
  "website",
  "twitterHandle",
  "zip",
];

export function isCompanyImportRowValid(row: CompanyImportRow): boolean {
  for (const key of IMPORT_FIELDS) {
    if (!String(row[key] ?? "").trim()) {
      return false;
    }
  }

  const timezone = row.timezone.trim();
  const country = row.country.trim();

  if (!TIMEZONE_OPTIONS.some((option) => option.value === timezone)) {
    return false;
  }

  if (!COUNTRY_OPTIONS.some((option) => option.value === country)) {
    return false;
  }

  const company: COMPANY = {
    symbol: row.symbol.trim(),
    name: row.name.trim(),
    timezone: timezone as TIMEZONE,
    country: country as COUNTRY,
    description: row.description.trim(),
    estimatedMarketCap: row.estimatedMarketCap.trim(),
    primaryVenue: row.primaryVenue.trim(),
    city: row.city.trim(),
    state: row.state.trim(),
    website: row.website.trim(),
    twitterHandle: row.twitterHandle.trim(),
    zip: row.zip.trim(),
  };

  const errors = validateForm(company, companyValidationSchema);
  return Object.keys(errors).length === 0;
}
