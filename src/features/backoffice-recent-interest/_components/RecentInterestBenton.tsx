

import React, { useEffect, useState } from "react";
import { useGridPage } from "@/lib/use-grid-page";
import { useRecentInterest } from "../_lib/use-recent-interest";
import { RecentInterestTable } from "./RecentInterestTable";

export function RecentInterestBenton() {
  const {
    page,
    perPage,
    setPage,
    setPerPage,
    url,
    searchInput,
    setSearchInput,
  } = useGridPage();


  const { data: result, isLoading, isError, error } = useRecentInterest(
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
      title="Recent Interest - Benton"
      brand="benton"
    />
  );
}
