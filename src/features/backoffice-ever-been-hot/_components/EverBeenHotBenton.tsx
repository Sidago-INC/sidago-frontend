

import React, { useEffect, useState } from "react";
import { useGridPage } from "@/lib/use-grid-page";
import { useEverBeenHot } from "../_lib/use-ever-been-hot";
import { EverBeenHotTable } from "./EverBeenHotTable";

export function EverBeenHotBenton() {
  const {
    page,
    perPage,
    setPage,
    setPerPage,
    url,
    searchInput,
    setSearchInput,
  } = useGridPage();


  const { data: result, isLoading, isError, error } = useEverBeenHot(
    "benton",
    page,
    perPage,
    url.grid,
  );

  // Only blank the page on the genuine cold start. Every later fetch keeps
  // the previous rows on screen (see `keepPreviousData`), so returning early
  // here would unmount the table — and the search box — on every keystroke.
  if (isLoading && !result) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-sm text-gray-500">
        Loading ever been hot…
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
    <EverBeenHotTable
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
        placeholder: "Search lead, symbol, name, phone, or email",
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
      title="Ever Been Hot - Benton"
      variant="benton"
    />
  );
}
