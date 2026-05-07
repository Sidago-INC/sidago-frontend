import { Agent } from "@/types";
import { Title } from "./Title";
import { getMonthName } from "../_lib/utils";
import { BarChart } from "./BarChart";

export function ChartsSection({ agents }: { agents: Agent[] }) {
  return (
    <div>
      <Title title="Performance Charts" />
      <div className="grid grid-cols-1 gap-3 sm:gap-5 md:grid-cols-3">
        <BarChart
          agents={agents}
          getValue={(agent) => agent.monthly_calls}
          title="Calls This Month"
          subtitle={getMonthName(0)}
        />
        <BarChart
          agents={agents}
          getValue={(agent) => agent.last_month_calls}
          title="Calls Last Month"
          subtitle={getMonthName(-1)}
        />
        <BarChart
          agents={agents}
          getValue={(agent) => agent.count_wins}
          title="All-Time Wins"
          subtitle="Total career wins"
        />
      </div>
    </div>
  );
}
