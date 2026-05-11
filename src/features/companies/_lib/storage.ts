

import { COMPANY_VALUES, type COMPANY } from "@/types/company.types";

const COMPANIES_STORAGE_KEY = "sidago.companies";

export function getStoredCompanies() {
  if (typeof window === "undefined") {
    return COMPANY_VALUES;
  }

  const stored = window.localStorage.getItem(COMPANIES_STORAGE_KEY);

  if (!stored) {
    return COMPANY_VALUES;
  }

  try {
    const parsed = JSON.parse(stored) as COMPANY[];
    return Array.isArray(parsed) ? parsed : COMPANY_VALUES;
  } catch {
    return COMPANY_VALUES;
  }
}

export function saveStoredCompanies(companies: COMPANY[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(COMPANIES_STORAGE_KEY, JSON.stringify(companies));
}
