import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type TodayAgentCard = {
  id: string;
  name: string;
  surname: string;
  brand: string;
  callsToday: number;
  hotLeadsToday: number;
  currentHotLeads: number;
  isWinner: boolean;
};

export type MonthlyAgentCard = {
  id: string;
  name: string;
  surname: string;
  brand: string;
  monthlyCalls: number;
  hotLeads: number;
  lostHotLeads: number;
  contractsClosed: number;
  monthlyPoints: number;
  lastMonthPoints: number;
  allPoints: number;
  wins: number;
  isWinner: boolean;
};

export type AgentHistoryMonth = {
  yearMonth: string;
  callsMade: number;
  hotLeads: number;
  lostHotLeads: number;
  contractsClosed: number;
  points: number;
  isWinner: boolean;
};

type DailyScoresResponse = {
  ok: true;
  date: string;
  dailyScores: Array<{
    agentSlug: string;
    name: string;
    brandCode: string;
    callsMade: number;
    hotLeads: number;
    currentHotLeads: number;
    points: number;
    isWinner: boolean;
  }>;
};

type MonthlyScoresResponse = {
  ok: true;
  month: string;
  monthlyScores: Array<{
    agentSlug: string;
    name: string;
    brandCode: string;
    callsMade: number;
    hotLeads: number;
    lostHotLeads: number;
    contractsClosed: number;
    monthlyPoints: number;
    lastMonthPoints: number;
    allPoints: number;
    wins: number;
    isWinner: boolean;
  }>;
};

type AgentMonthlyHistoryResponse = {
  ok: true;
  agentSlug: string;
  brandCode: string;
  history: AgentHistoryMonth[];
};

function brandCodeToLabel(brandCode: string): string {
  switch (brandCode.toLowerCase()) {
    case "svg":
      return "SVG";
    case "benton":
      return "Benton";
    case "95rm":
      return "95RM";
    default:
      return brandCode.toUpperCase();
  }
}

function splitAgentName(fullName: string): { name: string; surname: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    name: parts[0] ?? fullName,
    surname: parts.slice(1).join(" "),
  };
}

function formatDateParam(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatMonthParam(date: Date) {
  return date.toISOString().slice(0, 7);
}

function mapDailyScoresToCards(
  scores: DailyScoresResponse["dailyScores"],
): TodayAgentCard[] {
  return scores.map((score) => {
    const { name, surname } = splitAgentName(score.name);
    return {
      id: score.agentSlug,
      name,
      surname,
      brand: brandCodeToLabel(score.brandCode),
      callsToday: score.callsMade,
      hotLeadsToday: score.hotLeads,
      currentHotLeads: score.currentHotLeads,
      isWinner: score.isWinner,
    };
  });
}

function mapMonthlyScoresToCards(
  scores: MonthlyScoresResponse["monthlyScores"],
): MonthlyAgentCard[] {
  return scores.map((score) => {
    const { name, surname } = splitAgentName(score.name);
    return {
      id: score.agentSlug,
      name,
      surname,
      brand: brandCodeToLabel(score.brandCode),
      monthlyCalls: score.callsMade,
      hotLeads: score.hotLeads,
      lostHotLeads: score.lostHotLeads,
      contractsClosed: score.contractsClosed,
      monthlyPoints: score.monthlyPoints,
      lastMonthPoints: score.lastMonthPoints,
      allPoints: score.allPoints,
      wins: score.wins,
      isWinner: score.isWinner,
    };
  });
}

export function useAdminTodayAgentCards(selectedDate: Date) {
  const date = formatDateParam(selectedDate);

  return useQuery({
    queryKey: ["admin-dashboard", "daily-scores", date],
    queryFn: async () => {
      const json = (await api.get(
        `/dashboard/daily-scores?date=${date}`,
      )) as DailyScoresResponse;

      return {
        cards: mapDailyScoresToCards(json.dailyScores),
        reportDate: json.date,
      };
    },
    staleTime: 60_000,
  });
}

export function useAdminMonthlyAgentCards(selectedDate: Date) {
  const month = formatMonthParam(selectedDate);

  return useQuery({
    queryKey: ["admin-dashboard", "monthly-scores", month],
    queryFn: async () => {
      const json = (await api.get(
        `/dashboard/monthly-scores?month=${month}`,
      )) as MonthlyScoresResponse;

      return {
        cards: mapMonthlyScoresToCards(json.monthlyScores),
        reportMonth: json.month,
      };
    },
    staleTime: 60_000,
  });
}

export function useAgentMonthlyHistory(agentSlug: string | null) {
  return useQuery({
    queryKey: ["agent-monthly-history", agentSlug],
    queryFn: async () => {
      const json = (await api.get(
        `/dashboard/agent-monthly-history?agentSlug=${agentSlug}`,
      )) as AgentMonthlyHistoryResponse;
      return json;
    },
    enabled: Boolean(agentSlug),
    staleTime: 5 * 60_000,
  });
}
