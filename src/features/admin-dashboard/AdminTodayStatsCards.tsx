

import { CompanySymbolBadge, StatusCard } from "@/components/ui";
import { WinnerBadge } from "@/features/agent-dashboard/_components/WinnerBadge";
import { agentDashboardData } from "@/features/agent-dashboard/_lib/data";
import { backofficeLeaderboardAgents } from "@/features/backoffice-dashboard/_lib/data";
import clsx from "clsx";

const CARD_TONES = [
  "bg-indigo-50 dark:bg-indigo-950/30",
  "bg-emerald-50 dark:bg-emerald-950/30",
  "bg-amber-50 dark:bg-amber-950/30",
  "bg-rose-50 dark:bg-rose-950/30",
];

function getDateSeed(date?: Date) {
  if (!date) {
    return 0;
  }

  return (
    date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate()
  );
}

export function AdminTodayStatsCards({
  selectedDate,
}: {
  selectedDate?: Date;
}) {
  const dateSeed = getDateSeed(selectedDate);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2 xxl:grid-cols-3">
      {agentDashboardData.map((agent, index) => {
        const tone = CARD_TONES[index % CARD_TONES.length];
        const shift = (dateSeed + index) % 4;
        const currentHotLeads =
          (backofficeLeaderboardAgents[index]?.currentHotLeads ?? 0) + shift;
        const callsToday = Math.max(0, agent.today_calls_made - 3 + shift * 2);
        const hotLeadsToday = Math.max(0, agent.hot_leads_today - 1 + shift);

        return (
          <StatusCard
            key={`${agent.recordId}-today`}
            className="border-slate-200 dark:border-slate-800 dark:bg-slate-900"
            header={
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white dark:bg-slate-100 dark:text-slate-900">
                  {agent.name.slice(0, 1)}
                  {agent.surname.slice(0, 1)}
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
            aside={
              agent.winner ? <WinnerBadge label="Today Winner" /> : undefined
            }
            metrics={[
              {
                id: "calls-today",
                label: "Calls Today",
                value: callsToday,
                className: clsx("rounded-xl px-4 py-3", tone),
                valueClassName:
                  "text-xl font-bold text-slate-900 dark:text-slate-100",
              },
              {
                id: "hot-leads-today",
                label: "Hot Leads Today",
                value: hotLeadsToday,
                className: clsx("rounded-xl px-4 py-3", tone),
                valueClassName:
                  "text-xl font-bold text-slate-900 dark:text-slate-100",
              },
              {
                id: "current-hot-leads",
                label: "Current Hot Leads",
                value: currentHotLeads,
                className: clsx("rounded-xl px-4 py-3", tone),
                valueClassName:
                  "text-xl font-bold text-slate-900 dark:text-slate-100",
              },
            ]}
          />
        );
      })}
    </div>
  );
}
