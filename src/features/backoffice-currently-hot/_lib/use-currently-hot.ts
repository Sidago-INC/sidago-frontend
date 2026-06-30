

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
  };
};

async function fetchCurrentlyHot(
  brand: Brand,
  page: number,
  perPage: number,
) {
  const params = buildPaginationParams(page, perPage, { brand });
  const json = (await api.get(
    `/reports/currently-hot?${params.toString()}`,
  )) as ApiResponse;
  const parsed = parsePaginatedResponse<HotLeadRow>(json);
  return {
    data: parsed.data.map(normalizeHotLeadRow),
    meta: parsed.meta,
  };
}

export function useCurrentlyHot(
  brand: Brand,
  page: number,
  perPage = DEFAULT_PAGE_SIZE,
) {
  return useQuery({
    queryKey: ["currently-hot", brand, page, perPage],
    queryFn: () => fetchCurrentlyHot(brand, page, perPage),
    staleTime: 30_000,
  });
}
