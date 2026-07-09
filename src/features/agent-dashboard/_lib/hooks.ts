import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { resolveLeaderboardBadgeStatuses } from "@/lib/resolveLeaderboardBadge";
import type { Agent } from "@/types";

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

function formatLocalDateParam(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatLocalMonthParam(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");

  return `${year}-${month}`;
}

function addMonths(date: Date, offset: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + offset);
  return next;
}

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

function createAgentBase(
  slug: string,
  fullName: string,
  brandCode: string,
): Agent {
  const { name, surname } = splitAgentName(fullName);

  return {
    recordId: slug,
    name,
    surname,
    email: "",
    brand: brandCodeToLabel(brandCode),
    hot_leads_today: 0,
    today_calls_made: 0,
    winner: false,
    monthly_calls: 0,
    monthly_hot_leads: 0,
    monthly_lost_hot_leads: 0,
    monthly_contract_closed: 0,
    monthly_points: 0,
    last_month_calls: 0,
    last_month_hot_lead: 0,
    last_month_contract_closed: 0,
    last_month_winner: false,
    last_month_points: 0,
    monthly_winner: false,
    last_month_lost_lead: 0,
    count_wins: 0,
    all_points: 0,
  };
}

function getOrCreateAgent(
  map: Map<string, Agent>,
  slug: string,
  fullName: string,
  brandCode: string,
) {
  const existing = map.get(slug);
  if (existing) {
    return existing;
  }

  const created = createAgentBase(slug, fullName, brandCode);
  map.set(slug, created);
  return created;
}

function mergeDashboardScores(params: {
  dailyScores: DailyScoresResponse["dailyScores"];
  currentMonthScores: MonthlyScoresResponse["monthlyScores"];
  previousMonthScores: MonthlyScoresResponse["monthlyScores"];
}) {
  const map = new Map<string, Agent>();

  params.currentMonthScores.forEach((score) => {
    const agent = getOrCreateAgent(
      map,
      score.agentSlug,
      score.name,
      score.brandCode,
    );

    agent.monthly_calls = score.callsMade;
    agent.monthly_hot_leads = score.hotLeads;
    agent.monthly_lost_hot_leads = score.lostHotLeads;
    agent.monthly_contract_closed = score.contractsClosed;
    agent.monthly_points = score.monthlyPoints;
    agent.count_wins = score.wins;
    agent.all_points = score.allPoints;
  });

  params.previousMonthScores.forEach((score) => {
    const agent = getOrCreateAgent(
      map,
      score.agentSlug,
      score.name,
      score.brandCode,
    );

    agent.last_month_calls = score.callsMade;
    agent.last_month_hot_lead = score.hotLeads;
    agent.last_month_lost_lead = score.lostHotLeads;
    agent.last_month_contract_closed = score.contractsClosed;
    agent.last_month_points = score.monthlyPoints;
  });

  params.dailyScores.forEach((score) => {
    const agent = getOrCreateAgent(
      map,
      score.agentSlug,
      score.name,
      score.brandCode,
    );

    agent.today_calls_made = score.callsMade;
    agent.hot_leads_today = score.hotLeads;
  });

  const agents = Array.from(map.values());
  const monthlyStatuses = resolveLeaderboardBadgeStatuses(
    agents,
    (agent) => agent.monthly_points,
    (agent) => agent.recordId,
  );
  const lastMonthStatuses = resolveLeaderboardBadgeStatuses(
    agents,
    (agent) => agent.last_month_points,
    (agent) => agent.recordId,
  );
  const dailyStatuses = resolveLeaderboardBadgeStatuses(
    params.dailyScores,
    (score) => score.points,
    (score) => score.agentSlug,
  );

  agents.forEach((agent) => {
    agent.monthly_winner =
      monthlyStatuses.get(agent.recordId) === "winner";
    agent.last_month_winner =
      lastMonthStatuses.get(agent.recordId) === "winner";
    agent.winner = dailyStatuses.get(agent.recordId) === "winner";
  });

  return agents;
}

// ── Panel 1: call report ──────────────────────────────────────────────────

type CallReportResponse = {
  ok: true;
  startDate: string;
  endDate: string;
  agentSlug: string;
  brandCode: string;
  totalCalls: number;
  byResult: Record<string, number>;
};

