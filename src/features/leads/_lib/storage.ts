

import { leadsData, type LeadDirectoryRow } from "./data";

const LEADS_STORAGE_KEY = "sidago.leads";

export function getStoredLeads() {
  if (typeof window === "undefined") {
    return leadsData;
  }

  const stored = window.localStorage.getItem(LEADS_STORAGE_KEY);

  if (!stored) {
    return leadsData;
  }

  try {
    const parsed = JSON.parse(stored) as LeadDirectoryRow[];
    return Array.isArray(parsed) ? parsed : leadsData;
  } catch {
    return leadsData;
  }
}

export function saveStoredLeads(rows: LeadDirectoryRow[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(rows));
}
