

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { HotLeadRow } from "@/features/backoffice-shared/types";

type Brand = "svg" | "95rm" | "benton";

type ApiResponse = { ok: true; count: number; data: HotLeadRow[] };

async function fetchCurrentlyHot(brand: Brand): Promise<HotLeadRow[]> {
  const json = (await api.get(`/reports/currently-hot?brand=${brand}`)) as ApiResponse;
  return json.data;
}

export function useCurrentlyHot(brand: Brand) {
  return useQuery({
    queryKey: ["currently-hot", brand],
    queryFn: () => fetchCurrentlyHot(brand),
    staleTime: 30_000,
  });
}
