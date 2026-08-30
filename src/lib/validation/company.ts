import type { COMPANY } from "@/types/company.types";
import { maxLength, pattern, required, url, type Rule } from "./index";

// Only symbol, name, timezone and country are required for company creation.
// The remaining fields are admin enrichments that the backoffice fills in
// after a lead has been worked, so we don't block creation on them.
export const companyValidationSchema: Record<keyof COMPANY, Rule[]> = {
  symbol: [
    required("Company symbol is required."),
    // 128 is the width of companies.company_symbol (migration 040 widened it
    // from the original 16). The old 16 predated that and made most of the
    // real data un-saveable: 2,323 of 15,919 production symbols are longer
    // than 16 characters — every "SP : <firm name>" row — the longest being
    // 114. Keep this in step with the column, not with a guess.
    maxLength(128, "Company symbol must be 128 characters or fewer."),
  ],
  name: [
    required("Company name is required."),
    maxLength(120, "Company name must be 120 characters or fewer."),
  ],
  timezone: [required("Time zone is required.")],
  country: [required("Country is required.")],
  description: [maxLength(500, "Description must be 500 characters or fewer.")],
  estimatedMarketCap: [
    maxLength(30, "Estimated market cap must be 30 characters or fewer."),
    pattern(
      /^(\$?\d+(\.\d+)?\s?[KMBT]?)?$/i,
      "Use a market cap like $4.2B, 920M, or 1200000.",
    ),
  ],
  primaryVenue: [maxLength(60, "Primary venue must be 60 characters or fewer.")],
  city: [maxLength(80, "City must be 80 characters or fewer.")],
  state: [maxLength(80, "State must be 80 characters or fewer.")],
  website: [
    maxLength(160, "Website must be 160 characters or fewer."),
    url("Website must start with http:// or https://."),
  ],
  twitterHandle: [
    maxLength(16, "X handle must be 16 characters or fewer."),
    pattern(/^(@?[A-Za-z0-9_]{1,15})?$/, "Use a valid X handle."),
  ],
  zip: [maxLength(20, "Zip must be 20 characters or fewer.")],
};
