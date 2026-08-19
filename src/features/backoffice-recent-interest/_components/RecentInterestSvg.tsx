

import React, { useEffect, useState } from "react";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { useGridUrlState } from "@/lib/use-grid-url-state";
import { useServerPagination } from "@/lib/use-server-pagination";
import { useRecentInterest } from "../_lib/use-recent-interest";
import { RecentInterestTable } from "./RecentInterestTable";

export function RecentInterestSvg() {
  const { page, perPage, setPage, setPerPage } = useServerPagination();

  const url = useGridUrlState();
  const [searchInput, setSearchInput] = useState(url.search);
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  useEffect(() => {
    url.setSearch(debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url.grid]);

  const { data: result, isLoading, isError, error } = useRecentInterest(
    "svg",
    page,
    perPage,
    url.grid,
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-sm text-gray-500">
        Loading recent interest…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-sm text-red-500">
        Failed to load: {error instanceof Error ? error.message : String(error)}
      </div>
    );
  }

  return (
    <RecentInterestTable
      data={result?.data ?? []}
      serverPagination={
        result?.meta
          ? {
              meta: result.meta,
              onPageChange: setPage,
              onPerPageChange: setPerPage,
            }
          : undefined
      }
      serverSearch={{
        value: searchInput,
        onChange: setSearchInput,
        placeholder: "Search contact, symbol, name, phone, or email",
      }}
      serverGrid={{
        filters: url.filterItems,
        rootGate: url.rootGate,
        sort: url.sortRules,
        groupBy: url.groupBy,
        onFiltersChange: url.setFilters,
        onSortChange: url.setSort,
        onGroupByChange: url.setGroupBy,
        groupCounts: result?.meta?.groups,
      }}
      title="Recent Interest - SVG"
      brand="svg"
    />
  );
}
