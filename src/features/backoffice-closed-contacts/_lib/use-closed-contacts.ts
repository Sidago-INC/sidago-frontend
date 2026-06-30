

import { useQuery } from "@tanstack/react-query";
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
  };
};

async function fetchClosedContracts(
  category: Category,
  page: number,
  perPage: number,
  brand?: Brand,
) {
  const extra: Record<string, string> = { category };
  if (brand) extra.brand = brand;

  const params = buildPaginationParams(page, perPage, extra);
  const json = (await api.get(
    `/reports/closed-contracts?${params.toString()}`,
  )) as ApiResponse;
  return parsePaginatedResponse<ClosedContactRow>(json);
}

export function useClosedContracts(
  category: Category,
  brand: Brand | undefined,
  page: number,
  perPage = DEFAULT_PAGE_SIZE,
) {
  return useQuery({
    queryKey: ["closed-contracts", category, brand ?? "all", page, perPage],
    queryFn: () => fetchClosedContracts(category, page, perPage, brand),
    staleTime: 30_000,
  });
}
