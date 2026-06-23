import type { LeaderboardBadgeStatus } from "@/lib/resolveLeaderboardBadge";
import { TieBadge } from "./TieBadge";
import { WinnerBadge } from "./WinnerBadge";

export function LeaderboardAsideBadge({
  status,
  winnerLabel = "Winner",
  tieLabel = "Tie",
}: {
  status: LeaderboardBadgeStatus;
  winnerLabel?: string;
  tieLabel?: string;
}) {
  if (status === "winner") {
    return <WinnerBadge label={winnerLabel} />;
  }

  if (status === "tie") {
    return <TieBadge label={tieLabel} />;
  }

  return null;
}
