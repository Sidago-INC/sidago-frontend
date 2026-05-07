import { Agent } from "@/types";
import { AgentIdentity } from "./AgentIdentity";
import { MetricTile } from "./MetricTile";
import { Panel } from "./Panel";
import { WinnerBadge } from "./WinnerBadge";
import { getAgentDetailStats } from "../_lib/utils";
import clsx from "clsx";

interface StatusCardProps {
  agent: Agent;
  index: number;
}

export default function StatusCard({ agent, index }: StatusCardProps) {
  const stats = getAgentDetailStats(agent);

  return (
    <Panel
      className="w-full border-[#e5e7ff] dark:border-gray-800 dark:bg-gray-900"
      bodyClassName="p-6"
    >
      <div className="space-y-6">
        <AgentIdentity
          agent={agent}
          index={index}
          meta={agent.brand}
          avatarSquare
          nameClassName="text-xl font-bold text-gray-900 dark:text-gray-100"
          metaClassName="text-sm text-gray-500 dark:text-gray-400"
          aside={agent.monthly_winner ? <WinnerBadge /> : undefined}
        />

        <div className="grid grid-cols-3 gap-3">
          {stats.map((item) => (
            <MetricTile
              key={item.label}
              label={item.label}
              value={item.value}
              className={clsx(
                "rounded-lg px-4 py-2 bg-indigo-50 dark:bg-gray-800",
              )}
              labelClassName="mb-1 text-[10px] uppercase text-gray-500 dark:text-gray-400"
              valueClassName="text-lg font-bold text-[#003aa0] dark:text-blue-400"
            />
          ))}
        </div>
      </div>
    </Panel>
  );
}
