

import React from "react";
import { UnassignedHotTable } from "./UnassignedHotTable";
import { useUnassignedHot } from "../_lib/use-unassigned-hot";

export function UnassignedHotSvg() {
   const { data } = useUnassignedHot("svg");
  return (
    <UnassignedHotTable
      data={data ?? []}
      title="Unassigned Hot Leads - SVG"
      variant="svg"
    />
  );
}
