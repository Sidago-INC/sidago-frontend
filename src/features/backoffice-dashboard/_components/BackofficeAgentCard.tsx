import { CompanySymbolBadge, StatusCard } from "@/components/ui";
import clsx from "clsx";
import { BackofficeLeaderboardAgent } from "../_lib/data";

const CARD_TONES = [
  "bg-indigo-50 dark:bg-indigo-950/30",
  "bg-emerald-50 dark:bg-emerald-950/30",
  "bg-amber-50 dark:bg-amber-950/30",
  "bg-rose-50 dark:bg-rose-950/30",
];

interface BackofficeAgentCardProps {
  agent: BackofficeLeaderboardAgent;
  index: number;
}

export function BackofficeAgentCard({
  agent,
  index,
}: BackofficeAgentCardProps) {
  const tone = CARD_TONES[index % CARD_TONES.length];
  return (
    <StatusCard
      className="border-slate-200 dark:border-slate-800 dark:bg-slate-900"
      header={
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white dark:bg-slate-100 dark:text-slate-900">
            {agent.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-slate-900 dark:text-slate-100">
              {agent.name}
            </p>
            <div className="pt-1">
              <CompanySymbolBadge symbol={agent.team} index={index} />
            </div>
          </div>
        </div>
      }
      metrics={[
        {
          id: "calls-today",
          label: "Calls Today",
          value: agent.callsToday,
          className: clsx("rounded-xl px-4 py-3", tone),
          valueClassName:
            "text-xl font-bold text-slate-900 dark:text-slate-100",
        },
        {
          id: "hot-leads-today",
          label: "Hot Leads Today",
          value: agent.hotLeadsToday,
          className: clsx("rounded-xl px-4 py-3", tone),
          valueClassName:
            "text-xl font-bold text-slate-900 dark:text-slate-100",
        },
        {
          id: "current-hot-leads",
          label: "Current Hot Leads",
          value: agent.currentHotLeads,
          className: clsx("rounded-xl px-4 py-3", tone),
          valueClassName:
            "text-xl font-bold text-slate-900 dark:text-slate-100",
        },
      ]}
    />
  );
}
