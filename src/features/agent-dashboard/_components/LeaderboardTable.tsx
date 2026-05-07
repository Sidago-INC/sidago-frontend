import { Agent } from "@/types";
import { BarChart3 } from "lucide-react";
import { CompanySymbolBadge } from "@/components/ui";
import { AgentIdentity } from "./AgentIdentity";
import { Panel } from "./Panel";
import { getAgentColor, RANK_STYLES } from "../_lib/utils";

export function LeaderboardTable({
  title,
  agents,
  getValue,
  getWinner,
  label,
}: {
  title: string;
  agents: Agent[];
  getValue: (agent: Agent) => number;
  getWinner: (agent: Agent) => boolean;
  label: string;
}) {
  const sortedAgents = [...agents].sort((a, b) => getValue(b) - getValue(a));

  return (
    <Panel
      title={title}
      subtitle={label}
      action={
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/40">
          <BarChart3 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        </div>
      }
      bodyClassName="divide-y divide-gray-50 dark:divide-gray-700/50"
    >
      {sortedAgents.map((agent, index) => {
        const rank = index + 1;
        const rankStyle = RANK_STYLES[rank];
        const color = getAgentColor(index);
        const isWinner = getWinner(agent);
        const value = getValue(agent);

        return (
          <div
            key={agent.recordId}
            className={`flex items-center gap-2 px-3 py-2.5 transition-colors sm:gap-4 sm:px-5 sm:py-3.5 ${
              rank === 1
                ? "bg-amber-50/40 dark:bg-amber-900/10"
                : "hover:bg-gray-50 dark:hover:bg-gray-700/40"
            }`}
          >
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold sm:h-9 sm:w-9 sm:rounded-xl sm:text-sm ${
                rankStyle
                  ? `${rankStyle.bg} ${rankStyle.text}`
                  : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
              }`}
            >
              {rankStyle ? rankStyle.label : `${rank}th`}
            </div>

            <div className="min-w-0 flex-1">
              <AgentIdentity
                agent={agent}
                index={index}
                meta={<CompanySymbolBadge symbol={agent.brand} index={index} />}
                nameClassName="truncate text-xs font-semibold text-gray-800 dark:text-gray-100 sm:text-sm"
                metaClassName="truncate text-[10px] sm:text-xs"
                containerClassName="flex items-center gap-2"
              />
            </div>

            {isWinner && (
              <span className="whitespace-nowrap rounded-full border border-amber-200 bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:border-amber-700 dark:bg-amber-900/50 dark:text-amber-300 sm:px-2 sm:text-xs">
                Winner
              </span>
            )}

            <div
              className={`min-w-10 rounded-lg border px-2 py-1 text-center text-xs font-bold sm:min-w-13 sm:px-3 sm:text-sm ${color.light} ${color.text} ${color.border}`}
            >
              {value}
            </div>
          </div>
        );
      })}
    </Panel>
  );
}
