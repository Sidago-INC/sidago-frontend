import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// GET/PATCH /api/email-rotation-policies — admin only (email.settings).
// A stage either has the brand's own value (source "brand") or inherits the
// deployment default (source "default", EMAIL_ROTATION_STAGES on the server).

export type RotationStage = "2nd" | "3rd" | "finished";

export type StagePolicy = {
  stage: RotationStage;
  enabled: boolean;
  source: "brand" | "default";
};

export type BrandRotationPolicy = {
  id: string;
  code: string;
  displayName: string;
  stages: StagePolicy[];
};

type ListResponse = {
  ok: true;
  data: BrandRotationPolicy[];
  defaultStages: RotationStage[];
};

/** true/false = the brand's own value, null = use the default. */
export type RotationChange = Partial<Record<RotationStage, boolean | null>>;

export const rotationPoliciesKey = ["email-rotation-policies"] as const;

export function useRotationPolicies() {
  return useQuery({
    queryKey: rotationPoliciesKey,
    queryFn: async () => (await api.get("/email-rotation-policies")) as ListResponse,
    staleTime: 30_000,
  });
}

export function useUpdateRotationPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { brandCode: string; changes: RotationChange }) =>
      (await api.patch(
        `/email-rotation-policies/${encodeURIComponent(vars.brandCode)}`,
        vars.changes,
      )) as { ok: true; data: BrandRotationPolicy },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: rotationPoliciesKey });
      // Who an email goes to may have changed.
      void qc.invalidateQueries({ queryKey: ["email-recipients"] });
      void qc.invalidateQueries({ queryKey: ["email-queue"] });
    },
  });
}
