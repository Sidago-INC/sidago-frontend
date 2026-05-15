

import { CampaignBadge, Table, TypeBadge } from "@/components/ui";
import { type Column } from "@/components/ui/Table";
import { useMemo } from "react";
import type { Level2HistoryRow } from "../_lib/data";
import { useLevel2History } from "../_lib/hooks";

export function Level2History() {
  const { data, isLoading } = useLevel2History();

  const columns = useMemo<Column<Level2HistoryRow>[]>(
    () => [
      { title: "Lead", key: "lead" },
      {
        title: "Campaign",
        key: "campaign",
        render: (row) => <CampaignBadge value={row.campaign} />,
      },
      { title: "level 2 Agent", key: "level_2_agent" },
      { title: "Level 2 Result Update", key: "level_2_result_update" },
      { title: "Updated Notes", key: "updated_notes" },
      { title: "Call Back Date", key: "call_back_date", type: "date" },
      { title: "Created Date", key: "created_date", type: "date" },
      {
        title: "Lead Type Sidago",
        key: "lead_type_sidago",
        render: (row) => <TypeBadge value={row.lead_type_sidago} kind="lead" />,
      },
      {
        title: "Lead Type Benton",
        key: "lead_type_benton",
        render: (row) => <TypeBadge value={row.lead_type_benton} kind="lead" />,
      },
      {
        title: "Lead Type 95rm",
        key: "lead_type_95rm",
        render: (row) => <TypeBadge value={row.lead_type_95rm} kind="lead" />,
      },
    ],
    [],
  );

  return (
    <div className="min-h-full">
      <Table
        data={data ?? []}
        columns={columns}
        isLoading={isLoading}
        title="Level 2 History"
        description="Review historical Level 2 updates and lead type changes"
      />
    </div>
  );
}
