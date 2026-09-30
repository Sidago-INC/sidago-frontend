import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * The shared Level 2 Update board.
 *
 * The grid used to be a `sessionStorage` array, private to one browser, so two
 * people working the same list could not see each other's rows — the whole of
 * the "updates only show on one dashboard" defect. Rows now live on the
 * server: every open draft plus every result logged today, for everyone.
 */

export const LEVEL2_BOARD_KEY = ["level-2-board"] as const;

/** How often the board picks up other people's edits. */
const BOARD_POLL_MS = 10_000;

export type Level2BoardStatus =
  | "draft"
  | "queued"
  | "processing"
  | "processed"
  | string;

export type Level2BoardRow = {
  id: string;
  status: Level2BoardStatus;
  leadId: string;
  leadLabel: string;
  campaign: string | null;
  level2AgentName: string;
  level2AgentUserId: string | null;
  resultUpdate: string | null;
  updatedNotes: string | null;
  callBackDate: string | null;
  createdAt: string;
  submittedByUserId: string | null;
  submittedByName: string;
  leadTypeSvg: string | null;
  leadTypeBenton: string | null;
  leadType95rm: string | null;
};

type BoardResponse = { ok: true; count: number; data: Level2BoardRow[] };

/**
 * Polls rather than subscribes: there is no websocket layer in this stack, and
 * one small query every ten seconds is cheaper to run and reason about than
 * introducing one for a grid a handful of people share.
 */
export function useLevel2Board() {
  return useQuery({
    queryKey: LEVEL2_BOARD_KEY,
    queryFn: async () => {
      const json = (await api.get("/level-2-drafts")) as BoardResponse;
      return json.data;
    },
    refetchInterval: BOARD_POLL_MS,
    refetchOnWindowFocus: true,
    // Someone else's edit landing mid-keystroke must not blank the field being
    // typed into. The grid keeps its own overlay of unsaved edits and each
    // successful save writes straight into this cache, so a refetch never
    // rolls a confirmed value backwards.
    staleTime: 0,
  });
}

export type Level2DraftPatch = {
  brand?: string;
  level2AgentName?: string;
  resultUpdate?: string;
  updatedNotes?: string;
  callBackDate?: string;
};

/** Maps a patch field onto the board row column it writes. */
const PATCH_TO_ROW: Record<keyof Level2DraftPatch, keyof Level2BoardRow> = {
  brand: "campaign",
  level2AgentName: "level2AgentName",
  resultUpdate: "resultUpdate",
  updatedNotes: "updatedNotes",
  callBackDate: "callBackDate",
};

export function useCreateLevel2Draft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { leadId: string; brand: string }) =>
      (await api.post("/level-2-drafts", body)) as {
        ok: true;
        id: string;
        createdAt: string;
      },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LEVEL2_BOARD_KEY });
    },
  });
}

/**
 * Saves one field.
 *
 * Sending only what changed is what makes the shared board workable: two
 * people editing different cells of the same row never collide, and the same
 * cell resolves last-write-wins. No version numbers, no "someone else changed
 * this" dialogs interrupting a sentence.
 *
 * On success the new value is written straight into the board cache. Without
 * that, the window between the save resolving and the next poll would still
 * hold the old value and the cell would visibly flick back.
 */
export function usePatchLevel2Draft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Level2DraftPatch;
    }) => {
      await api.patch(`/level-2-drafts/${id}`, patch);
      return { id, patch };
    },
    onSuccess: ({ id, patch }) => {
      qc.setQueryData<Level2BoardRow[]>(LEVEL2_BOARD_KEY, (current) =>
        current?.map((row) => {
          if (row.id !== id) return row;
          const next = { ...row };
          for (const [key, value] of Object.entries(patch)) {
            const column = PATCH_TO_ROW[key as keyof Level2DraftPatch];
            if (column) {
              (next as Record<string, unknown>)[column] = value || null;
            }
          }
          // Changing the campaign clears the agent server-side, because agents
          // are per brand. Mirror it or the cell shows a name that is no
          // longer stored.
          if (patch.brand !== undefined) {
            next.level2AgentName = "";
            next.level2AgentUserId = null;
          }
          return next;
        }),
      );
    },
  });
}

export function useDeleteLevel2Draft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/level-2-drafts/${id}`);
      return id;
    },
    onSuccess: (id) => {
      // Drop it immediately rather than waiting for the next poll — the row
      // the user just discarded should not linger for ten seconds.
      qc.setQueryData<Level2BoardRow[]>(LEVEL2_BOARD_KEY, (current) =>
        current?.filter((row) => row.id !== id),
      );
      void qc.invalidateQueries({ queryKey: LEVEL2_BOARD_KEY });
    },
  });
}
