import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { agentCallsApi } from "@/features/agent-calls/_lib/agentCallsApi";
import type { CatalogBrand } from "@/hooks/useBrandCatalog";
import { api } from "@/lib/api";

export type ManualUpdateBody = {
  leadId: string;
  agentId: string;
  brandCode: string;
  resultCode: string;
  notes?: string;
  followUpDate?: string;
};

type ManualUpdateResponse = {
  ok: true;
  callLogId: string;
  leadId: string;
};

export function useCreateManualUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: ManualUpdateBody) =>
      (await api.post("/manual-updates", body)) as ManualUpdateResponse,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["level-2-history"] });
    },
  });
}

// Null when the label matches no brand. Callers must not post in that case.
export function campaignLabelToBrandCode(
  label: string,
  extraBrands: CatalogBrand[] = [],
): ManualUpdateBody["brandCode"] | null {
  const normalized = label.trim().toLowerCase();
  switch (normalized) {
    case "benton":
      return "benton";
    case "95rm":
      return "95rm";
    case "svg":
    case "":
      return "svg";
    default:
      return (
        extraBrands.find(
          (brand) =>
            brand.displayName.trim().toLowerCase() === normalized ||
            brand.code === normalized,
        )?.code ?? null
      );
  }
}

// /auth/me carries no brand, so an agent's own brand comes from their calls log
// summary. Same key as useCallsLogSummary, so the cache is shared.
export function useAgentOwnBrandCode(
  agentSlug: string | null | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["calls-log", agentSlug, "summary", ""],
    queryFn: () => agentCallsApi.callsLogSummary(agentSlug ?? "", ""),
    enabled: enabled && Boolean(agentSlug),
    select: (summary) => summary.brandCode?.toLowerCase() ?? null,
  });
}
