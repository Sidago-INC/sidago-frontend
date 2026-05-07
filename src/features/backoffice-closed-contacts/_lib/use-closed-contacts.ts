
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ClosedContactRow } from "./data";

type Brand = "svg" | "95rm" | "benton";
type Category = "current" | "historical" | "all";

type ApiResponse =
  | { ok: true; count: number; data: ClosedContactRow[] }
  | { ok: false; error: string };

async function fetchClosedContracts(
  category: Category,
  brand?: Brand,
): Promise<ClosedContactRow[]> {
  const params = new URLSearchParams({ category });
  if (brand) params.set("brand", brand);
  const json = (await api.get(`/reports/closed-contracts?${params.toString()}`)) as ApiResponse;

  if (!json.ok) {
    const message = "error" in json ? json.error : "Failed to load";
    throw new Error(message);
  }

  return json.data;
}

export function useClosedContracts(category: Category, brand?: Brand) {
  return useQuery({
    queryKey: ["closed-contracts", category, brand ?? "all"],
    queryFn: () => fetchClosedContracts(category, brand),
    staleTime: 30_000,
  });
}
