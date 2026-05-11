

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

type Brand = "svg" | "95rm" | "benton";

export type LeadPatchBody = {
  lead?: {
    full_name?: string;
    phone?: string;
    email?: string;
    role?: string;
    contact_type?: string;
    not_work_anymore?: boolean;
    company_name?: string;
  };
  brandStates?: Partial<
    Record<
      Brand,
      {
        lead_type?: string;
        to_be_called_by?: string | null;
        last_called_date?: string | null;
      }
    >
  >;
};

type PatchSuccess = {
  ok: true;
  leadId: string;
  updated: { lead: number; brandStates: Record<string, number> };
};

// Routes through the shared `api` client so the request automatically gets
// the Bearer access token plus 401 → silent-refresh → retry behaviour.
async function patchLead(leadId: string, body: LeadPatchBody) {
  return (await api.patch(`/leads/${leadId}`, body)) as PatchSuccess;
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, body }: { leadId: string; body: LeadPatchBody }) =>
      patchLead(leadId, body),
    onSuccess: () => {
      // A single lead edit can affect any of the report views, so invalidate
      // all of them. Cheap because invalidation only triggers refetches for
      // queries currently mounted on the screen.
      qc.invalidateQueries({ queryKey: ["currently-hot"] });
      qc.invalidateQueries({ queryKey: ["unassigned-hot"] });
      qc.invalidateQueries({ queryKey: ["ever-been-hot"] });
      qc.invalidateQueries({ queryKey: ["recent-interest"] });
      qc.invalidateQueries({ queryKey: ["closed-contracts"] });
    },
  });
}
