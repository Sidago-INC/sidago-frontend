import { Agent } from "@/types";

export const AGENT_COLORS = [
  {
    bar: "bg-indigo-500",
    light: "bg-indigo-50 dark:bg-indigo-950/40",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-200 dark:border-indigo-800",
    avatar: "bg-indigo-500",
  },
  {
    bar: "bg-emerald-500",
    light: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
    avatar: "bg-emerald-500",
  },
  {
    bar: "bg-rose-500",
    light: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800",
    avatar: "bg-rose-500",
  },
  {
    bar: "bg-amber-500",
    light: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
    avatar: "bg-amber-500",
  },
  {
    bar: "bg-sky-500",
    light: "bg-sky-50 dark:bg-sky-950/40",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-200 dark:border-sky-800",
    avatar: "bg-sky-500",
  },
] as const;

export const RANK_STYLES: Record<
  number,
  { bg: string; text: string; label: string }
> = {
  1: {
    bg: "bg-amber-100 dark:bg-amber-900/50",
    text: "text-amber-700 dark:text-amber-300",
    label: "1st",
  },
  2: {
    bg: "bg-slate-100 dark:bg-slate-700",
    text: "text-slate-600 dark:text-slate-300",
    label: "2nd",
  },
  3: {
    bg: "bg-orange-100 dark:bg-orange-900/50",
    text: "text-orange-700 dark:text-orange-300",
    label: "3rd",
  },
};

export function getMonthName(offset = 0): string {
  const date = new Date();
  date.setMonth(date.getMonth() + offset);
  return date.toLocaleString("default", { month: "long", year: "numeric" });
}

export function getShortDateLabel(): string {
  return new Date().toLocaleDateString("default", {
    month: "short",
    day: "numeric",
  });
}

export function getFullDateLabel(): string {
  return new Date().toLocaleDateString("default", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getInitials(agent: Agent): string {
  return `${agent.name.charAt(0)}${agent.surname.charAt(0)}`.toUpperCase();
}

export function getAgentColor(index: number) {
  return AGENT_COLORS[index % AGENT_COLORS.length];
}

export function findAgentByLoggedInName(
  agents: Agent[],
  loggedInName?: string,
): Agent | undefined {
  const firstName = loggedInName?.split(" ")[0]?.toLowerCase();

  if (!firstName) {
    return undefined;
  }

  return agents.find((agent) => agent.name.toLowerCase() === firstName);
}

export function getMonthlyWinner(agents: Agent[]): Agent | undefined {
  return agents.find((agent) => agent.monthly_winner);
}

export function getAgentDetailStats(agent: Agent) {
  return [
    { label: "Pts/Mo", value: agent.monthly_points },
    { label: "Calls/Mo", value: agent.monthly_calls },
    { label: "Hot/Mo", value: agent.monthly_hot_leads },
    { label: "Closed/Mo", value: agent.monthly_contract_closed },
    { label: "Wins", value: agent.count_wins },
    { label: "All Pts", value: agent.all_points },
  ];
}

export function getAgentNameFromCookie(): string {
  if (typeof document === "undefined") {
    return "";
  }

  const match = document.cookie.match(/agent_name=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}
