import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  buildPaginationParams,
  DEFAULT_PAGE_SIZE,
  parsePaginatedResponse,
} from "@/lib/pagination";
import { LEVEL2_BOARD_KEY } from "@/features/level-2-update/_lib/board";

export type DelistedLeadRow = {
  leadId: string;
  leadIdExternal: string | null;
  companySymbol: string | null;
  companyName: string | null;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  contactType: string | null;
  delistedAt: string | null;
  delistedByName: string | null;
  delistedReason: string | null;
  delistedBrands: string[];
};

type DelistedLeadsResponse = {
  ok: true;
  data: DelistedLeadRow[];
  meta: {
    total_count: number;
    per_page: number;
    current_page: number;
    total_pages: number;
    groups?: { value: string; count: number }[];
  };
};

export type DelistedLeadsGridQuery = {
  search?: string;
  filters?: string;
  sort?: string;
  groupBy?: string;
};

export type DelistCompanyResult = {
  ok: true;
  companyId: string;
  leadsAffected: number;
  brandStatesUpdated: number;
  flagsCreated: number;
  alreadyDelisted: boolean;
};

export type RestoreCompanyResult = {
  ok: true;
  companyId: string;
  leadsRestored: number;
  brandStatesRestored: number;
  flagsResolved: number;
};

export function getDelistedBrandLabel(brand: string): string {
  switch (brand.toLowerCase()) {
    case "svg":
      return "SVG";
    case "95rm":
      return "95RM";
    case "benton":
      return "Benton";
    default:
      return brand;
  }
}

export function useDelistedLeads(
  page: number,
  perPage = DEFAULT_PAGE_SIZE,
  grid: DelistedLeadsGridQuery = {},
) {
  return useQuery({
    queryKey: ["delisted-leads", page, perPage, grid],
    queryFn: async () => {
      const params = buildPaginationParams(page, perPage, {
        ...(grid.search ? { search: grid.search } : {}),
        ...(grid.filters ? { filters: grid.filters } : {}),
        ...(grid.sort ? { sort: grid.sort } : {}),
        ...(grid.groupBy ? { groupBy: grid.groupBy } : {}),
      });
      const json = (await api.get(
        `/delisted-leads?${params.toString()}`,
      )) as DelistedLeadsResponse;
      const parsed = parsePaginatedResponse<DelistedLeadRow>(json);
      return { ...parsed, meta: { ...parsed.meta, groups: json.meta.groups } };
    },
    // Hold the previous page on screen while the next one loads, so the search
    // box does not unmount between keystrokes.
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

// Delisting rewrites lead types on every lead at the company, so every query
// that shows lead types is stale afterwards, and so is the Level 2 board.
function useInvalidateDelisting() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ["delisted-leads"] });
    void qc.invalidateQueries({ queryKey: LEVEL2_BOARD_KEY });
    void qc.invalidateQueries({ queryKey: ["lead-brand-states"] });
    void qc.invalidateQueries({ queryKey: ["leads"] });
  };
}

export function useCreateDelistedLead() {
  const invalidate = useInvalidateDelisting();
  return useMutation({
    mutationFn: async ({ leadId, reason }: { leadId: string; reason: string | null }) =>
      (await api.post("/delisted-leads", { leadId, reason })) as DelistCompanyResult,
    onSuccess: invalidate,
  });
}

export function useUpdateDelistedLeadReason() {
  const invalidate = useInvalidateDelisting();
  return useMutation({
    mutationFn: async ({ leadId, reason }: { leadId: string; reason: string | null }) => {
      await api.patch(`/delisted-leads/${leadId}`, { reason });
    },
    onSuccess: invalidate,
  });
}

export function useRestoreDelistedLead() {
  const invalidate = useInvalidateDelisting();
  return useMutation({
    mutationFn: async (leadId: string) =>
      (await api.delete(`/delisted-leads/${leadId}`)) as RestoreCompanyResult,
    onSuccess: invalidate,
  });
}
