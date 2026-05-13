import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Picker shape used by the Add Lead form's Company dropdown — the only
// fields it needs to render a "<SYM> - <Name>" option.
export type CompanyPickerRow = {
  id: string;
  symbol: string | null;
  name: string | null;
  label: string;
};

// Full row used by the Companies directory + drawer. Mirrors what
// GET /api/companies returns for every column on the row.
export type CompanyRow = CompanyPickerRow & {
  timezone: string | null;
  country: string | null;
  description: string | null;
  estimatedMarketcap: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  website: string | null;
  twitter: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type CompaniesResponse = { ok: true; count: number; data: CompanyRow[] };

// Companies list for picker dropdowns + the Companies directory. 5-min stale
// time matches the lead picker — the company roster doesn't churn during a
// working session.
export function useCompanyOptions() {
  return useQuery({
    queryKey: ["companies", "picker"],
    queryFn: async () => {
      const json = (await api.get(
        "/companies?limit=2000",
      )) as CompaniesResponse;
      return json.data;
    },
    staleTime: 5 * 60_000,
  });
}

// Patch one company. Body keys mirror the backend PATCH route exactly.
type CompanyPatchBody = Partial<{
  companySymbol: string;
  companyName: string;
  timezone: string;
  country: string;
  description: string;
  estimatedMarketcap: string;
  city: string;
  state: string;
  zip: string;
  website: string;
  twitter: string;
}>;

type CompanyPatchResponse = {
  ok: true;
  company: { id: string; symbol: string | null; name: string | null };
};

export function useUpdateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      companyId,
      body,
    }: {
      companyId: string;
      body: CompanyPatchBody;
    }) => {
      return (await api.patch(
        `/companies/${companyId}`,
        body,
      )) as CompanyPatchResponse;
    },
    // The Add Lead picker and Companies directory share the same cache key,
    // so a single invalidation refreshes both surfaces.
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["companies", "picker"] });
    },
  });
}
