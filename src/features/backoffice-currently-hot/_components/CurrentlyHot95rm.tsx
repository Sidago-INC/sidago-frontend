

import React from "react";
import { useCurrentlyHot } from "../_lib/use-currently-hot";
import { CurrentlyHotTable } from "./CurrentlyHotTable";

export function CurrentlyHot95rm() {
  const { data, isLoading, isError, error } = useCurrentlyHot("95rm");

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
      data={data ?? []}
      title="Currently Hot Leads - 95RM"
      variant="95rm"
    />
  );
}
