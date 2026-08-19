import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type {
  FilterGate,
  FilterItem,
  SortRule,
} from "@/components/ui/table/types";

/**
 * Keeps a grid's search/filters/sort/groupBy in the URL instead of useState, so
 * a filtered view survives refresh/back-forward and can be shared as a link.
 */
export function useGridUrlState() {
  const [params, setParams] = useSearchParams();

  const searchParam = params.get("search") ?? "";
  const filtersParam = params.get("filters") ?? "";
  const sortParam = params.get("sort") ?? "";
  const groupByParam = params.get("groupBy");

  const { filterItems, rootGate } = useMemo(() => {
    if (!filtersParam)
      return { filterItems: [] as FilterItem[], rootGate: "AND" as FilterGate };
    try {
      const tree = JSON.parse(filtersParam);
      return {
        filterItems: (tree.items ?? []) as FilterItem[],
        rootGate: (tree.gate ?? "AND") as FilterGate,
      };
    } catch {
      // someone hand-edited the URL — ignore it rather than crash the page
      return { filterItems: [] as FilterItem[], rootGate: "AND" as FilterGate };
    }
  }, [filtersParam]);

  const sortRules = useMemo<SortRule[]>(
    () =>
      sortParam
        ? sortParam
            .split(",")
            .filter(Boolean)
            .map((part) => {
              const [field, direction = "asc"] = part.split(":");
              return { field, direction } as SortRule;
            })
        : [],
    [sortParam],
  );

  // write a param, or drop it when empty. replace:true so typing doesn't
  // create one history entry per keystroke.
  const set = useCallback(
    (patch: Record<string, string | null>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(patch)) {
            if (value) next.set(key, value);
            else next.delete(key);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  return {
    // for <Table>
    search: searchParam,
    filterItems,
    rootGate,
    sortRules,
    groupBy: groupByParam,

    // ready to hand straight to the data hook
    grid: useMemo(
      () => ({
        search: searchParam || undefined,
        filters: filtersParam || undefined,
        sort: sortParam || undefined,
        groupBy: groupByParam || undefined,
      }),
      [searchParam, filtersParam, sortParam, groupByParam],
    ),

    // setters — table shapes back to URL
    setSearch: (value: string) => set({ search: value || null }),
    setFilters: (items: FilterItem[], gate: FilterGate) =>
      set({ filters: items.length ? JSON.stringify({ gate, items }) : null }),
    setSort: (rules: SortRule[]) =>
      set({
        sort: rules.length
          ? rules.map((r) => `${r.field}:${r.direction}`).join(",")
          : null,
      }),
    setGroupBy: (field: string | null) => set({ groupBy: field }),
  };
}
