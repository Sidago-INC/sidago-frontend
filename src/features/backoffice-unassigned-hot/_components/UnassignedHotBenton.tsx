

import React from "react";
import { UnassignedHotTable } from "./UnassignedHotTable";
import { useUnassignedHot } from "../_lib/use-unassigned-hot";

export function UnassignedHotBenton() {
  const { data } = useUnassignedHot("benton");
  return (
    <UnassignedHotTable
      data={data ?? []}
      title="Unassigned Hot Leads - Benton"
      variant="benton"
    />
  );
}
