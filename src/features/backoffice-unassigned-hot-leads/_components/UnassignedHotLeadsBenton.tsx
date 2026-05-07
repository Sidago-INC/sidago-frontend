
import React from "react";
import { useUnassignedHot } from "../_lib/use-unassigned-hot";
import { UnassignedHotLeadsTable } from "./UnassignedHotLeadsTable";

export function UnassignedHotLeadsBenton() {
  const { data, isLoading, isError, error } = useUnassignedHot("benton");

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-sm text-gray-500">
        Loading unassigned hot leads…
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
    <UnassignedHotLeadsTable
      data={data ?? []}
      title="Unassigned Hot Leads - Benton"
      variant="benton"
    />
  );
}
