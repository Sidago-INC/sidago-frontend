

import { AgentGridSection } from "./_components/AgentGridSection";
import { ChartsSection } from "./_components/ChartsSection";
import { agentDashboardData } from "./_lib/data";
import { Leaderboard } from "./_components/Leaderboard";
import { StatusSection } from "./_components/StatusSection";
import { findAgentByLoggedInName, getMonthlyWinner } from "./_lib/utils";
import { useAuth } from "@/providers/AuthProvider";

export default function AgentDashboard() {
  const { user } = useAuth();
  const agents = agentDashboardData;
  const currentAgent = findAgentByLoggedInName(agents, user?.name);
  const monthlyWinner = getMonthlyWinner(agents);

  return (
    <div className="min-h-full bg-gray-50/60 dark:bg-gray-950">
      <main className="mx-auto space-y-5 px-3 py-4 sm:space-y-6 sm:px-6 sm:py-6">
        <StatusSection
          currentAgent={currentAgent}
          monthlyWinner={monthlyWinner}
          loggedInName={user?.name ?? ""}
        />

        <Leaderboard agents={agents} />

        <ChartsSection agents={agents} />

        <AgentGridSection agents={agents} />

        <div className="h-4" />
      </main>
    </div>
  );
}
