import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { createNamespacedSocket } from "@/lib/socket";

// ─── Lead Stats Summary ───────────────────────────────────────────────────

export type LeadStatsSummary = {
  leadsFixed: number;
  leadsSentToFix: number;
  leadsSentToCantLocate: number;
  newLeadsCreated: number;
  leadsSentToVoid: number;
  leadsSentToDnc: number;
};

type LeadStatsSummaryResponse = {
  ok: true;
  from: string;
  to: string;
  data: LeadStatsSummary;
};

// ─── Lead Stats Drilldown ─────────────────────────────────────────────────

export type LeadStatsFlagType =
  | "fix"
  | "fixed"
  | "cant_locate"
  | "void"
  | "new_lead"
  | "dnc";

export type LeadStatsDetailItem = {
  fullName: string;
  companySymbol: string;
  phone: string;
};

type LeadStatsDetailResponse = {
  ok: true;
  flagType: string;
  from: string;
  to: string;
  count: number;
  data: LeadStatsDetailItem[];
};

// ─── Today Winner (unchanged) ─────────────────────────────────────────────

export type TodayWinnerStanding = {
  brand: string;
  userId: string;
  fullName: string;
  hotLeads: number;
  callsMade: number;
  lostHotLeads: number;
  contractsClosed: number;
  points: number;
  isWinner?: boolean;
};

type TodayWinnerResponse = {
  ok: true;
  date: string;
  brands: Array<{
    brand: string;
    winner: TodayWinnerStanding;
    standings: TodayWinnerStanding[];
  }>;
};

// ─── Date utility ─────────────────────────────────────────────────────────

export function toYMD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// ─── Hooks ────────────────────────────────────────────────────────────────

export function useLeadStatsSummary(from: Date, to: Date) {
  const fromStr = toYMD(from);
  const toStr = toYMD(to);
  return useQuery({
    queryKey: ["lead-stats", fromStr, toStr],
    queryFn: async () => {
      const params = new URLSearchParams({ from: fromStr, to: toStr });
      const json = (await api.get(
        `/lead-stats?${params.toString()}`,
      )) as LeadStatsSummaryResponse;
      return json.data;
    },
    staleTime: 60_000,
  });
}

export function useLeadStatsDetail(
  flagType: LeadStatsFlagType | null,
  from: string,
  to: string,
) {
  return useQuery({
    queryKey: ["lead-stats-detail", flagType, from, to],
    enabled: Boolean(flagType),
    queryFn: async () => {
      const params = new URLSearchParams({ from, to });
      const json = (await api.get(
        `/lead-stats/${flagType}?${params.toString()}`,
      )) as LeadStatsDetailResponse;
      return json.data;
    },
    staleTime: 60_000,
  });
}

// cbRef pattern keeps the callback stable across renders so the socket
// effect only runs once (mount/unmount), avoiding reconnect thrash.
export function useLeadStatsSocket(
  onUpdate: (stats: LeadStatsSummary) => void,
) {
  const cbRef = useRef(onUpdate);
  cbRef.current = onUpdate;

  useEffect(() => {
    const socket = createNamespacedSocket("/lead-stats");
    const handler = (stats: LeadStatsSummary) => cbRef.current(stats);
    socket.on("stats-updated", handler);
    socket.connect();
    return () => {
      socket.off("stats-updated", handler);
      socket.disconnect();
    };
  }, []);
}

export function useTodayWinner() {
  return useQuery({
    queryKey: ["today-winner"],
    queryFn: async () => {
      const json = (await api.get(
        "/reports/today-winner",
      )) as TodayWinnerResponse;
      return json;
    },
    staleTime: 60_000,
  });
}

export function getPrimaryTodayWinner(data: TodayWinnerResponse | undefined) {
  if (!data?.brands?.length) {
    return null;
  }
  return data.brands[0]?.winner ?? null;
}

export function flattenTodayWinnerStandings(
  data: TodayWinnerResponse | undefined,
) {
  if (!data?.brands?.length) {
    return [];
  }
  return data.brands.flatMap((entry) => entry.standings);
}