export function useAgentCallReport(
  agentSlug: string | null | undefined,
  startDate: string,
  endDate: string,
) {
  return useQuery({
    queryKey: ["agent-dashboard", "call-report", agentSlug, startDate, endDate],
    queryFn: async () =>
      api.get(
        `/dashboard/call-report?agentSlug=${agentSlug}&startDate=${startDate}&endDate=${endDate}`,
      ) as Promise<CallReportResponse>,
    enabled: Boolean(agentSlug),
    staleTime: 60_000,
  });
}

// ── Panel 2: call details ─────────────────────────────────────────────────

export type CallDetailRow = {
  callLogId: string;
  calledAt: string;
  resultCode: string | null;
  notes: string | null;
  durationSeconds: number | null;
  mcDurationSeconds: number | null;
  mcRecordingLink: string | null;
  source: string | null;
  leadId: string;
  fullName: string | null;
  companyName: string | null;
  companySymbol: string | null;
  leadType: string | null;
};

type CallDetailsResponse = {
  ok: true;
  startDate: string;
  endDate: string;
  agentSlug: string;
  brandCode: string;
  data: CallDetailRow[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export function useAgentCallDetails(
  agentSlug: string | null | undefined,
  startDate: string,
  endDate: string,
  page: number,
  limit: number,
) {
  return useQuery({
    queryKey: ["agent-dashboard", "call-details", agentSlug, startDate, endDate, page, limit],
    queryFn: async () =>
      api.get(
        `/dashboard/call-details?agentSlug=${agentSlug}&startDate=${startDate}&endDate=${endDate}&page=${page}&limit=${limit}`,
      ) as Promise<CallDetailsResponse>,
    enabled: Boolean(agentSlug),
    staleTime: 60_000,
  });
}

// ── Panel 3: hot and closed ───────────────────────────────────────────────

export type HotAndClosedRow = {
  leadId: string;
  leadIdExternal: string | null;
  fullName: string | null;
  phone: string | null;
  phoneExtension: string | null;
  email: string | null;
  role: string | null;
  timezone: string | null;
  contactType: string | null;
  leadType: string | null;
  lastCalledDate: string | null;
  followUpDate: string | null;
  dateBecameHot: string | null;
  callResultCode: string | null;
  companyName: string | null;
  companySymbol: string | null;
};

type HotAndClosedResponse = {
  ok: true;
  agentSlug: string;
  brandCode: string;
  counts: { hot: number; contractClosed: number };
  data: HotAndClosedRow[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export function useAgentHotAndClosed(
  agentSlug: string | null | undefined,
  page: number,
  limit: number,
) {
  return useQuery({
    queryKey: ["agent-dashboard", "hot-and-closed", agentSlug, page, limit],
    queryFn: async () =>
      api.get(
        `/dashboard/hot-and-closed?agentSlug=${agentSlug}&page=${page}&limit=${limit}`,
      ) as Promise<HotAndClosedResponse>,
    enabled: Boolean(agentSlug),
    staleTime: 60_000,
  });
}

// ── All-agents merged scores (still used by StatusSection) ────────────────

export function useAgentDashboard(selectedDate = new Date()) {
  const date = formatLocalDateParam(selectedDate);
  const currentMonth = formatLocalMonthParam(selectedDate);
  const previousMonth = formatLocalMonthParam(addMonths(selectedDate, -1));

  return useQuery({
    queryKey: [
      "agent-dashboard",
      "scores",
      date,
      currentMonth,
      previousMonth,
    ],
    queryFn: async () => {
      const [daily, currentMonthly, previousMonthly] = await Promise.all([
        api.get(`/dashboard/daily-scores?date=${date}`) as Promise<DailyScoresResponse>,
        api.get(
          `/dashboard/monthly-scores?month=${currentMonth}`,
        ) as Promise<MonthlyScoresResponse>,
        api.get(
          `/dashboard/monthly-scores?month=${previousMonth}`,
        ) as Promise<MonthlyScoresResponse>,
      ]);

      return {
        agents: mergeDashboardScores({
          dailyScores: daily.dailyScores,
          currentMonthScores: currentMonthly.monthlyScores,
          previousMonthScores: previousMonthly.monthlyScores,
        }),
        reportDate: daily.date,
        currentReportMonth: currentMonthly.month,
        previousReportMonth: previousMonthly.month,
      };
    },
    staleTime: 60_000,
  });
}
