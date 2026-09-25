import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { DateRange } from "react-day-picker";
import {
  ArrowLeft,
  CalendarRange,
  ChevronRight,
  Flame,
  FileCheck2,
  Phone,
  TrendingDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";
import {
  Button,
  DateRangePicker,
  Drawer,
  EmptyState,
  ErrorState,
} from "@/components/ui";
import { useAuth } from "@/providers/AuthProvider";
import { useAgentMonthlyHistory } from "@/features/admin-dashboard/_lib/hooks";
import { easternTodayDate, toDateParam } from "@/lib/est";
import { useAgentRangeSummary } from "../_lib/hooks";
import { AgentCallList } from "./AgentCallList";
import { WinnerBadge } from "./WinnerBadge";

type HistoryMonth = {
  yearMonth: string; // 'YYYY-MM-01'
  points: number;
  callsMade: number;
  hotLeads: number;
  lostHotLeads: number;
  contractsClosed: number;
  isWinner: boolean;
};

function formatYearMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const date = new Date(y, m - 1, 1);
  return Number.isNaN(date.getTime())
    ? ym
    : date.toLocaleString("en-US", { month: "long", year: "numeric" });
}

// 'YYYY-MM-01' → first/last day params, with the end capped at today so the
// current month doesn't ask for calls in the future.
function monthBounds(ym: string): { startDate: string; endDate: string } {
  const [y, m] = ym.split("-").map(Number);
  const last = toDateParam(new Date(y, m, 0));
  const today = toDateParam(easternTodayDate());
  return { startDate: ym, endDate: last < today ? last : today };
}

function formatRange(from: Date, to: Date): string {
  const sameYear = from.getFullYear() === to.getFullYear();
  const fromLabel = from.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
  const toLabel = to.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return from.getTime() === to.getTime() ? toLabel : `${fromLabel} – ${toLabel}`;
}

function daysBetween(from: Date, to: Date): number {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / 86_400_000) + 1;
}

/**
 * Monthly Stats for an agent.
 *
 * Unfiltered: one card per month of their own history (GET
 * /dashboard/agent-monthly-history, newest first). Clicking a card opens a
 * drawer with every call from that month.
 *
 * Date-filtered: month rows can't be split by day, so the cards give way to a
 * single summary for exactly the chosen dates (GET /dashboard/agent-range-summary,
 * summed from daily snapshots) alongside the calls in that range.
 *
 * Every endpoint here is restricted server-side to the caller's own slug.
 */
export function AgentMonthlyStatsView() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const slug = user?.slug ?? null;
  const { data, isLoading, isError, error, refetch } = useAgentMonthlyHistory(slug);
  const history: HistoryMonth[] = useMemo(() => data?.history ?? [], [data]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [openMonth, setOpenMonth] = useState<HistoryMonth | null>(null);

  const rangeFrom = dateRange?.from;
  const rangeTo = dateRange?.to ?? dateRange?.from;
  const wins = history.filter((m) => m.isWinner).length;
  const latestYearMonth = history[0]?.yearMonth;

  return (
    <main className="min-h-full p-6 md:p-8">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              My Monthly Stats
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {rangeFrom && rangeTo
                ? `Totals and calls for ${formatRange(rangeFrom, rangeTo)}`
                : history.length > 0
                  ? `${history.length} month${history.length === 1 ? "" : "s"} of history` +
                    (wins > 0 ? ` · ${wins} win${wins === 1 ? "" : "s"}` : "") +
                    " · select a month to see its calls"
                  : "Your points and calls, month by month"}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="w-full sm:w-64">
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                placeholder="Filter by date range"
              />
            </div>
            <Button
              onClick={() => navigate("/dashboard")}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded bg-indigo-600 px-5 py-1 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Button>
          </div>
        </div>

        {!slug ? (
          <EmptyState
            title="No agent profile"
            message="Your account isn't linked to an agent profile, so there are no monthly stats to show."
          />
        ) : rangeFrom && rangeTo ? (
          <RangeView slug={slug} from={rangeFrom} to={rangeTo} />
        ) : isError ? (
          <ErrorState
            error={error}
            title="Couldn't load your monthly stats"
            onRetry={() => {
              void refetch();
            }}
          />
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60"
              />
            ))}
          </div>
        ) : history.length === 0 ? (
          <EmptyState
            title="No stats yet"
            message="Your monthly stats will appear here once you start logging calls."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {history.map((month) => (
              <MonthCard
                key={month.yearMonth}
                month={month}
                isLatest={month.yearMonth === latestYearMonth}
                onOpen={() => setOpenMonth(month)}
              />
            ))}
          </div>
        )}
      </div>

      <MonthCallsDrawer slug={slug} month={openMonth} onClose={() => setOpenMonth(null)} />
    </main>
  );
}

