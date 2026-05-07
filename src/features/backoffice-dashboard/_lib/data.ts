export type BackofficeLeaderboardAgent = {
  id: string;
  name: string;
  team: string;
  callsToday: number;
  hotLeadsToday: number;
  currentHotLeads: number;
  todayWinner?: boolean;
};

export const backofficeLeaderboardAgents: BackofficeLeaderboardAgent[] = [
  {
    id: "svg-1",
    name: "Hasib",
    team: "SVG",
    callsToday: 0,
    hotLeadsToday: 0,
    currentHotLeads: 1,
    todayWinner: true,
  },
  {
    id: "svg-2",
    name: "Nafis",
    team: "SVG",
    callsToday: 0,
    hotLeadsToday: 0,
    currentHotLeads: 1,
  },
  {
    id: "benton-1",
    name: "Rafi",
    team: "Benton",
    callsToday: 0,
    hotLeadsToday: 0,
    currentHotLeads: 1,
  },
  {
    id: "benton-2",
    name: "Maliha",
    team: "Benton",
    callsToday: 0,
    hotLeadsToday: 0,
    currentHotLeads: 1,
  },
];

export const todayWinner =
  backofficeLeaderboardAgents.find((agent) => agent.todayWinner) ??
  backofficeLeaderboardAgents[0];
