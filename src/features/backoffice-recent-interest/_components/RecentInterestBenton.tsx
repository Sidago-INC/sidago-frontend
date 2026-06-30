

import React from "react";
import { useServerPagination } from "@/lib/use-server-pagination";
import { useRecentInterest } from "../_lib/use-recent-interest";
import { RecentInterestTable } from "./RecentInterestTable";

export function RecentInterestBenton() {
  const { page, perPage, setPage, setPerPage } = useServerPagination();
  const { data: result, isLoading, isError, error } = useRecentInterest(
    "benton",
    page,
    perPage,
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
      title="Recent Interest - Benton"
      brand="benton"
    />
  );
}
