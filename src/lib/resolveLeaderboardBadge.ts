export type LeaderboardBadgeStatus = "winner" | "tie" | null;

export function resolveLeaderboardBadgeStatuses<T>(
  items: readonly T[],
  getScore: (item: T) => number,
  getId: (item: T) => string,
): Map<string, LeaderboardBadgeStatus> {
  if (items.length === 0) {
    return new Map();
  }

  const maxScore = Math.max(...items.map(getScore));
  const topCount = items.filter((item) => getScore(item) === maxScore).length;
  const topStatus: LeaderboardBadgeStatus = topCount > 1 ? "tie" : "winner";

  return new Map(
    items.map((item) => [
      getId(item),
      getScore(item) === maxScore ? topStatus : null,
    ]),
  );
}

export function applyLeaderboardBadgeStatuses<
  T extends { id: string },
>(
  items: T[],
  getScore: (item: T) => number,
): Array<T & { badgeStatus: LeaderboardBadgeStatus }> {
  const statuses = resolveLeaderboardBadgeStatuses(
    items,
    getScore,
    (item) => item.id,
  );

  return items.map((item) => ({
    ...item,
    badgeStatus: statuses.get(item.id) ?? null,
  }));
}
