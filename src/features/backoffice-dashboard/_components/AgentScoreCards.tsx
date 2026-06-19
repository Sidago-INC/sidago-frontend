
import { CompanySymbolBadge, StatusCard } from "@/components/ui";
import { WinnerBadge } from "@/features/agent-dashboard/_components/WinnerBadge";
import clsx from "clsx";
import type { MonthlyAgentCard } from "@/features/admin-dashboard/_lib/hooks";

const CARD_TONES = [
  "bg-indigo-50 dark:bg-indigo-950/30",
  "bg-emerald-50 dark:bg-emerald-950/30",
  "bg-amber-50 dark:bg-amber-950/30",
  "bg-rose-50 dark:bg-rose-950/30",
];

export function AgentScoreCards({
  cards,
  isLoading = false,
}: {
  cards: MonthlyAgentCard[];
  isLoading?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2 xxl:grid-cols-3">
      {cards.map((agent, index) => {
        const tone = CARD_TONES[index % CARD_TONES.length];

        return (
          <StatusCard
            key={agent.id}
            className="border-slate-200 dark:border-slate-800 dark:bg-slate-900"
            header={
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white dark:bg-slate-100 dark:text-slate-900">
                  {agent.name.slice(0, 1)}
                  {agent.surname.slice(0, 1) || agent.name.slice(1, 2)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold text-slate-900 dark:text-slate-100">
                    {agent.name} {agent.surname}
                  </p>
                  <div className="pt-1">
                    <CompanySymbolBadge symbol={agent.brand} index={index} />
                  </div>
                </div>
              </div>
            }
            aside={agent.isWinner ? <WinnerBadge /> : undefined}
            metrics={[
              {
                id: "monthly-points",
                label: "Monthly Points",
                value: isLoading ? "—" : agent.monthlyPoints,
                className: clsx("rounded-xl px-4 py-3", tone),
                valueClassName:
                  "text-xl font-bold text-slate-900 dark:text-slate-100",
              },
              {
                id: "last-month-points",
                label: "Last Month",
                value: isLoading ? "—" : agent.lastMonthPoints,
                className: clsx("rounded-xl px-4 py-3", tone),
                valueClassName:
                  "text-xl font-bold text-slate-900 dark:text-slate-100",
              },
              {
                id: "all-points",
                label: "All Points",
                value: isLoading ? "—" : agent.allPoints,
                className: clsx("rounded-xl px-4 py-3", tone),
                valueClassName:
                  "text-xl font-bold text-slate-900 dark:text-slate-100",
              },
              {
                id: "wins",
                label: "Wins",
                value: isLoading ? "—" : agent.wins,
                className: clsx("rounded-xl px-4 py-3", tone),
                valueClassName:
                  "text-xl font-bold text-slate-900 dark:text-slate-100",
              },
            ]}
            metricsClassName="grid grid-cols-2 gap-3"
          />
        );
      })}
    </div>
  );
}
