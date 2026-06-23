import { useMemo } from "react";
import { Agent } from "@/types";
import { resolveLeaderboardBadgeStatuses } from "@/lib/resolveLeaderboardBadge";
import { Title } from "./Title";
import AgentStatusCard from "./AgentStatusCard";

export function AgentGridSection({ agents }: { agents: Agent[] }) {
  const monthlyBadgeStatuses = useMemo(
    () =>
      resolveLeaderboardBadgeStatuses(
        agents,
        (agent) => agent.monthly_points,
        (agent) => agent.recordId,
      ),
    [agents],
  );

  return (
    <div>
      <Title title="Agent Details" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
        {agents.map((agent, index) => (
          <AgentStatusCard
            key={agent.recordId}
            agent={agent}
            index={index}
            badgeStatus={monthlyBadgeStatuses.get(agent.recordId) ?? null}
          />
        ))}
      </div>
    </div>
  );
}
