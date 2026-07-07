import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DateRangePicker } from "@/components/ui";
import { useAdminTodayAgentCards } from "@/features/admin-dashboard/_lib/hooks";
import { useAgentCallReport, useAgentCallDetails } from "@/features/agent-dashboard/_lib/hooks";
import { Panel } from "@/features/agent-dashboard/_components/Panel";

const PAGE_LIMIT = 50;

const RESULT_CODE_COLORS: Record<string, string> = {
  Interested:
    "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200",
  "Not Interested":
    "bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300",
  "No Answer":
    "bg-sky-50 border-sky-200 text-sky-800 dark:bg-sky-950/40 dark:border-sky-800 dark:text-sky-200",
  "Left Voicemail":
    "bg-violet-50 border-violet-200 text-violet-800 dark:bg-violet-950/40 dark:border-violet-800 dark:text-violet-200",
  "Left Message":
    "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-200",
  "Call Lead Back":
    "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200",
  "Interested Again":
    "bg-cyan-50 border-cyan-200 text-cyan-800 dark:bg-cyan-950/40 dark:border-cyan-800 dark:text-cyan-200",
  DNC: "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-800 dark:text-red-200",
  "Bad Number":
    "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200",
};
const DEFAULT_COLOR =
  "bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300";

function localDate(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function rangeToParams(range: DateRange | undefined): { startDate: string; endDate: string } {
  const today = new Date();
  const from = range?.from ?? today;
  const to = range?.to ?? from;
  return { startDate: localDate(from), endDate: localDate(to) };
}

function formatDateTime(ts: string): string {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

export function AgentCallInspector() {
  const today = new Date();
  const { data: agentData } = useAdminTodayAgentCards(today);
  const agents = agentData?.cards ?? [];

  const [selectedSlug, setSelectedSlug] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: today,
    to: today,
  });
  const [page, setPage] = useState(1);

  const { startDate, endDate } = rangeToParams(dateRange);
  const isAgentSelected = selectedSlug !== "";

  const selectedAgent = agents.find((a) => a.id === selectedSlug);
  const agentLabel = selectedAgent
    ? `${selectedAgent.name} ${selectedAgent.surname}`
    : "";
  const rangeLabel =
    startDate === endDate ? startDate : `${startDate} to ${endDate}`;

  const { data: reportData, isLoading: reportLoading } = useAgentCallReport(
    isAgentSelected ? selectedSlug : null,
    startDate,
    endDate,
  );

  const { data: detailsData, isLoading: detailsLoading } = useAgentCallDetails(
    isAgentSelected ? selectedSlug : null,
    startDate,
    endDate,
    page,
    PAGE_LIMIT,
  );

  const byResult = reportData?.byResult ?? {};
  const totalCalls = reportData?.totalCalls ?? 0;
  const entries = Object.entries(byResult).sort((a, b) => b[1] - a[1]);
  const rows = detailsData?.data ?? [];
  const totalPages = detailsData?.meta?.totalPages ?? 1;

  const handleRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setPage(1);
  };

  const handleAgentChange = (slug: string) => {
    setSelectedSlug(slug);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            Agent
          </p>
          <select
            value={selectedSlug}
            onChange={(e) => handleAgentChange(e.target.value)}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 transition focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="">Select an agent…</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} {a.surname} — {a.brand}
              </option>
            ))}
          </select>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            Date range
          </p>
          <div className="w-72">
            <DateRangePicker
              value={dateRange}
              onChange={handleRangeChange}
              placeholder="Select date range"
            />
          </div>
        </div>
      </div>

      {isAgentSelected ? (
        <>
          <Panel
            title="Call Report"
            subtitle={`${agentLabel} — calls by outcome — ${rangeLabel}`}
          >
            <div className="p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Total calls:
                </span>
                <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {reportLoading ? "—" : totalCalls}
                </span>
              </div>
              {reportLoading ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-20 animate-pulse rounded-xl border bg-slate-100 dark:bg-slate-800"
                    />
                  ))}
                </div>
              ) : entries.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  No calls logged for this date range.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {entries.map(([code, count]) => (
                    <div
                      key={code}
                      className={`rounded-xl border px-4 py-3 ${RESULT_CODE_COLORS[code] ?? DEFAULT_COLOR}`}
                    >
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="mt-1 text-xs font-medium">{code}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Panel>

          <Panel
            title="Call Details"
            subtitle={`${agentLabel} — individual call records — ${rangeLabel}`}
          >
            <div className="overflow-x-auto">
              {detailsLoading ? (
                <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  Loading…
                </div>
              ) : rows.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  No calls logged for this date range.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50">
                    <tr>
                      {[
                        "Date / Time",
                        "Lead",
                        "Company",
                        "Outcome",
                        "Lead Type",
                        "Duration",
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
                        key={row.callLogId}
                        className="hover:bg-slate-50 dark:hover:bg-slate-900/30"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                          {formatDateTime(row.calledAt)}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                          {row.fullName ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {row.companyName ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {row.resultCode ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {row.leadType ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">
                          {formatDuration(row.durationSeconds)}
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
        </>
      ) : (
        <div className="flex h-28 items-center justify-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Select an agent above to view their call report and call details
          </p>
        </div>
      )}
    </div>
  );
}
