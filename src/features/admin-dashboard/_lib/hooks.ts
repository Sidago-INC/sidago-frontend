import { useMemo } from "react";
import type { Agent } from "@/types";
import { useAllAgents } from "@/features/level-2-update/_lib/hooks";
import {
  flattenTodayWinnerStandings,
  useTodayWinner,
  type TodayWinnerStanding,
} from "@/features/leads-stats/_lib/hooks";

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

const AGENT_BRAND_BY_EMAIL: Record<string, string> = {
  "mariz@gmail.com": "SVG",
  "tom@gmail.com": "SVG",
  "bryan@gmail.com": "Benton",
  "chris@gmail.com": "95RM",
};

function brandCodeToLabel(brand: string): string {
  switch (brand.toLowerCase()) {
    case "svg":
      return "SVG";
    case "benton":
      return "Benton";
    case "95rm":
      return "95RM";
    default:
      return brand.toUpperCase();
  }
}

function splitAgentName(fullName: string): { name: string; surname: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    name: parts[0] ?? fullName,
    surname: parts.slice(1).join(" "),
  };
}

function mockAgentsToTodayCards(agents: Agent[]): TodayAgentCard[] {
  return agents.map((agent) => ({
    id: agent.recordId,
    name: agent.name,
    surname: agent.surname,
    brand: agent.brand,
    callsToday: agent.today_calls_made,
    hotLeadsToday: agent.hot_leads_today,
    currentHotLeads: agent.hot_leads_today,
    isWinner: agent.winner,
  }));
}

function buildWinnerIds(
  winnerData: ReturnType<typeof useTodayWinner>["data"],
): Set<string> {
  const ids = new Set<string>();
  winnerData?.brands.forEach((entry) => {
    if (entry.winner?.isWinner) {
      ids.add(entry.winner.userId);
    }
  });
  return ids;
}

function buildStandingsMap(
  standings: TodayWinnerStanding[],
): Map<string, TodayWinnerStanding> {
  const map = new Map<string, TodayWinnerStanding>();
  standings.forEach((standing) => {
    map.set(standing.userId, standing);
  });
  return map;
}

export function buildTodayAgentCards(
  agents: Array<{ id: string; name: string; email: string }>,
  winnerData: ReturnType<typeof useTodayWinner>["data"],
  fallbackAgents: Agent[],
): TodayAgentCard[] {
  if (!agents.length) {
    return mockAgentsToTodayCards(fallbackAgents);
  }

  const standings = flattenTodayWinnerStandings(winnerData);
  const standingsByUserId = buildStandingsMap(standings);
  const winnerIds = buildWinnerIds(winnerData);

  return agents.map((agent) => {
    const standing = standingsByUserId.get(agent.id);
    const { name, surname } = splitAgentName(agent.name);

    return {
      id: agent.id,
      name,
      surname,
      brand: brandCodeToLabel(
        standing?.brand ?? AGENT_BRAND_BY_EMAIL[agent.email] ?? "svg",
      ),
      callsToday: standing?.callsMade ?? 0,
      hotLeadsToday: standing?.hotLeads ?? 0,
      // No dedicated API field; reuse hotLeads (same as backoffice dashboard).
      currentHotLeads: standing?.hotLeads ?? 0,
      isWinner: winnerIds.has(agent.id),
    };
  });
}

export function useAdminTodayAgentCards(fallbackAgents: Agent[]) {
  const {
    data: winnerData,
    isLoading: winnerLoading,
    isError: winnerError,
  } = useTodayWinner();
  const {
    data: agents = [],
    isLoading: agentsLoading,
    isError: agentsError,
  } = useAllAgents();

  const cards = useMemo(() => {
    if (winnerError && agentsError) {
      return mockAgentsToTodayCards(fallbackAgents);
    }
    return buildTodayAgentCards(agents, winnerData, fallbackAgents);
  }, [agents, winnerData, winnerError, agentsError, fallbackAgents]);

  return {
    cards,
    reportDate: winnerData?.date,
    isLoading: winnerLoading || agentsLoading,
  };
}
