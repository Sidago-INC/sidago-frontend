import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { buildPaginationParams, parsePaginatedResponse } from "@/lib/pagination";
import { ensureAbsoluteUrl } from "@/lib/url";

export type SuspiciousCallRow = {
  id: string;
  calledAt: string;
  leadId: string;
  leadName: string | null;
  agentName: string | null;
  brandCode: string;
  resultCode: string | null;
  mcStatus: string | null;
  mcDurationSeconds: number | null;
  mcRecordingLink: string | null;
  fraudFlag: string;
  source: string | null;
};

export type FraudFlagValue = "CLEARED" | "CONFIRMED_FRAUD";

export type CallFraudGridQuery = {
  search?: string;
  filters?: string;
  sort?: string;
  groupBy?: string;
};

type LegacyEnvelopeWithGroups = {
  groups?: { value: string; count: number }[];
};

export function useSuspiciousCalls(
  page: number,
  perPage: number,
  brandFilters: { brandId?: string; userId?: string } = {},
  grid: CallFraudGridQuery = {},
) {
  return useQuery({
    queryKey: ["call-fraud-suspicious", page, perPage, brandFilters, grid],
    queryFn: async () => {
      const extra: Record<string, string> = {};
      if (brandFilters.brandId) extra.brandId = brandFilters.brandId;
      if (brandFilters.userId) extra.userId = brandFilters.userId;
      if (grid.search) extra.search = grid.search;
      if (grid.filters) extra.filters = grid.filters;
      if (grid.sort) extra.sort = grid.sort;
      if (grid.groupBy) extra.groupBy = grid.groupBy;
      const params = buildPaginationParams(page, perPage, extra);
      const json = await api.get(`/call-fraud/suspicious?${params.toString()}`);
      const parsed = parsePaginatedResponse<SuspiciousCallRow>(json);
      return {
        ...parsed,
        meta: {
          ...parsed.meta,
          groups: (json as LegacyEnvelopeWithGroups).groups,
        },
        data: parsed.data.map((row) => ({
          ...row,
          mcRecordingLink: row.mcRecordingLink
            ? ensureAbsoluteUrl(row.mcRecordingLink)
            : null,
        })),
      };
    },
    // Grid data: hold the previous page on screen while the next one loads.
    // Without this the hook drops to isLoading/undefined between keystrokes and
    // the page unmounts itself, taking the search box with it.
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useResolveFraudFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, fraudFlag }: { id: string; fraudFlag: FraudFlagValue }) =>
      api.patch(`/call-fraud/${id}/resolve`, { fraudFlag }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["call-fraud-suspicious"] });
    },
  });
}
