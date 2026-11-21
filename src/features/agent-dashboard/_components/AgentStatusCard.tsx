import { Agent } from "@/types";
import {
  CompanySymbolBadge,
  StatusCard as UiStatusCard,
} from "@/components/ui";
import type { LeaderboardBadgeStatus } from "@/lib/resolveLeaderboardBadge";
import { AgentIdentity } from "./AgentIdentity";
import { LeaderboardAsideBadge } from "./LeaderboardAsideBadge";
import {
  getLeaderboardCardClassName,
  getLeaderboardMetricClassName,
  getLeaderboardMetricValueClassName,
  getLeaderboardNameClassName,
} from "./leaderboardCardStyles";
import { getAgentColor, getAgentDetailStats } from "../_lib/utils";
import clsx from "clsx";

interface AgentStatusCardProps {
  agent: Agent;
  index: number;
  badgeStatus?: LeaderboardBadgeStatus;
}

export default function AgentStatusCard({
  agent,
  index,
  badgeStatus = null,
}: AgentStatusCardProps) {
  const stats = getAgentDetailStats(agent);
  const color = getAgentColor(index);

  return (
    <UiStatusCard
      className={clsx(
        "w-full",
        getLeaderboardCardClassName(badgeStatus),
        "!shadow-none dark:!shadow-none",
      )}
      bodyClassName="p-6"
      header={
          <AgentIdentity
            agent={agent}
            index={index}
            meta={<CompanySymbolBadge symbol={agent.brand} index={index} />}
            avatarSquare
            nameClassName={clsx(
              "text-xl font-bold",
              badgeStatus === "winner"
                ? getLeaderboardNameClassName(badgeStatus)
                : "text-gray-900 dark:text-gray-100",
            )}
            metaClassName="text-sm"
          />
        }
        aside={<LeaderboardAsideBadge status={badgeStatus} tieLabel="Tie" />}
        metrics={stats.map((item) => ({
          id: item.label,
          label: item.label,
          value: item.value,
          className: badgeStatus
            ? getLeaderboardMetricClassName(badgeStatus, index)
            : clsx("rounded-lg px-4 py-2 dark:bg-gray-800", color.light),
          labelClassName:
            "mb-1 text-[9px] uppercase leading-snug text-gray-500 dark:text-gray-400 whitespace-normal break-words",
          valueClassName: clsx(
            "text-base font-bold",
            badgeStatus
              ? getLeaderboardMetricValueClassName(badgeStatus)
              : "text-[#003aa0] dark:text-blue-400",
          ),
        }))}
    />
  );
}
