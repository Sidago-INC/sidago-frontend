import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  buildPaginationParams,
  DEFAULT_PAGE_SIZE,
  parsePaginatedResponse,
} from "@/lib/pagination";
import type { Level2HistoryRow } from "./data";

type Response = {
  ok: true;
  data: Level2HistoryRow[];
  meta: {
    total_count: number;
    per_page: number;
    current_page: number;
    total_pages: number;
  };
};

// Pulls the Level 2 history list. Filtered server-side to source_type='level_2'
// so agent-side manual updates (future source_type='manual_update' rows) don't
// leak into this view.
export function useLevel2History(page: number, perPage = DEFAULT_PAGE_SIZE) {
  return useQuery({
    queryKey: ["level-2-history", page, perPage],
    queryFn: async () => {
      const params = buildPaginationParams(page, perPage, {
        sourceType: "level_2",
      });
      const json = (await api.get(
        `/level-2-requests?${params.toString()}`,
      )) as Response;
      return parsePaginatedResponse<Level2HistoryRow>(json);
    },
    staleTime: 30_000,
  });
}
