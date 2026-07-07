import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Panel } from "./Panel";
import { useAgentCallDetails } from "../_lib/hooks";

const PAGE_LIMIT = 50;

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

function formatTime(ts: string): string {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function AgentCallDetailsPanel({
  agentSlug,
}: {
  agentSlug: string | null;
}) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });
  const [page, setPage] = useState(1);
  const { startDate, endDate } = rangeToParams(dateRange);
  const { data, isLoading } = useAgentCallDetails(
    agentSlug,
    startDate,
    endDate,
    page,
    PAGE_LIMIT,
  );

  const rows = data?.data ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;

  const handleRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setPage(1);
  };

  return (
    <Panel
      title="Call Details"
      subtitle="Individual call records for the selected date range"
      action={
        <div className="w-64">
          <DateRangePicker
            value={dateRange}
            onChange={handleRangeChange}
            placeholder="Select date range"
          />
        </div>
      }
    >
      <div className="overflow-x-auto">
        {isLoading ? (
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
                {["Time", "Lead", "Company", "Outcome", "Lead Type", "Duration"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((row) => (
                <tr
                  key={row.callLogId}
                  className="hover:bg-slate-50 dark:hover:bg-slate-900/30"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                    {formatTime(row.calledAt)}
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
  );
}
