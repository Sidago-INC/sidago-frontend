import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { LEVEL2_BOARD_KEY } from "./board";

/**
 * The Delisted column of the Level 2 Update board.
 *
 *   POST   /level-2-delisting/:leadId   delist the lead's company
 *   PATCH  /level-2-delisting/:leadId   edit the delisting reason
 *   DELETE /level-2-delisting/:leadId   restore the company
 *
 * The current state is read from the board itself (companyDelisted etc. on
 * every row), so there is no separate list query.
 */

export type DelistCompanyResponse = {
  ok: true;
  companyId: string;
  leadsAffected: number;
  brandStatesUpdated: number;
  flagsCreated: number;
};

export type RestoreCompanyResponse = {
  ok: true;
  companyId: string;
  leadsRestored: number;
  brandStatesRestored: number;
  flagsResolved: number;
};

// Delisting or restoring rewrites lead types on every lead at the company, so
// every query that shows lead types is stale afterwards, not just the board.
function useInvalidateAfterDelisting() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: LEVEL2_BOARD_KEY });
    void qc.invalidateQueries({ queryKey: ["lead-brand-states"] });
    void qc.invalidateQueries({ queryKey: ["leads"] });
  };
}

export function useDelistCompany() {
  const invalidate = useInvalidateAfterDelisting();
  return useMutation({
    mutationFn: async ({
      leadId,
      reason,
    }: {
      leadId: string;
      reason: string | null;
    }) =>
      (await api.post(`/level-2-delisting/${leadId}`, {
        reason,
      })) as DelistCompanyResponse,
    onSuccess: invalidate,
  });
}

export function useUpdateDelistingReason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      leadId,
      reason,
    }: {
      leadId: string;
      reason: string | null;
    }) => {
      await api.patch(`/level-2-delisting/${leadId}`, { reason });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LEVEL2_BOARD_KEY });
    },
  });
}

export function useRestoreCompany() {
  const invalidate = useInvalidateAfterDelisting();
  return useMutation({
    mutationFn: async (leadId: string) =>
      (await api.delete(
        `/level-2-delisting/${leadId}`,
      )) as RestoreCompanyResponse,
    onSuccess: invalidate,
  });
}
