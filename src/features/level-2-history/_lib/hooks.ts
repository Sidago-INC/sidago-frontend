import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Level2HistoryRow } from "./data";

type Response = { ok: true; count: number; data: Level2HistoryRow[] };

// Pulls the Level 2 history list. Filtered server-side to source_type='level_2'
// so agent-side manual updates (future source_type='manual_update' rows) don't
// leak into this view.
export function useLevel2History(limit: number) {
  return useQuery({
    queryKey: ["level-2-history", limit],
    queryFn: async () => {
      const json = (await api.get(
        `/level-2-requests?sourceType=level_2&limit=${limit}`,
      )) as Response;
      return json.data;
    },
    staleTime: 30_000,
  });
}
