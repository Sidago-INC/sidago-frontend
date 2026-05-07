import { Agent } from "@/types";
import { Title } from "./Title";
import AgentStatusCard from "./AgentStatusCard";

export function AgentGridSection({ agents }: { agents: Agent[] }) {
  return (
    <div>
      <Title title="Agent Details" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
        {agents.map((agent, index) => (
          <AgentStatusCard key={agent.recordId} agent={agent} index={index} />
        ))}
      </div>
    </div>
  );
}
