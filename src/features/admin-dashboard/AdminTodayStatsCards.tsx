
import { useAdminTodayAgentCards } from "./_lib/hooks";
import {
  buildDashboardMetrics,
  DashboardAgentCard,
} from "@/features/agent-dashboard/_components/DashboardAgentCard";

export function AdminTodayStatsCards({
  selectedDate,
}: {
  selectedDate?: Date;
}) {
  const dashboardDate = selectedDate ?? new Date();
  const { data, isLoading } = useAdminTodayAgentCards(dashboardDate);
  const cards = data?.cards ?? [];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2 xxl:grid-cols-3">
      {cards.map((agent, index) => (
        <DashboardAgentCard
          key={agent.id}
          id={agent.id}
          name={agent.name}
          surname={agent.surname}
          brand={agent.brand}
          index={index}
          badgeStatus={agent.badgeStatus}
          winnerLabel="Today Winner"
          tieLabel="Tie"
          metrics={buildDashboardMetrics(agent.badgeStatus, index, [
            {
              id: "calls-today",
              label: "Calls Today",
              value: isLoading ? "—" : agent.callsToday,
            },
            {
              id: "hot-leads-today",
              label: "Hot Leads Today",
              value: isLoading ? "—" : agent.hotLeadsToday,
            },
            {
              id: "current-hot-leads",
              label: "Current Hot Leads",
              value: isLoading ? "—" : agent.currentHotLeads,
            },
          ])}
        />
      ))}
    </div>
  );
}
