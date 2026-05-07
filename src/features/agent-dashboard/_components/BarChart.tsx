import { Agent } from "@/types";
import { getAgentColor } from "../_lib/utils";
import { Panel } from "./Panel";

export function BarChart({
  agents,
  getValue,
  title,
  subtitle,
}: {
  agents: Agent[];
  getValue: (agent: Agent) => number;
  title: string;
  subtitle: string;
}) {
  const barMaxPx = 160;
  const sortedAgents = [...agents].sort((a, b) => getValue(b) - getValue(a));
  const maxValue = Math.max(...sortedAgents.map(getValue), 1);

  return (
    <Panel title={title} subtitle={subtitle} bodyClassName="p-5">
      <div
        className="flex items-end gap-3"
        style={{ height: `${barMaxPx + 40}px` }}
      >
        {sortedAgents.map((agent, index) => {
          const value = getValue(agent);
          const barHeight =
            value > 0
              ? Math.max(Math.round((value / maxValue) * barMaxPx), 6)
              : 0;
          const color = getAgentColor(index);

          return (
            <div
              key={agent.recordId}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <span className="text-xs font-bold leading-none text-gray-700 dark:text-gray-300">
                {value}
              </span>
              <div
                className={`w-full rounded-t-lg transition-all duration-700 ease-out ${color.bar}`}
                style={{ height: `${barHeight}px`, flexShrink: 0 }}
              />
              <span
                className="mt-1 h-5 w-full truncate text-center text-xs leading-tight text-gray-500 dark:text-gray-400"
                title={`${agent.name} ${agent.surname}`}
              >
                {agent.name}
              </span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
