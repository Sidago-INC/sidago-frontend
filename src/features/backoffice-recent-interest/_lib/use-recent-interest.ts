

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { RecentInterestRow } from "./data";

type Brand = "svg" | "95rm" | "benton";

type ApiResponse = { ok: true; count: number; data: RecentInterestRow[] };

async function fetchRecentInterest(brand: Brand): Promise<RecentInterestRow[]> {
  const json = (await api.get(`/reports/recent-interest?brand=${brand}`)) as ApiResponse;
  return json.data;
}

export function useRecentInterest(brand: Brand) {
  return useQuery({
    queryKey: ["recent-interest", brand],
    queryFn: () => fetchRecentInterest(brand),
    staleTime: 30_000,
  });
}
