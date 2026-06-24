

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { HotLeadRow } from "@/features/backoffice-shared/types";
import { normalizeHotLeadRow } from "@/features/backoffice-shared/normalize-hot-lead-row";

type Brand = "svg" | "95rm" | "benton";

type ApiResponse = { ok: true; count: number; data: HotLeadRow[] };

async function fetchUnassignedHot(brand: Brand): Promise<HotLeadRow[]> {
  const json = (await api.get(`/reports/unassigned-hot?brand=${brand}`)) as ApiResponse;
  return json.data.map(normalizeHotLeadRow);
}

export function useUnassignedHot(brand: Brand) {
  return useQuery({
    queryKey: ["unassigned-hot", brand],
    queryFn: () => fetchUnassignedHot(brand),
    staleTime: 30_000,
  });
}
