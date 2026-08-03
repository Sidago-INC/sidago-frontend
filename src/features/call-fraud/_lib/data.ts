import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export function useSuspiciousCalls(
  page: number,
  perPage: number,
  filters: { brandId?: string; userId?: string } = {},
) {
  return useQuery({
    queryKey: ["call-fraud-suspicious", page, perPage, filters],
    queryFn: async () => {
      const extra: Record<string, string> = {};
      if (filters.brandId) extra.brandId = filters.brandId;
      if (filters.userId) extra.userId = filters.userId;
      const params = buildPaginationParams(page, perPage, extra);
      const json = await api.get(`/call-fraud/suspicious?${params.toString()}`);
      const parsed = parsePaginatedResponse<SuspiciousCallRow>(json);
      return {
        ...parsed,
        data: parsed.data.map((row) => ({
          ...row,
          mcRecordingLink: row.mcRecordingLink
            ? ensureAbsoluteUrl(row.mcRecordingLink)
            : null,
        })),
      };
    },
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
