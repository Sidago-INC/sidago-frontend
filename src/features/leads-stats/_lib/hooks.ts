import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

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
  data: LeadStatsSummary;
};

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

function toIsoRange(from: Date, to: Date) {
  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

export function useLeadStatsSummary(from: Date, to: Date) {
  const range = toIsoRange(from, to);
  return useQuery({
    queryKey: ["lead-stats-summary", range.from, range.to],
    queryFn: async () => {
      const params = new URLSearchParams({ from: range.from, to: range.to });
      const json = (await api.get(
        `/reports/lead-stats-summary?${params.toString()}`,
      )) as LeadStatsSummaryResponse;
      return json.data;
    },
    staleTime: 60_000,
  });
}

export function useTodayWinner() {
  return useQuery({
    queryKey: ["today-winner"],
    queryFn: async () => {
      const json = (await api.get("/reports/today-winner")) as TodayWinnerResponse;
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
