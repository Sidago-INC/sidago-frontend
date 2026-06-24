

import React from "react";
import { useRecentInterest } from "../_lib/use-recent-interest";
import { RecentInterestTable } from "./RecentInterestTable";

export function RecentInterest95rm() {
  const { data, isLoading, isError, error } = useRecentInterest("95rm");

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
    <RecentInterestTable data={data ?? []} title="Recent Interest - 95RM" brand="95rm" />
  );
}
