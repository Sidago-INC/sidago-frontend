
import { CampaignBadge, Table, TypeBadge } from "@/components/ui";
import { type Column } from "@/components/ui/Table";
import { useGridPage } from "@/lib/use-grid-page";
import { useEffect, useMemo, useState } from "react";
import type { Level2HistoryRow } from "../_lib/data";
import { useLevel2History } from "../_lib/hooks";

export function Level2History() {
  const {
    page,
    perPage,
    setPage,
    setPerPage,
    url,
    searchInput,
    setSearchInput,
  } = useGridPage();



  const { data: result, isLoading } = useLevel2History(page, perPage, url.grid);
  const data = result?.data ?? [];
  const serverPagination = result?.meta
    ? {
        meta: result.meta,
        onPageChange: setPage,
        onPerPageChange: setPerPage,
      }
    : undefined;

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
        data={data}
        columns={columns}
        isLoading={isLoading}
        serverPagination={serverPagination}
        serverSearch={{
          value: searchInput,
          onChange: setSearchInput,
          placeholder: "Search lead, agent, result, or notes",
        }}
        serverGrid={{
          filters: url.filterItems,
          rootGate: url.rootGate,
          sort: url.sortRules,
          groupBy: url.groupBy,
          onFiltersChange: url.setFilters,
          onSortChange: url.setSort,
          onGroupByChange: url.setGroupBy,
          groupCounts: result?.meta?.groups,
        }}
        title="Level 2 History"
        description="Previously logged Level 2 updates"
      />
    </div>
  );
}
