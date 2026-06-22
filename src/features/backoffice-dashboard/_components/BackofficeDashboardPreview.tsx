

import { Button, CompanySymbolBadge, StatusCard } from "@/components/ui";
import { WinnerBadge } from "@/features/agent-dashboard/_components/WinnerBadge";
import clsx from "clsx";
import { ArrowRight } from "lucide-react";
import {
  flattenTodayWinnerStandings,
  getPrimaryTodayWinner,
  useTodayWinner,
} from "@/features/leads-stats/_lib/hooks";
import { backofficeLeaderboardAgents, todayWinner } from "../_lib/data";
import { BackofficeAgentCard } from "./BackofficeAgentCard";

const WINNER_CARD_TONE = "bg-indigo-50 dark:bg-indigo-950/30";

type BackofficeDashboardPreviewProps = {
  onOpenMonthlyStats: () => void;
};

export function BackofficeDashboardPreview({
  onOpenMonthlyStats,
}: BackofficeDashboardPreviewProps) {
  const { data: winnerData } = useTodayWinner();
  const primaryWinner = getPrimaryTodayWinner(winnerData);
  const apiStandings = flattenTodayWinnerStandings(winnerData);

  const displayWinner = primaryWinner
    ? {
        name: primaryWinner.fullName.split(" ")[0] ?? primaryWinner.fullName,
        team: primaryWinner.brand.toUpperCase(),
        callsToday: primaryWinner.callsMade,
        hotLeadsToday: primaryWinner.hotLeads,
        currentHotLeads: primaryWinner.hotLeads,
      }
    : todayWinner;

  const agentCards =
    apiStandings.length > 0
      ? apiStandings.map((agent) => ({
          id: agent.userId,
          name: agent.fullName.split(" ")[0] ?? agent.fullName,
          team: agent.brand.toUpperCase(),
          callsToday: agent.callsMade,
          hotLeadsToday: agent.hotLeads,
          currentHotLeads: agent.hotLeads,
        }))
      : backofficeLeaderboardAgents;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          onClick={onOpenMonthlyStats}
          className="inline-flex items-center justify-center gap-2 rounded bg-indigo-600 px-5 py-1 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 cursor-pointer"
        >
          Monthly Stats.
          <ArrowRight size={16} />
        </Button>
      </div>

      <StatusCard
        className="border-slate-200 dark:border-slate-800 dark:bg-slate-900"
        header={
          <div className="flex items-center gap-3">
            <div className="min-w-0">
              <p className="truncate text-lg font-bold text-slate-900 dark:text-slate-100">
                Today Winner
              </p>
              <div className="pt-1">
                <CompanySymbolBadge symbol={displayWinner.team} index={0} />
              </div>
            </div>
          </div>
        }
        aside={<WinnerBadge label={displayWinner.name} />}
        metrics={[
          {
            id: "calls-today",
            label: "Calls Today",
            value: displayWinner.callsToday,
            className: clsx("rounded-xl px-4 py-3", WINNER_CARD_TONE),
            valueClassName:
              "text-lg font-bold text-slate-900 dark:text-slate-100",
          },
          {
            id: "hot-leads-today",
            label: "Hot Leads Today",
            value: displayWinner.hotLeadsToday,
            className: clsx("rounded-xl px-4 py-3", WINNER_CARD_TONE),
            valueClassName:
              "text-lg font-bold text-slate-900 dark:text-slate-100",
          },
          {
            id: "current-hot-leads",
            label: "Current Hot Leads",
            value: displayWinner.currentHotLeads,
            className: clsx("rounded-xl px-4 py-3", WINNER_CARD_TONE),
            valueClassName:
              "text-lg font-bold text-slate-900 dark:text-slate-100",
          },
        ]}
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2 xxl:grid-cols-3">
        {agentCards.map((agent, index) => (
          <BackofficeAgentCard key={agent.id} agent={agent} index={index} />
        ))}
      </div>
    </div>
  );
}
