import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type ManualUpdateBody = {
  leadId: string;
  agentId: string;
  brandCode: "svg" | "95rm" | "benton";
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

export function campaignLabelToBrandCode(
  label: string,
): ManualUpdateBody["brandCode"] {
  switch (label.trim().toLowerCase()) {
    case "benton":
      return "benton";
    case "95rm":
      return "95rm";
    default:
      return "svg";
  }
}
