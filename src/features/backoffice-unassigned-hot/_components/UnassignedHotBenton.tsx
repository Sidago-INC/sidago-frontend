

import React from "react";
import { useServerPagination } from "@/lib/use-server-pagination";
import { UnassignedHotTable } from "./UnassignedHotTable";
import { useUnassignedHot } from "../_lib/use-unassigned-hot";

export function UnassignedHotBenton() {
  const { page, perPage, setPage, setPerPage } = useServerPagination();
  const { data: result, isLoading, isError, error } = useUnassignedHot(
    "benton",
    page,
    perPage,
  );

  if (isLoading) {
    return (
      <div className="flex min-h-50 items-center justify-center text-sm text-gray-500">
        Loading unassigned hot leads…
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
    <UnassignedHotTable
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
      title="Unassigned Hot Leads - Benton"
      variant="benton"
    />
  );
}
