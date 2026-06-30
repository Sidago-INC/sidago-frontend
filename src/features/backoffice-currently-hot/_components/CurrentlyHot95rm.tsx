

import React from "react";
import { useServerPagination } from "@/lib/use-server-pagination";
import { useCurrentlyHot } from "../_lib/use-currently-hot";
import { CurrentlyHotTable } from "./CurrentlyHotTable";

export function CurrentlyHot95rm() {
  const { page, perPage, setPage, setPerPage } = useServerPagination();
  const { data: result, isLoading, isError, error } = useCurrentlyHot(
    "95rm",
    page,
    perPage,
  );

  if (isLoading) {
    return (
      <div className="flex min-h-50 items-center justify-center text-sm text-gray-500">
        Loading currently hot leads…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-50 items-center justify-center text-sm text-red-500">
        Failed to load: {error instanceof Error ? error.message : String(error)}
      </div>
    );
  }

  return (
    <CurrentlyHotTable
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
      title="Currently Hot Leads - 95RM"
      variant="95rm"
    />
  );
}
