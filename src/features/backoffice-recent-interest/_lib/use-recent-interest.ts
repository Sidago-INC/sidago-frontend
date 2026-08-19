

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  buildPaginationParams,
  DEFAULT_PAGE_SIZE,
  parsePaginatedResponse,
} from "@/lib/pagination";
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

type ApiResponse = {
  ok: true;
  data: ApiRecentInterestRow[];
  meta: {
    total_count: number;
    per_page: number;
    current_page: number;
    total_pages: number;
    groups?: { value: string; count: number }[];
  };
};

export type RecentInterestGridQuery = {
  search?: string;
  filters?: string;
  sort?: string;
  groupBy?: string;
};

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

async function fetchRecentInterest(
  brand: Brand,
  page: number,
  perPage: number,
  grid: RecentInterestGridQuery,
) {
  const params = buildPaginationParams(page, perPage, {
    brand,
    ...(grid.search ? { search: grid.search } : {}),
    ...(grid.filters ? { filters: grid.filters } : {}),
    ...(grid.sort ? { sort: grid.sort } : {}),
    ...(grid.groupBy ? { groupBy: grid.groupBy } : {}),
  });
  const json = (await api.get(
    `/reports/recent-interest?${params.toString()}`,
  )) as ApiResponse;
  const parsed = parsePaginatedResponse<ApiRecentInterestRow>(json);
  return {
    data: parsed.data.map(normalizeRecentInterestRow),
    meta: { ...parsed.meta, groups: json.meta.groups },
  };
}

export function useRecentInterest(
  brand: Brand,
  page: number,
  perPage = DEFAULT_PAGE_SIZE,
  grid: RecentInterestGridQuery = {},
) {
  return useQuery({
    queryKey: ["recent-interest", brand, page, perPage, grid],
    queryFn: () => fetchRecentInterest(brand, page, perPage, grid),
    staleTime: 30_000,
  });
}
