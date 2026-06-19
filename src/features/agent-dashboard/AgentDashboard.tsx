
import { AgentGridSection } from "./_components/AgentGridSection";
import { ChartsSection } from "./_components/ChartsSection";
import { Leaderboard } from "./_components/Leaderboard";
import { StatusSection } from "./_components/StatusSection";
import { findAgentByLoggedInName, getMonthlyWinner } from "./_lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { ErrorState, Preloader } from "@/components/ui";
import { useAgentDashboard } from "./_lib/hooks";

export default function AgentDashboard() {
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch } = useAgentDashboard();
  const agents = data?.agents ?? [];
  const currentAgent = findAgentByLoggedInName(agents, user?.name);
  const monthlyWinner = getMonthlyWinner(agents);

  if (isLoading && agents.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Preloader text="Loading dashboard" fullScreen={false} />
      </div>
    );
  }

  if (isError) {
    return (
      <main className="min-h-full p-6 md:p-8">
        <ErrorState
          error={error}
          title="Failed to load dashboard scores"
          onRetry={() => {
            void refetch();
          }}
        />
      </main>
    );
  }

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
