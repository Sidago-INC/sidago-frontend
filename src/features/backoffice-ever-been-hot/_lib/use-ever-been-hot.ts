

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  buildPaginationParams,
  DEFAULT_PAGE_SIZE,
  parsePaginatedResponse,
} from "@/lib/pagination";
import type { HotLeadRow } from "@/features/backoffice-shared/types";
import { normalizeHotLeadRow } from "@/features/backoffice-shared/normalize-hot-lead-row";

type Brand = "svg" | "95rm" | "benton";

type ApiResponse = {
  ok: true;
  data: HotLeadRow[];
  meta: {
    total_count: number;
    per_page: number;
    current_page: number;
    total_pages: number;
    groups?: { value: string; count: number }[];
  };
};

export type EverBeenHotGridQuery = {
  search?: string;
  filters?: string;
  sort?: string;
  groupBy?: string;
};

async function fetchEverBeenHot(
  brand: Brand,
  page: number,
  perPage: number,
  grid: EverBeenHotGridQuery,
) {
  const params = buildPaginationParams(page, perPage, {
    brand,
    ...(grid.search ? { search: grid.search } : {}),
    ...(grid.filters ? { filters: grid.filters } : {}),
    ...(grid.sort ? { sort: grid.sort } : {}),
    ...(grid.groupBy ? { groupBy: grid.groupBy } : {}),
  });
  const json = (await api.get(
    `/reports/ever-been-hot?${params.toString()}`,
  )) as ApiResponse;
  const parsed = parsePaginatedResponse<HotLeadRow>(json);
  return {
    data: parsed.data.map(normalizeHotLeadRow),
    meta: { ...parsed.meta, groups: json.meta.groups },
  };
}

export function useEverBeenHot(
  brand: Brand,
  page: number,
  perPage = DEFAULT_PAGE_SIZE,
  grid: EverBeenHotGridQuery = {},
) {
  return useQuery({
    queryKey: ["ever-been-hot", brand, page, perPage, grid],
    queryFn: () => fetchEverBeenHot(brand, page, perPage, grid),
    // Grid data: hold the previous page on screen while the next one loads.
    // Without this the hook drops to isLoading/undefined between keystrokes and
    // the page unmounts itself, taking the search box with it.
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
