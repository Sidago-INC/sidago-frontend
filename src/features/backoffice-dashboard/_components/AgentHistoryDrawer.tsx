
import { Drawer } from "@/components/ui";
import {
  useAgentMonthlyHistory,
  type MonthlyAgentCard,
} from "@/features/admin-dashboard/_lib/hooks";
import { Trophy } from "lucide-react";

function formatYearMonth(ym: string): string {
  const parts = ym.split("-");
  const year = Number(parts[0]);
  const monthIndex = Number(parts[1]) - 1;
  const date = new Date(year, monthIndex, 1);
  if (Number.isNaN(date.getTime())) return ym;
  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
}

function HistoryRow({ label, value }: { label: string; value: number }) {
  return (
    <>
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-right text-xs font-semibold text-slate-900 dark:text-slate-100">
        {value}
      </span>
    </>
  );
}

export function AgentHistoryDrawer({
  agent,
  onClose,
}: {
  agent: MonthlyAgentCard | null;
  onClose: () => void;
}) {
  const { data, isLoading } = useAgentMonthlyHistory(agent?.id ?? null);
  const history = data?.history ?? [];
  const mostRecentIsWinner = history.length > 0 && history[0]?.isWinner;

  return (
    <Drawer
      isOpen={Boolean(agent)}
      onClose={onClose}
      direction="right"
      size="480px"
      header={
        agent ? (
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-slate-900 dark:text-slate-100">
              {agent.name} {agent.surname}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {agent.brand}
            </p>
          </div>
        ) : null
      }
    >
      {agent && (
        <div className="space-y-5 p-4 sm:p-5">
          {mostRecentIsWinner && history[0] && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-3 dark:bg-amber-950/30">
              <Trophy className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                {formatYearMonth(history[0].yearMonth)} Leader
              </span>
            </div>
          )}

          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              History Record
            </p>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-32 animate-pulse rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
                  />
                ))}
              </div>
            ) : history.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No history available.
              </p>
            ) : (
              <div className="space-y-3">
                {history.map((month) => (
                  <div
                    key={month.yearMonth}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {formatYearMonth(month.yearMonth)}
                      </p>
                      {month.isWinner && (
                        <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                          <Trophy className="h-3 w-3" />
                          Leader
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-y-2">
                      <HistoryRow label="Monthly Points" value={month.points} />
                      <HistoryRow label="Monthly Calls" value={month.callsMade} />
                      <HistoryRow label="Hot Leads" value={month.hotLeads} />
                      <HistoryRow label="Lost Hot Leads" value={month.lostHotLeads} />
                      <HistoryRow
                        label="Contracts Closed"
                        value={month.contractsClosed}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}
