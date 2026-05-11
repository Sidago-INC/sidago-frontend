

import React from "react";
import { UnassignedHotTable } from "./UnassignedHotTable";
import { useUnassignedHot } from "../_lib/use-unassigned-hot";

export function UnassignedHot95rm() {
  const { data } = useUnassignedHot("95rm");
  return (
    <UnassignedHotTable
      data={data ?? []}
      title="Unassigned Hot Leads - 95RM"
      variant="95rm"
    />
  );
}
