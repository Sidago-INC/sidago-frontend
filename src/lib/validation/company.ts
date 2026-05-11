import type { COMPANY } from "@/types/company.types";
import { maxLength, pattern, required, url, type Rule } from "./index";

export const companyValidationSchema: Record<keyof COMPANY, Rule[]> = {
  symbol: [
    required("Company symbol is required."),
    maxLength(10, "Company symbol must be 10 characters or fewer."),
    pattern(/^[A-Za-z0-9.-]+$/, "Use letters, numbers, dots, or hyphens only."),
  ],
  name: [
    required("Company name is required."),
    maxLength(120, "Company name must be 120 characters or fewer."),
  ],
  timezone: [required("Time zone is required.")],
  country: [required("Country is required.")],
  description: [
    required("Description is required."),
    maxLength(500, "Description must be 500 characters or fewer."),
  ],
  estimatedMarketCap: [
    required("Estimated market cap is required."),
    maxLength(30, "Estimated market cap must be 30 characters or fewer."),
    pattern(
      /^\$?\d+(\.\d+)?\s?[KMBT]?$/i,
      "Use a market cap like $4.2B, 920M, or 1200000.",
    ),
  ],
  primaryVenue: [
    required("Primary venue is required."),
    maxLength(60, "Primary venue must be 60 characters or fewer."),
  ],
  city: [
    required("City is required."),
    maxLength(80, "City must be 80 characters or fewer."),
  ],
  state: [
    required("State is required."),
    maxLength(80, "State must be 80 characters or fewer."),
  ],
  website: [
    required("Website is required."),
    maxLength(160, "Website must be 160 characters or fewer."),
    url("Website must start with http:// or https://."),
  ],
  twitterHandle: [
    required("X handle is required."),
    maxLength(16, "X handle must be 16 characters or fewer."),
    pattern(/^@?[A-Za-z0-9_]{1,15}$/, "Use a valid X handle."),
  ],
  zip: [
    required("Zip is required."),
    maxLength(20, "Zip must be 20 characters or fewer."),
  ],
};
