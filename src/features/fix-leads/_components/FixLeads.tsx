import { Wave } from "@/components/ui";
import { useServerPagination } from "@/lib/use-server-pagination";
import { Wrench } from "lucide-react";
import { useFixQueue } from "../_lib/data";
import { FixLeadsTable } from "./FixLeadsTable";

export function FixLeads() {
  const { page, perPage, setPage, setPerPage } = useServerPagination();
  const { data: result, isLoading, isError, error } = useFixQueue(page, perPage);
  const serverPagination = result?.meta
    ? {
        meta: result.meta,
        onPageChange: setPage,
        onPerPageChange: setPerPage,
      }
    : undefined;
  const totalFixLeads = result?.meta.total_count;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 px-4 pt-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Fix Queue
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Leads flagged for fix across all brands
          </p>
        </div>

        <div className="inline-flex items-center gap-3 self-start rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:self-auto">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
            <Wrench className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <div className="min-w-0 leading-tight">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Total Fix Leads
            </p>
            <p className="text-xl font-semibold tabular-nums text-slate-900 dark:text-slate-50">
              {isLoading ? "—" : (totalFixLeads ?? 0)}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Wave />
        </div>
      ) : isError ? (
        <div className="mx-4 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
          Failed to load fix queue:{" "}
          {(error as unknown as { message?: string[] })?.message?.join(", ") ??
            "Unknown error"}
        </div>
      ) : (
        <FixLeadsTable
          data={result?.data ?? []}
          title="Fix Queue"
          serverPagination={serverPagination}
        />
      )}
    </div>
  );
}
