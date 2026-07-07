
import { useState } from "react";
import { Button } from "@/components/ui";
import { ArrowLeft } from "lucide-react";
import { BarChart } from "@/features/agent-dashboard/_components/BarChart";
import type { Agent } from "@/types";
import {
  useAdminMonthlyAgentCards,
  type MonthlyAgentCard,
} from "@/features/admin-dashboard/_lib/hooks";
import { AgentScoreCards } from "./AgentScoreCards";
import { MonthLeaderCard } from "./MonthLeaderCard";
import { AgentHistoryDrawer } from "./AgentHistoryDrawer";

function formatMonthSubtitle(month: string | undefined) {
  if (!month) {
    return "";
  }

  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  const date = new Date(year, monthIndex, 1);

  if (Number.isNaN(date.getTime())) {
    return month;
  }

  return date.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function BackofficeMonthlyStatsView({
  setView,
}: {
  setView: (view: "preview" | "monthly") => void;
}) {
  const [selectedAgent, setSelectedAgent] = useState<MonthlyAgentCard | null>(null);
  const { data, isLoading } = useAdminMonthlyAgentCards(new Date());
  const cards = data?.cards ?? [];
  const chartAgents: Agent[] = cards.map((card) => ({
    recordId: card.id,
    name: card.name,
    surname: card.surname,
    email: "",
    brand: card.brand,
    hot_leads_today: 0,
    today_calls_made: 0,
    winner: false,
    monthly_calls: card.monthlyCalls,
    monthly_hot_leads: card.hotLeads,
    monthly_lost_hot_leads: card.lostHotLeads,
    monthly_contract_closed: card.contractsClosed,
    monthly_points: card.monthlyPoints,
    last_month_calls: card.lastMonthPoints,
    last_month_hot_lead: 0,
    last_month_contract_closed: 0,
    last_month_winner: false,
    last_month_points: card.lastMonthPoints,
    monthly_winner: card.isWinner,
    last_month_lost_lead: 0,
    count_wins: card.wins,
    all_points: card.allPoints,
  }));
  const currentMonthLeader = [...cards].sort(
    (a, b) => b.monthlyPoints - a.monthlyPoints,
  )[0];
  const lastMonthLeader = [...cards].sort(
    (a, b) => b.lastMonthPoints - a.lastMonthPoints,
  )[0];
  const monthSubtitle = formatMonthSubtitle(data?.reportMonth);

  return (
    <>
      <div className="flex justify-end">
        <Button
          onClick={() => setView("preview")}
          className="inline-flex items-center justify-center gap-2 rounded bg-indigo-600 px-5 py-1 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 cursor-pointer"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Button>
      </div>
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <MonthLeaderCard
            title="Current Month Leader"
            name={currentMonthLeader?.name ?? "—"}
            value={isLoading ? 0 : currentMonthLeader?.monthlyPoints ?? 0}
          />
          <MonthLeaderCard
            title="Last Month Leader"
            name={lastMonthLeader?.name ?? "—"}
            value={isLoading ? 0 : lastMonthLeader?.lastMonthPoints ?? 0}
          />
        </div>

        <AgentScoreCards
          cards={cards}
          isLoading={isLoading}
          onCardClick={setSelectedAgent}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BarChart
            agents={chartAgents}
            getValue={(agent) => agent.monthly_points}
            title="Monthly Points"
            subtitle={monthSubtitle}
          />
          <BarChart
            agents={chartAgents}
            getValue={(agent) => agent.count_wins}
            title="Historical Wins"
            subtitle=""
          />
        </div>
      </div>

      <AgentHistoryDrawer
        agent={selectedAgent}
        onClose={() => setSelectedAgent(null)}
      />
    </>
  );
}