// ── One month (clickable) ─────────────────────────────────────────────────
function MonthCard({
  month,
  isLatest,
  onOpen,
}: {
  month: HistoryMonth;
  isLatest: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`View calls for ${formatYearMonth(month.yearMonth)}`}
      className={clsx(
        "group flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:bg-slate-900 dark:focus-visible:ring-offset-slate-950",
        month.isWinner
          ? "border-amber-300 ring-1 ring-amber-200 dark:border-amber-500/50 dark:ring-amber-500/20"
          : "border-slate-200 hover:border-indigo-200 dark:border-slate-800 dark:hover:border-indigo-800",
      )}
    >
      {/* Fixed-height header so every card's stats line up across a row. */}
      <div className="flex min-h-13 w-full items-center justify-between gap-2 px-4 pt-4 pb-3">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-base font-bold text-slate-900 dark:text-slate-100">
            {formatYearMonth(month.yearMonth)}
          </p>
          {isLatest ? (
            <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
              Latest
            </span>
          ) : null}
        </div>
        {month.isWinner ? <WinnerBadge compact /> : null}
      </div>

      <div className="w-full px-4">
        <div className="rounded-xl bg-indigo-50 px-4 py-3 dark:bg-indigo-950/30">
          <p className="text-3xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
            {month.points}
          </p>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Monthly Points
          </p>
        </div>
      </div>

      <div className="grid w-full grid-cols-2 gap-2 p-4">
        <Stat icon={Phone} label="Calls Made" value={month.callsMade} tone="text-sky-600 dark:text-sky-400" />
        <Stat icon={Flame} label="Hot Leads" value={month.hotLeads} tone="text-amber-600 dark:text-amber-400" />
        <Stat icon={TrendingDown} label="Lost Hot Leads" value={month.lostHotLeads} tone="text-rose-600 dark:text-rose-400" />
        <Stat icon={FileCheck2} label="Contracts Closed" value={month.contractsClosed} tone="text-emerald-600 dark:text-emerald-400" />
      </div>

      <div className="mt-auto flex w-full items-center justify-between border-t border-slate-100 px-4 py-2.5 text-xs font-semibold text-indigo-600 dark:border-slate-800 dark:text-indigo-400">
        <span>View calls</span>
        <ChevronRight
          className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </div>
    </button>
  );
}

