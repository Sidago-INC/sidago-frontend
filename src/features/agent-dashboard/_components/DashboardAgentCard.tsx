import clsx from "clsx";
import { CompanySymbolBadge, StatusCard } from "@/components/ui";
import type { StatusCardMetric } from "@/components/ui/StatusCard";
import type { LeaderboardBadgeStatus } from "@/lib/resolveLeaderboardBadge";
import { LeaderboardAsideBadge } from "./LeaderboardAsideBadge";
import {
  getLeaderboardAvatarClassName,
  getLeaderboardCardClassName,
  getLeaderboardMetricClassName,
  getLeaderboardMetricValueClassName,
  getLeaderboardNameClassName,
} from "./leaderboardCardStyles";

type DashboardAgentCardProps = {
  id: string;
  name: string;
  surname: string;
  brand: string;
  index: number;
  badgeStatus: LeaderboardBadgeStatus;
  winnerLabel?: string;
  tieLabel?: string;
  metrics: StatusCardMetric[];
  metricsClassName?: string;
};

export function DashboardAgentCard({
  name,
  surname,
  brand,
  index,
  badgeStatus,
  winnerLabel,
  tieLabel,
  metrics,
  metricsClassName,
}: DashboardAgentCardProps) {
  const initials = `${name.slice(0, 1)}${surname.slice(0, 1) || name.slice(1, 2)}`;

  return (
    <StatusCard
      className={clsx(
        getLeaderboardCardClassName(badgeStatus),
        "!shadow-none dark:!shadow-none",
      )}
      header={
          <div className="flex items-center gap-3">
            <div className={getLeaderboardAvatarClassName(badgeStatus)}>
              {initials}
            </div>
            <div className="min-w-0">
              <p className={getLeaderboardNameClassName(badgeStatus)}>
                {name} {surname}
              </p>
              <div className="pt-1">
                <CompanySymbolBadge symbol={brand} index={index} />
              </div>
            </div>
          </div>
        }
        aside={
          <LeaderboardAsideBadge
            status={badgeStatus}
            winnerLabel={winnerLabel}
            tieLabel={tieLabel}
          />
        }
        metrics={metrics}
        metricsClassName={metricsClassName}
      />
  );
}

export function buildDashboardMetrics(
  badgeStatus: LeaderboardBadgeStatus,
  index: number,
  items: Array<{ id: string; label: string; value: StatusCardMetric["value"] }>,
): StatusCardMetric[] {
  return items.map((item) => ({
    id: item.id,
    label: item.label,
    value: item.value,
    className: getLeaderboardMetricClassName(badgeStatus, index),
    valueClassName: getLeaderboardMetricValueClassName(badgeStatus),
  }));
}
