
import { useAdminMonthlyAgentCards } from "./_lib/hooks";
import {
  buildDashboardMetrics,
  DashboardAgentCard,
} from "@/features/agent-dashboard/_components/DashboardAgentCard";

export function AdminAgentScoreCards({
  selectedDate,
}: {
  selectedDate?: Date;
}) {
  const dashboardDate = selectedDate ?? new Date();
  const { data, isLoading } = useAdminMonthlyAgentCards(dashboardDate);
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
          tieLabel="Tie"
          metricsClassName="grid grid-cols-2 gap-3"
          metrics={buildDashboardMetrics(agent.badgeStatus, index, [
            {
              id: "monthly-points",
              label: "Monthly Points",
              value: isLoading ? "—" : agent.monthlyPoints,
            },
            {
              id: "last-month-points",
              label: "Last Month",
              value: isLoading ? "—" : agent.lastMonthPoints,
            },
            {
              id: "all-points",
              label: "All Points",
              value: isLoading ? "—" : agent.allPoints,
            },
            {
              id: "wins",
              label: "Wins",
              value: isLoading ? "—" : agent.wins,
            },
          ])}
        />
      ))}
    </div>
  );
}