// ── Drawer: one month's calls ─────────────────────────────────────────────
function MonthCallsDrawer({
  slug,
  month,
  onClose,
}: {
  slug: string | null;
  month: HistoryMonth | null;
  onClose: () => void;
}) {
  const bounds = month ? monthBounds(month.yearMonth) : null;

  return (
    <Drawer
      isOpen={Boolean(month)}
      onClose={onClose}
      direction="right"
      size="520px"
      header={
        month ? (
          <div className="flex min-w-0 items-center gap-2">
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-slate-900 dark:text-slate-100">
                {formatYearMonth(month.yearMonth)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Call details</p>
            </div>
            {month.isWinner ? <WinnerBadge compact /> : null}
          </div>
        ) : null
      }
    >
      {month && bounds ? (
        <div className="space-y-5 p-4 sm:p-5">
          <div className="grid grid-cols-5 divide-x divide-slate-200 rounded-xl border border-slate-200 bg-slate-50 dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900/50">
            <MiniStat label="Points" value={month.points} emphasis />
            <MiniStat label="Calls" value={month.callsMade} />
            <MiniStat label="Hot" value={month.hotLeads} />
            <MiniStat label="Lost" value={month.lostHotLeads} />
            <MiniStat label="Contracts" value={month.contractsClosed} />
          </div>
          <AgentCallList
            key={`${bounds.startDate}:${bounds.endDate}`}
            agentSlug={slug}
            startDate={bounds.startDate}
            endDate={bounds.endDate}
          />
        </div>
      ) : null}
    </Drawer>
  );
}

// ── Filtered view: exact-range summary + calls ────────────────────────────
function RangeView({ slug, from, to }: { slug: string; from: Date; to: Date }) {
  const startDate = toDateParam(from);
  const endDate = toDateParam(to);
  const { data, isLoading, isError, error, refetch } = useAgentRangeSummary(
    slug,
    startDate,
    endDate,
  );
  const totals = data?.totals;
  const dayCount = daysBetween(from, to);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:sticky lg:top-6 lg:self-start">
        {isError ? (
          <ErrorState
            error={error}
            title="Couldn't load totals"
            onRetry={() => {
              void refetch();
            }}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="bg-linear-to-br from-indigo-600 to-violet-600 px-5 py-5 text-white">
              <div className="flex items-center gap-2 text-indigo-100">
                <CalendarRange className="h-4 w-4" aria-hidden="true" />
                <p className="text-xs font-semibold uppercase tracking-wider">
                  {dayCount} day{dayCount === 1 ? "" : "s"}
                </p>
              </div>
              <p className="mt-1 text-lg font-bold">{formatRange(from, to)}</p>
              <div className="mt-4">
                {isLoading || !totals ? (
                  <div className="h-10 w-24 animate-pulse rounded-lg bg-white/20" />
                ) : (
                  <p className="text-4xl font-bold tabular-nums">{totals.points}</p>
                )}
                <p className="text-xs font-medium text-indigo-100">Points in range</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 p-4">
              <Stat icon={Phone} label="Calls Made" value={totals?.callsMade} tone="text-sky-600 dark:text-sky-400" />
              <Stat icon={Flame} label="Hot Leads" value={totals?.hotLeads} tone="text-amber-600 dark:text-amber-400" />
              <Stat icon={TrendingDown} label="Lost Hot Leads" value={totals?.lostHotLeads} tone="text-rose-600 dark:text-rose-400" />
              <Stat icon={FileCheck2} label="Contracts Closed" value={totals?.contractsClosed} tone="text-emerald-600 dark:text-emerald-400" />
            </div>

            {totals ? (
              <p className="border-t border-slate-100 px-4 py-2.5 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
                {totals.daysWithScores === 0
                  ? "No daily scores recorded in this range yet."
                  : `From ${totals.daysWithScores} scored day${totals.daysWithScores === 1 ? "" : "s"} in this range.`}
              </p>
            ) : null}
          </div>
        )}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-1 text-base font-semibold text-slate-900 dark:text-slate-100">
          Calls in this range
        </h2>
        <AgentCallList
          key={`${startDate}:${endDate}`}
          agentSlug={slug}
          startDate={startDate}
          endDate={endDate}
        />
      </section>
    </div>
  );
}

// ── Small pieces ──────────────────────────────────────────────────────────
function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: number | undefined;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 px-3 py-2.5 dark:border-slate-800">
      <div className="flex items-center gap-1.5">
        <Icon className={clsx("h-3.5 w-3.5", tone)} aria-hidden="true" />
        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{label}</p>
      </div>
      {value === undefined ? (
        <div className="mt-1.5 h-6 w-10 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
      ) : (
        <p className="mt-1 text-lg font-bold tabular-nums text-slate-900 dark:text-slate-100">
          {value}
        </p>
      )}
    </div>
  );
}

function MiniStat({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: number;
  emphasis?: boolean;
}) {
  return (
    <div className="px-2 py-2.5 text-center">
      <p
        className={clsx(
          "text-base font-bold tabular-nums",
          emphasis ? "text-indigo-600 dark:text-indigo-400" : "text-slate-900 dark:text-slate-100",
        )}
      >
        {value}
      </p>
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </p>
    </div>
  );
}
