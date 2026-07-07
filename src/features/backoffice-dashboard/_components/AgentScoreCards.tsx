
import { CompanySymbolBadge } from "@/components/ui";
import { WinnerBadge } from "@/features/agent-dashboard/_components/WinnerBadge";
import type { MonthlyAgentCard } from "@/features/admin-dashboard/_lib/hooks";
import clsx from "clsx";

const CARD_TONES = [
  "bg-indigo-50 dark:bg-indigo-950/30",
  "bg-emerald-50 dark:bg-emerald-950/30",
  "bg-amber-50 dark:bg-amber-950/30",
  "bg-rose-50 dark:bg-rose-950/30",
];

function StatBox({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: string;
}) {
  return (
    <div className={clsx("rounded-xl px-3 py-2.5", tone)}>
      <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
        {value}
      </p>
      <p className="mt-0.5 text-[10px] font-medium leading-tight text-slate-500 dark:text-slate-400">
        {label}
      </p>
    </div>
  );
}

export function AgentScoreCards({
  cards,
  isLoading = false,
  onCardClick,
}: {
  cards: MonthlyAgentCard[];
  isLoading?: boolean;
  onCardClick?: (card: MonthlyAgentCard) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2 xxl:grid-cols-3">
      {cards.map((agent, index) => {
        const tone = CARD_TONES[index % CARD_TONES.length];

        return (
          <div
            key={agent.id}
            role={onCardClick ? "button" : undefined}
            tabIndex={onCardClick ? 0 : undefined}
            onClick={() => onCardClick?.(agent)}
            onKeyDown={(e) => {
              if (onCardClick && (e.key === "Enter" || e.key === " ")) {
                onCardClick(agent);
              }
            }}
            className={clsx(
              "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900",
              onCardClick &&
                "cursor-pointer transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500",
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white dark:bg-slate-100 dark:text-slate-900">
                  {agent.name.slice(0, 1)}
                  {agent.surname.slice(0, 1) || agent.name.slice(1, 2)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-slate-900 dark:text-slate-100">
                    {agent.name} {agent.surname}
                  </p>
                  <div className="pt-0.5">
                    <CompanySymbolBadge symbol={agent.brand} index={index} />
                  </div>
                </div>
              </div>
              {agent.isWinner && <WinnerBadge />}
            </div>

            {/* 6-stat grid matching Airtable: Monthly Calls, New Hot Leads, Lost Hot Leads,
                Contract Closed, Monthly Points, Last Month Points */}
            <div className="grid grid-cols-3 gap-2 p-3 pt-0">
              <StatBox
                label="Monthly Calls"
                value={isLoading ? "—" : agent.monthlyCalls}
                tone={tone}
              />
              <StatBox
                label="New Hot Leads"
                value={isLoading ? "—" : agent.hotLeads}
                tone={tone}
              />
              <StatBox
                label="Lost Hot Leads"
                value={isLoading ? "—" : agent.lostHotLeads}
                tone={tone}
              />
              <StatBox
                label="Contract Closed"
                value={isLoading ? "—" : agent.contractsClosed}
                tone={tone}
              />
              <StatBox
                label="Monthly Points"
                value={isLoading ? "—" : agent.monthlyPoints}
                tone={tone}
              />
              <StatBox
                label="Last Month Pts"
                value={isLoading ? "—" : agent.lastMonthPoints}
                tone={tone}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
