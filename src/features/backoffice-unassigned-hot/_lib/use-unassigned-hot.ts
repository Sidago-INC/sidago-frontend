

import { useQuery } from "@tanstack/react-query";
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

export type UnassignedHotGridQuery = {
  search?: string;
  filters?: string;
  sort?: string;
  groupBy?: string;
};

async function fetchUnassignedHot(
  brand: Brand,
  page: number,
  perPage: number,
  grid: UnassignedHotGridQuery,
) {
  const params = buildPaginationParams(page, perPage, {
    brand,
    ...(grid.search ? { search: grid.search } : {}),
    ...(grid.filters ? { filters: grid.filters } : {}),
    ...(grid.sort ? { sort: grid.sort } : {}),
    ...(grid.groupBy ? { groupBy: grid.groupBy } : {}),
  });
  const json = (await api.get(
    `/reports/unassigned-hot?${params.toString()}`,
  )) as ApiResponse;
  const parsed = parsePaginatedResponse<HotLeadRow>(json);
  return {
    data: parsed.data.map(normalizeHotLeadRow),
    meta: { ...parsed.meta, groups: json.meta.groups },
  };
}

export function useUnassignedHot(
  brand: Brand,
  page: number,
  perPage = DEFAULT_PAGE_SIZE,
  grid: UnassignedHotGridQuery = {},
) {
  return useQuery({
    queryKey: ["unassigned-hot", brand, page, perPage, grid],
    queryFn: () => fetchUnassignedHot(brand, page, perPage, grid),
    staleTime: 30_000,
  });
}
