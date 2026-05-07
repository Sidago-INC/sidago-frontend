
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { HotLeadRow } from "@/features/backoffice-shared/types";

type Brand = "svg" | "95rm" | "benton";

type ApiResponse =
  | { ok: true; count: number; data: HotLeadRow[] }
  | { ok: false; error: string };

async function fetchEverBeenHot(brand: Brand): Promise<HotLeadRow[]> {
  const json = (await api.get(`/reports/ever-been-hot?brand=${brand}`)) as ApiResponse;

  if (!json.ok) {
    const message = "error" in json ? json.error : "Failed to load";
    throw new Error(message);
  }

  return json.data;
}

export function useEverBeenHot(brand: Brand) {
  return useQuery({
    queryKey: ["ever-been-hot", brand],
    queryFn: () => fetchEverBeenHot(brand),
    staleTime: 30_000,
  });
}
