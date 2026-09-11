import { CampaignBadge, Confirmation, Table, TypeBadge } from "@/components/ui";
import { type Column } from "@/components/ui/Table";
import { useGridPage } from "@/lib/use-grid-page";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { useAuth } from "@/providers/AuthProvider";
import {
  buildRevertMessage,
  useRevertLevel2Result,
} from "@/features/level-2-shared/revert";
import clsx from "clsx";
import { Undo2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { Level2HistoryRow } from "../_lib/data";
import { useLevel2History } from "../_lib/hooks";

// Rows logged before the server started storing per-brand snapshots have no
// lead type on file. Showing a dash is honest; TypeBadge renders nothing at
// all for an empty value, which reads as a bug.
function LeadTypeCell({ value }: { value: string }) {
  if (!value.trim()) {
    return <span className="text-slate-400 dark:text-slate-500">—</span>;
  }
  return <TypeBadge value={value} kind="lead" />;
}

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

  const { hasRole } = useAuth();
  // Mirrors the backend gate: level2.revert is granted to manager (which the
  // frontend calls backoffice) and admin.
  const canRevert = hasRole(["admin", "backoffice"]);

  const revertResult = useRevertLevel2Result();
  const [pendingRevert, setPendingRevert] = useState<Level2HistoryRow | null>(
    null,
  );

  const { data: result, isLoading } = useLevel2History(page, perPage, url.grid);
  const data = result?.data ?? [];
  const serverPagination = result?.meta
    ? {
        meta: result.meta,
        onPageChange: setPage,
        onPerPageChange: setPerPage,
      }
    : undefined;

  const handleConfirmRevert = async () => {
    if (!pendingRevert) return;
    try {
      const response = await revertResult.mutateAsync(pendingRevert.id);
      showSuccessToast(buildRevertMessage(response));
      setPendingRevert(null);
    } catch (err) {
      showErrorToast(err);
    }
  };

  const columns = useMemo<Column<Level2HistoryRow>[]>(() => {
    const base: Column<Level2HistoryRow>[] = [
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
        title: "Lead Type SVG",
        key: "lead_type_sidago",
        render: (row) => <LeadTypeCell value={row.lead_type_sidago} />,
      },
      {
        title: "Lead Type Benton",
        key: "lead_type_benton",
        render: (row) => <LeadTypeCell value={row.lead_type_benton} />,
      },
      {
        title: "Lead Type 95rm",
        key: "lead_type_95rm",
        render: (row) => <LeadTypeCell value={row.lead_type_95rm} />,
      },
    ];

    if (!canRevert) return base;

    // Reverting used to be reachable only from the Level 2 Update grid, and
    // only for rows logged in that same browser tab. Everything else was
    // stranded — this is the page where the rows actually live.
    return [
      ...base,
      {
        title: "Revert",
        key: "revert",
        render: (row) => {
          const isPending =
            revertResult.isPending && pendingRevert?.id === row.id;
          return (
            <button
              type="button"
              disabled={isPending}
              onClick={(event) => {
                event.stopPropagation();
                setPendingRevert(row);
              }}
              className={clsx(
                "inline-flex h-8 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition",
                "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
                isPending && "cursor-not-allowed opacity-50",
              )}
              aria-label={`Revert ${row.lead || "Level 2 update"}`}
            >
              <Undo2 size={16} />
              {isPending ? "Reverting..." : "Revert"}
            </button>
          );
        },
      },
    ];
  }, [canRevert, pendingRevert?.id, revertResult.isPending]);

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

      <Confirmation
        open={Boolean(pendingRevert)}
        title="Revert this Level 2 update?"
        description={
          pendingRevert
            ? `${pendingRevert.lead || "This lead"} goes back to how it stood before "${pendingRevert.level_2_result_update}" was logged. Any company leads this update put On Hold are released, and the row leaves this list.`
            : ""
        }
        confirmLabel="Revert"
        loadingLabel="Reverting..."
        loading={revertResult.isPending}
        onConfirm={handleConfirmRevert}
        onCancel={() => setPendingRevert(null)}
      />
    </div>
  );
}
