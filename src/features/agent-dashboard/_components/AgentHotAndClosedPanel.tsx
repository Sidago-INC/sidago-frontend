import { useState } from "react";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { Panel } from "./Panel";
import { useAgentHotAndClosed } from "../_lib/hooks";

const PAGE_LIMIT = 50;

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AgentHotAndClosedPanel({
  agentSlug,
}: {
  agentSlug: string | null;
}) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAgentHotAndClosed(agentSlug, page, PAGE_LIMIT);

  const rows = data?.data ?? [];
  const counts = data?.counts;
  const totalPages = data?.meta?.totalPages ?? 1;

  return (
    <Panel title="Hot & Closed Leads" subtitle="Leads currently assigned to you">
      <div className="flex gap-5 border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-5">
        <div className="flex items-center gap-1.5">
          <Flame className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {isLoading ? "—" : (counts?.hot ?? 0)} Hot
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {isLoading ? "—" : (counts?.contractClosed ?? 0)} Contract Closed
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Loading…
          </div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No hot or closed leads assigned to you.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50">
              <tr>
                {[
                  "Lead",
                  "Company",
                  "Status",
                  "Timezone",
                  "Became Hot",
                  "Last Called",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((row) => (
                <tr
                  key={row.leadId}
                  className="hover:bg-slate-50 dark:hover:bg-slate-900/30"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {row.fullName ?? "—"}
                    </p>
                    {row.phone && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {row.phone}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {row.companyName ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        row.leadType === "Hot"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                      }`}
                    >
                      {row.leadType ?? "—"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">
                    {row.timezone ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">
                    {formatDate(row.dateBecameHot)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">
                    {formatDate(row.lastCalledDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 dark:border-slate-700">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="cursor-pointer rounded border border-slate-200 p-1 text-slate-500 hover:bg-slate-50 disabled:cursor-default disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="cursor-pointer rounded border border-slate-200 p-1 text-slate-500 hover:bg-slate-50 disabled:cursor-default disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </Panel>
  );
}
