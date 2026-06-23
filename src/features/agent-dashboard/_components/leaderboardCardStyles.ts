import clsx from "clsx";
import type { LeaderboardBadgeStatus } from "@/lib/resolveLeaderboardBadge";

const DEFAULT_CARD_TONES = [
  "bg-indigo-50 dark:bg-indigo-950/30",
  "bg-emerald-50 dark:bg-emerald-950/30",
  "bg-amber-50 dark:bg-amber-950/30",
  "bg-sky-50 dark:bg-sky-950/30",
];

export function getLeaderboardCardClassName(status: LeaderboardBadgeStatus) {
  return clsx(
    "overflow-hidden rounded-2xl !border-solid",
    status === "winner" &&
      "!border-2 !border-amber-400 !bg-amber-50 !shadow-md dark:!border-amber-500 dark:!bg-amber-950/20",
    status === "tie" &&
      "!border-2 !border-dashed !border-slate-300 !bg-slate-50 dark:!border-slate-600 dark:!bg-slate-900",
    !status &&
      "!border !border-slate-200 !bg-white dark:!border-slate-800 dark:!bg-slate-900",
  );
}

export function getLeaderboardAvatarClassName(status: LeaderboardBadgeStatus) {
  return clsx(
    "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold",
    status === "winner" && "bg-amber-500 text-white dark:bg-amber-500",
    status === "tie" && "bg-slate-500 text-white dark:bg-slate-600",
    !status &&
      "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900",
  );
}

export function getLeaderboardMetricClassName(
  status: LeaderboardBadgeStatus,
  index: number,
) {
  return clsx(
    "rounded-xl px-4 py-3",
    status === "winner" &&
      "border border-amber-200 bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40",
    status === "tie" &&
      "border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60",
    !status && DEFAULT_CARD_TONES[index % DEFAULT_CARD_TONES.length],
  );
}

export function getLeaderboardMetricValueClassName(
  status: LeaderboardBadgeStatus,
) {
  return clsx(
    "text-lg font-bold",
    status === "winner" && "text-amber-900 dark:text-amber-200",
    status === "tie" && "text-slate-800 dark:text-slate-200",
    !status && "text-slate-900 dark:text-slate-100",
  );
}

export function getLeaderboardNameClassName(status: LeaderboardBadgeStatus) {
  return clsx(
    "truncate text-lg font-bold",
    status === "winner" && "text-amber-950 dark:text-amber-100",
    !status && "text-slate-900 dark:text-slate-100",
    status === "tie" && "text-slate-900 dark:text-slate-100",
  );
}
