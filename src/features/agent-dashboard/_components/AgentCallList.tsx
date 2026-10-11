import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, PhoneOff, PlayCircle } from "lucide-react";
import clsx from "clsx";
import { EASTERN_TIME_ZONE, formatEasternTime } from "@/lib/est";
import { useAgentCallDetails, type CallDetailRow } from "../_lib/hooks";

const PAGE_LIMIT = 50;

function formatDuration(seconds: number | null): string | null {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// Eastern calendar day of a call → sortable key + a human label.
function easternDay(ts: string): { key: string; label: string } {
  const date = new Date(ts);
  const key = date.toLocaleDateString("en-CA", { timeZone: EASTERN_TIME_ZONE });
  const label = date.toLocaleDateString("en-US", {
    timeZone: EASTERN_TIME_ZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return { key, label };
}

// Outcome pill colour by result code family; anything unknown stays neutral.
function outcomeTone(code: string | null): string {
  const c = (code ?? "").toLowerCase();
  if (c.includes("hot") || c.includes("interest"))
    return "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800/50";
  if (c.includes("contract") || c.includes("closed"))
    return "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800/50";
  if (c.includes("not interested") || c.includes("dead") || c.includes("wrong"))
    return "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-800/50";
  return "bg-slate-50 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700";
}

/**
 * Every call the agent logged between startDate and endDate (inclusive,
 * Eastern), newest first and grouped by day. Backed by the agent-scoped
 * GET /dashboard/call-details, paged 50 at a time.
 */
export function AgentCallList({
  agentSlug,
  startDate,
  endDate,
}: {
  agentSlug: string | null;
  startDate: string;
  endDate: string;
}) {
  // Callers key this component by range, so a new range remounts on page 1.
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, isPlaceholderData } = useAgentCallDetails(
    agentSlug,
    startDate,
    endDate,
    page,
    PAGE_LIMIT,
  );
  const rows = useMemo(() => data?.data ?? [], [data]);
  const total = data?.meta?.total_count ?? 0;
  const totalPages = data?.meta?.total_pages ?? 1;

  const groups = useMemo(() => {
    const out: Array<{ key: string; label: string; calls: CallDetailRow[] }> = [];
    for (const row of rows) {
      const day = easternDay(row.calledAt);
      const last = out[out.length - 1];
      if (last?.key === day.key) last.calls.push(row);
      else out.push({ ...day, calls: [row] });
    }
    return out;
  }, [rows]);

  if (isLoading) {
    return (
      <div className="space-y-2" aria-busy="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800/60"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
        Couldn&apos;t load calls for these dates.
      </p>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 px-6 py-10 text-center dark:border-slate-700">
        <PhoneOff className="h-6 w-6 text-slate-400" aria-hidden="true" />
        <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">
          No calls logged
        </p>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Nothing was recorded for these dates.
        </p>
      </div>
    );
  }

  return (
    <div className={clsx("transition-opacity", isPlaceholderData && "opacity-60")}>
      <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
        {total} call{total === 1 ? "" : "s"}
        {totalPages > 1 ? ` · page ${page} of ${totalPages}` : ""}
      </p>

      <div className="space-y-5">
        {groups.map((group) => (
          <section key={group.key}>
            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {group.label}
              </h3>
              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              <span className="text-[11px] tabular-nums text-slate-400">
                {group.calls.length}
              </span>
            </div>
            <ul className="space-y-2">
              {group.calls.map((call) => (
                <CallItem key={call.callLogId} call={call} />
              ))}
            </ul>
          </section>
        ))}
      </div>

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Previous page of calls"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="cursor-pointer rounded-lg border border-slate-200 p-1.5 text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-default disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next page of calls"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="cursor-pointer rounded-lg border border-slate-200 p-1.5 text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-default disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CallItem({ call }: { call: CallDetailRow }) {
  const duration = formatDuration(call.mcDurationSeconds ?? call.durationSeconds);
  const notes = call.notes?.trim();

  return (
    <li className="rounded-xl border border-slate-200 bg-white px-3.5 py-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
            {call.fullName ?? "Unknown lead"}
          </p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            {call.companySymbol ? (
              <span className="font-medium text-slate-600 dark:text-slate-300">
                {call.companySymbol}
              </span>
            ) : null}
            {call.companySymbol && call.companyName ? " · " : ""}
            {call.companyName ?? (call.companySymbol ? "" : "—")}
          </p>
        </div>
        <span className="shrink-0 text-xs tabular-nums text-slate-500 dark:text-slate-400">
          {formatEasternTime(call.calledAt)}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span
          className={clsx(
            "rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
            outcomeTone(call.resultCode),
          )}
        >
          {call.resultCode ?? "No outcome"}
        </span>
        {call.leadType ? (
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
            {call.leadType}
          </span>
        ) : null}
        {duration ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {duration}
          </span>
        ) : null}
        {call.mcRecordingLink ? (
          <a
            href={call.mcRecordingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-violet-600 hover:text-violet-500 hover:underline dark:text-violet-400"
          >
            <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Listen
          </a>
        ) : null}
      </div>

      {notes ? (
        <p
          className="mt-2 line-clamp-2 text-xs text-slate-600 dark:text-slate-300"
          title={notes}
        >
          {notes}
        </p>
      ) : null}
    </li>
  );
}
