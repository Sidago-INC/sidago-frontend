
import React from "react";
import { useEverBeenHot } from "../_lib/use-ever-been-hot";
import { EverBeenHotTable } from "./EverBeenHotTable";

export function EverBeenHotSvg() {
  const { data, isLoading, isError, error } = useEverBeenHot("svg");

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
      data={data ?? []}
      title="Ever Been Hot - SVG"
      variant="svg"
    />
  );
}
