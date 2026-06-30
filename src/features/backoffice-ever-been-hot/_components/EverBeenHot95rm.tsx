

import React from "react";
import { useServerPagination } from "@/lib/use-server-pagination";
import { useEverBeenHot } from "../_lib/use-ever-been-hot";
import { EverBeenHotTable } from "./EverBeenHotTable";

export function EverBeenHot95rm() {
  const { page, perPage, setPage, setPerPage } = useServerPagination();
  const { data: result, isLoading, isError, error } = useEverBeenHot(
    "95rm",
    page,
    perPage,
  );

  if (isLoading) {
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
      title="Ever Been Hot - 95RM"
      variant="95rm"
    />
  );
}
