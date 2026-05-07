import { Agent } from "@/types";
import { getMonthName } from "../_lib/utils";
import { LeaderboardTable } from "./LeaderboardTable";

export function Leaderboard({ agents }: { agents: Agent[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 overflow-x-auto sm:gap-5 lg:grid-cols-2">
      <LeaderboardTable
        title={`This Month - ${getMonthName(0)}`}
        agents={agents}
        getValue={(agent) => agent.monthly_points}
        getWinner={(agent) => agent.monthly_winner}
        label="Ranked by monthly points"
      />
      <LeaderboardTable
        title={`Last Month - ${getMonthName(-1)}`}
        agents={agents}
        getValue={(agent) => agent.last_month_points}
        getWinner={(agent) => agent.last_month_winner}
        label="Ranked by last month points"
      />
    </div>
  );
}
