import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { isLegacyBrandCode } from "@/lib/brands";

export type CatalogBrand = {
  id: string;
  code: string;
  displayName: string;
  parentBrandId: string | null;
  sortOrder: number;
};

export const BRAND_CATALOG_QUERY_KEY = ["brands", "catalog"];

// Active product brands, including svg, 95rm and benton.
export function useBrandCatalog(enabled = true) {
  return useQuery({
    queryKey: BRAND_CATALOG_QUERY_KEY,
    queryFn: async () => {
      const json = (await api.get("/brands/catalog")) as { data: CatalogBrand[] };
      return json.data;
    },
    enabled,
    staleTime: 5 * 60_000,
  });
}

// Brands created after svg, 95rm and benton. Those three have their own columns
// and routes, so pages add only these on top.
export function useExtraBrands(enabled = true): CatalogBrand[] {
  const { data } = useBrandCatalog(enabled);
  return useMemo(
    () => (data ?? []).filter((brand) => !isLegacyBrandCode(brand.code)),
    [data],
  );
}

export function useBrandName(code: string): string {
  const { data } = useBrandCatalog();
  return data?.find((brand) => brand.code === code)?.displayName ?? code;
}

export function useSuperOwner(enabled = true) {
  const query = useQuery({
    queryKey: ["brands", "me"],
    queryFn: async () => {
      const json = (await api.get("/brands/me")) as {
        data: { isSuperOwner: boolean };
      };
      return json.data.isSuperOwner;
    },
    enabled,
    staleTime: 5 * 60_000,
  });
  return { isSuperOwner: query.data === true, isLoading: query.isLoading };
}
