

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { HotLeadRow } from "@/features/backoffice-shared/types";

type Brand = "svg" | "95rm" | "benton";

type ApiResponse = { ok: true; count: number; data: HotLeadRow[] };

async function fetchEverBeenHot(brand: Brand): Promise<HotLeadRow[]> {
  const json = (await api.get(`/reports/ever-been-hot?brand=${brand}`)) as ApiResponse;
  return json.data;
}

export function useEverBeenHot(brand: Brand) {
  return useQuery({
    queryKey: ["ever-been-hot", brand],
    queryFn: () => fetchEverBeenHot(brand),
    staleTime: 30_000,
  });
}
