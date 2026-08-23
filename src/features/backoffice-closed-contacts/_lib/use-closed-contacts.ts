

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  buildPaginationParams,
  DEFAULT_PAGE_SIZE,
  parsePaginatedResponse,
} from "@/lib/pagination";
import type { ClosedContactRow } from "./data";

type Brand = "svg" | "95rm" | "benton";
type Category = "current" | "historical" | "all";

type ApiResponse = {
  ok: true;
  data: ClosedContactRow[];
  meta: {
    total_count: number;
    per_page: number;
    current_page: number;
    total_pages: number;
    groups?: { value: string; count: number }[];
  };
};

export type ClosedContactsGridQuery = {
  search?: string;
  filters?: string;
  sort?: string;
  groupBy?: string;
};

async function fetchClosedContracts(
  category: Category,
  page: number,
  perPage: number,
  brand: Brand | undefined,
  grid: ClosedContactsGridQuery,
) {
  const extra: Record<string, string> = { category };
  if (brand) extra.brand = brand;
  if (grid.search) extra.search = grid.search;
  if (grid.filters) extra.filters = grid.filters;
  if (grid.sort) extra.sort = grid.sort;
  if (grid.groupBy) extra.groupBy = grid.groupBy;

  const params = buildPaginationParams(page, perPage, extra);
  const json = (await api.get(
    `/reports/closed-contracts?${params.toString()}`,
  )) as ApiResponse;
  const parsed = parsePaginatedResponse<ClosedContactRow>(json);
  return { ...parsed, meta: { ...parsed.meta, groups: json.meta.groups } };
}

export function useClosedContracts(
  category: Category,
  brand: Brand | undefined,
  page: number,
  perPage = DEFAULT_PAGE_SIZE,
  grid: ClosedContactsGridQuery = {},
) {
  return useQuery({
    queryKey: [
      "closed-contracts",
      category,
      brand ?? "all",
      page,
      perPage,
      grid,
    ],
    queryFn: () => fetchClosedContracts(category, page, perPage, brand, grid),
    // Grid data: hold the previous page on screen while the next one loads.
    // Without this the hook drops to isLoading/undefined between keystrokes and
    // the page unmounts itself, taking the search box with it.
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
