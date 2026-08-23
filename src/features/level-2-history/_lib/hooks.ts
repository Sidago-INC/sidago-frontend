import { keepPreviousData, useQuery } from "@tanstack/react-query";
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
    groups?: { value: string; count: number }[];
  };
};

export type Level2HistoryGridQuery = {
  search?: string;
  filters?: string;
  sort?: string;
  groupBy?: string;
};

// Pulls the Level 2 history list. Filtered server-side to source_type='level_2'
// so agent-side manual updates (future source_type='manual_update' rows) don't
// leak into this view.
export function useLevel2History(
  page: number,
  perPage = DEFAULT_PAGE_SIZE,
  grid: Level2HistoryGridQuery = {},
) {
  return useQuery({
    queryKey: ["level-2-history", page, perPage, grid],
    queryFn: async () => {
      const params = buildPaginationParams(page, perPage, {
        sourceType: "level_2",
        ...(grid.search ? { search: grid.search } : {}),
        ...(grid.filters ? { filters: grid.filters } : {}),
        ...(grid.sort ? { sort: grid.sort } : {}),
        ...(grid.groupBy ? { groupBy: grid.groupBy } : {}),
      });
      const json = (await api.get(
        `/level-2-requests?${params.toString()}`,
      )) as Response;
      const parsed = parsePaginatedResponse<Level2HistoryRow>(json);
      return { ...parsed, meta: { ...parsed.meta, groups: json.meta.groups } };
    },
    // Grid data: hold the previous page on screen while the next one loads.
    // Without this the hook drops to isLoading/undefined between keystrokes and
    // the page unmounts itself, taking the search box with it.
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
