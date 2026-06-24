

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { resolveLeadTimezone, stripTimezonePrefix } from "@/types/timezone.types";
import type { RecentInterestRow } from "./data";

type Brand = "svg" | "95rm" | "benton";

type ApiRecentInterestRow = RecentInterestRow & {
  company_symbol?: string | null;
  company_timezone?: string | null;
  contact_person?: string | null;
  follow_up_date_cleaned?: string | null;
  assigned_to?: string | null;
  call_result?: string | null;
  lead_type?: string | null;
  company?: {
    name?: string | null;
    symbol?: string | null;
    timezone?: string | null;
  } | null;
};

type ApiResponse = { ok: true; count: number; data: ApiRecentInterestRow[] };

function normalizeRecentInterestRow(raw: ApiRecentInterestRow): RecentInterestRow {
  const companyName =
    raw.companyName?.trim() ||
    raw.company?.name?.trim() ||
    "";
  const companySymbol =
    raw.companySymbol?.trim() ||
    raw.company_symbol?.trim() ||
    raw.company?.symbol?.trim() ||
    "";
  const timezone =
    resolveLeadTimezone(
      raw.timezone ?? raw.company_timezone ?? raw.company?.timezone,
      raw.company?.timezone,
    ) ?? "";

  return {
    ...raw,
    companyName,
    companySymbol,
    contactPerson:
      raw.contactPerson?.trim() ||
      raw.contact_person?.trim() ||
      "",
    followUpDateCleaned:
      raw.followUpDateCleaned?.trim() ||
      raw.follow_up_date_cleaned?.trim() ||
      "",
    assignedTo: raw.assignedTo?.trim() || raw.assigned_to?.trim() || "",
    callResult: raw.callResult?.trim() || raw.call_result?.trim() || "",
    leadType: raw.leadType?.trim() || raw.lead_type?.trim() || "",
    timezone: timezone ? stripTimezonePrefix(timezone) : "",
  };
}

async function fetchRecentInterest(brand: Brand): Promise<RecentInterestRow[]> {
  const json = (await api.get(`/reports/recent-interest?brand=${brand}`)) as ApiResponse;
  return json.data.map(normalizeRecentInterestRow);
}

export function useRecentInterest(brand: Brand) {
  return useQuery({
    queryKey: ["recent-interest", brand],
    queryFn: () => fetchRecentInterest(brand),
    staleTime: 30_000,
  });
}
