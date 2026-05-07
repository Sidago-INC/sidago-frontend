import { Agent } from "@/types";
import {
  CompanySymbolBadge,
  StatusCard as UiStatusCard,
} from "@/components/ui";
import { AgentIdentity } from "./AgentIdentity";
import { WinnerBadge } from "./WinnerBadge";
import { getAgentColor, getAgentDetailStats } from "../_lib/utils";
import clsx from "clsx";

interface AgentStatusCardProps {
  agent: Agent;
  index: number;
}

export default function AgentStatusCard({
  agent,
  index,
}: AgentStatusCardProps) {
  const stats = getAgentDetailStats(agent);
  const color = getAgentColor(index);

  return (
    <UiStatusCard
      className="w-full border-[#e5e7ff] dark:border-gray-800 dark:bg-gray-900"
      bodyClassName="p-6"
      header={
        <AgentIdentity
          agent={agent}
          index={index}
          meta={<CompanySymbolBadge symbol={agent.brand} index={index} />}
          avatarSquare
          nameClassName="text-xl font-bold text-gray-900 dark:text-gray-100"
          metaClassName="text-sm"
        />
      }
      aside={agent.monthly_winner ? <WinnerBadge /> : undefined}
      metrics={stats.map((item) => ({
        id: item.label,
        label: item.label,
        value: item.value,
        className: clsx("rounded-lg px-4 py-2 dark:bg-gray-800", color.light),
        labelClassName:
          "mb-1 text-[10px] uppercase text-gray-500 dark:text-gray-400",
        valueClassName: "text-lg font-bold text-[#003aa0] dark:text-blue-400",
      }))}
    />
  );
}
