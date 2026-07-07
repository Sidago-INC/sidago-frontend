import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui";
import { Panel } from "./Panel";
import { useAgentCallReport } from "../_lib/hooks";

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

export function AgentCallReportPanel({
  agentSlug,
}: {
  agentSlug: string | null;
}) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });
  const { startDate, endDate } = rangeToParams(dateRange);
  const { data, isLoading } = useAgentCallReport(agentSlug, startDate, endDate);

  const byResult = data?.byResult ?? {};
  const totalCalls = data?.totalCalls ?? 0;
  const entries = Object.entries(byResult).sort((a, b) => b[1] - a[1]);

  return (
    <Panel
      title="Call Report"
      subtitle="Your calls by outcome for the selected date range"
      action={
        <div className="w-64">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            placeholder="Select date range"
          />
        </div>
      }
    >
      <div className="p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Total calls:
          </span>
          <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {isLoading ? "—" : totalCalls}
          </span>
        </div>

        {isLoading ? (
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
  );
}
