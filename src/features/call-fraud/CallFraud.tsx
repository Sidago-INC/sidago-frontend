import { useEffect, useState } from "react";
import { ExternalLink, ShieldAlert } from "lucide-react";
import { ErrorState, Table } from "@/components/ui";
import type { Column } from "@/components/ui/Table";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { ensureAbsoluteUrl } from "@/lib/url";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { useGridUrlState } from "@/lib/use-grid-url-state";
import { useServerPagination } from "@/lib/use-server-pagination";
import {
  useSuspiciousCalls,
  useResolveFraudFlag,
  type FraudFlagValue,
  type SuspiciousCallRow,
} from "./_lib/data";

function formatDuration(seconds: number | null): string {
  if (seconds === null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function FraudFlagBadge({ flag }: { flag: string }) {
  if (flag === "SUSPICIOUS") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
        <ShieldAlert className="h-3 w-3" /> Suspicious
      </span>
    );
  }
  if (flag === "CLEARED") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
        Cleared
      </span>
    );
  }
  if (flag === "CONFIRMED_FRAUD") {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-300">
        Confirmed Fraud
      </span>
    );
  }
  return <span className="text-slate-400 text-xs">{flag}</span>;
}

function ActionButtons({
  row,
  onResolve,
  loading,
}: {
  row: SuspiciousCallRow;
  onResolve: (id: string, flag: FraudFlagValue) => void;
  loading: boolean;
}) {
  if (row.fraudFlag !== "SUSPICIOUS") {
    return <FraudFlagBadge flag={row.fraudFlag} />;
  }
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={loading}
        onClick={() => onResolve(row.id, "CLEARED")}
        className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
      >
        Clear
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={() => onResolve(row.id, "CONFIRMED_FRAUD")}
        className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
      >
        Confirm Fraud
      </button>
    </div>
  );
}

export function CallFraud() {
  const { page, perPage, setPage, setPerPage } = useServerPagination(DEFAULT_PAGE_SIZE);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const url = useGridUrlState();
  const [searchInput, setSearchInput] = useState(url.search);
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  useEffect(() => {
    url.setSearch(debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url.grid]);

  const { data: result, isLoading, isError, error, refetch } = useSuspiciousCalls(
    page,
    perPage,
    undefined,
    url.grid,
  );
  const data = result?.data ?? [];
  const serverPagination = result?.meta
    ? { meta: result.meta, onPageChange: setPage, onPerPageChange: setPerPage }
    : undefined;

  const resolveMutation = useResolveFraudFlag();

  const handleResolve = async (id: string, fraudFlag: FraudFlagValue) => {
    setResolvingId(id);
    try {
      await resolveMutation.mutateAsync({ id, fraudFlag });
      showSuccessToast(
        fraudFlag === "CLEARED"
          ? "Call marked as cleared."
          : "Call confirmed as fraud.",
      );
    } catch {
      showErrorToast("Failed to update flag. Please try again.");
    } finally {
      setResolvingId(null);
    }
  };

  const columns: Column<SuspiciousCallRow>[] = [
    {
      key: "calledAt",
      title: "Called At",
      type: "date",
      render: (row) => (
        <span className="whitespace-nowrap text-sm">
          {new Date(row.calledAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: "leadName",
      title: "Lead",
      render: (row) => (
        <span className="text-sm font-medium">{row.leadName ?? "—"}</span>
      ),
    },
    {
      key: "agentName",
      title: "Agent",
      render: (row) => (
        <span className="text-sm">{row.agentName ?? "—"}</span>
      ),
    },
    {
      key: "brandCode",
      title: "Brand",
      render: (row) => (
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono dark:bg-slate-800">
          {row.brandCode}
        </span>
      ),
    },
    {
      key: "resultCode",
      title: "Agent Said",
      render: (row) => (
        <span className="text-sm font-medium text-indigo-700 dark:text-indigo-400">
          {row.resultCode ?? "—"}
        </span>
      ),
    },
    {
      key: "mcStatus",
      title: "MC Status",
      render: (row) => (
        <span
          className={
            row.mcStatus === "Connected"
              ? "text-sm text-emerald-700 dark:text-emerald-400"
              : "text-sm text-red-700 dark:text-red-400"
          }
        >
          {row.mcStatus ?? "—"}
        </span>
      ),
    },
    {
      key: "mcDurationSeconds",
      title: "Duration",
      render: (row) => (
        <span className="text-sm tabular-nums">
          {formatDuration(row.mcDurationSeconds)}
        </span>
      ),
    },
    {
      // Not a backend grid field for this endpoint — display only.
      key: "mcRecordingLink",
      title: "Recording",
      filterable: false,
      sortable: false,
      groupable: false,
      render: (row) =>
        row.mcRecordingLink ? (
          <a
            href={ensureAbsoluteUrl(row.mcRecordingLink)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => {
              event.preventDefault();
              window.open(
                ensureAbsoluteUrl(row.mcRecordingLink!),
                "_blank",
                "noopener,noreferrer",
              );
            }}
            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Listen <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
    {
      key: "fraudFlag",
      title: "Action",
      render: (row) => (
        <ActionButtons
          row={row}
          onResolve={handleResolve}
          loading={resolvingId === row.id}
        />
      ),
    },
  ];

  if (isError) {
    return (
      <ErrorState
        title="Failed to load suspicious calls"
        error={error}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="min-h-full bg-slate-50 px-4 py-6 dark:bg-gray-950 sm:px-6">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Call Fraud Review
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Calls where MightyCall reports the call was not answered but the agent
          logged a positive outcome. Review and mark each as cleared or fraud.
        </p>
      </div>

      <Table
        data={data}
        columns={columns}
        isLoading={isLoading}
        rowsPerPage={perPage}
        onRowsPerPageChange={setPerPage}
        serverPagination={serverPagination}
        serverSearch={{
          value: searchInput,
          onChange: setSearchInput,
          placeholder: "Search lead, agent, brand, result, or MC status",
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
        title="Suspicious Calls"
        emptyText="No suspicious calls found."
      />
    </div>
  );
}
