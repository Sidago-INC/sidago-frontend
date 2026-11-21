import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * Reverting a Level 2 update, shared by the Update grid and the History grid.
 *
 * The server replays the snapshot it took when the row was logged, so a revert
 * undoes the whole thing — the call log, the counters, the lead_flags rows, and
 * the same-company leads the "Hot" cascade pushed to On Hold — not just the
 * lead's own type. The response reports what it actually managed to put back,
 * which matters: a related lead somebody else has since moved is deliberately
 * left alone rather than stamped over.
 */
export type Level2RevertResponse = {
  ok: true;
  leadId: string;
  revertedBrand: string | null;
  restoredLeadType: string | null;
  restoredSiblings: number;
  skippedSiblings: number;
  removedCallLogs: number;
  removedFlags: number;
  /** False for rows logged before the server stored snapshots. */
  fullRevert: boolean;
  warning?: string;
};

export function useRevertLevel2Result() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) =>
      (await api.delete(
        `/level-2-requests/${id}/revert`,
        {},
      )) as Level2RevertResponse,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["level-2-history"] });
      // A revert moves lead types on this lead AND on its company siblings, so
      // anything reading brand states has to come back from the server.
      qc.invalidateQueries({ queryKey: ["lead-brand-states"] });
      qc.invalidateQueries({ queryKey: ["leads"] });
      if (data?.leadId) {
        qc.invalidateQueries({ queryKey: ["lead-brand-states", data.leadId] });
      }
    },
  });
}

/** Turns the revert response into one sentence for the success toast. */
export function buildRevertMessage(result: Level2RevertResponse): string {
  const parts: string[] = [];

  parts.push(
    result.restoredLeadType
      ? `Reverted — lead is back to ${result.restoredLeadType}.`
      : "Level 2 result reverted.",
  );

  if (result.restoredSiblings > 0) {
    parts.push(
      `${result.restoredSiblings} related lead${
        result.restoredSiblings === 1 ? "" : "s"
      } released.`,
    );
  }

  if (result.warning) parts.push(result.warning);

  return parts.join(" ");
}
