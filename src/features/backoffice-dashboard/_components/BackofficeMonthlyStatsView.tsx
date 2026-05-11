

import { Button } from "@/components/ui";
import { backofficeLeaderboardAgents } from "../_lib/data";
import { ArrowLeft } from "lucide-react";
import { BarChart } from "@/features/agent-dashboard/_components/BarChart";
import { getMonthName } from "@/features/agent-dashboard/_lib/utils";
import { agentDashboardData } from "@/features/agent-dashboard/_lib/data";
import { BackofficeAgentCard } from "./BackofficeAgentCard";
import { MonthLeaderCard } from "./MonthLeaderCard";

export function BackofficeMonthlyStatsView({
  setView,
}: {
  setView: (view: "preview" | "monthly") => void;
}) {
  const agents = agentDashboardData;
  return (
    <>
      <div className="flex justify-end">
        <Button
          onClick={() => setView("preview")}
          className="inline-flex items-center justify-center gap-2 rounded bg-indigo-600 px-5 py-1 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 cursor-pointer"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Button>
      </div>
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <MonthLeaderCard
            title="Current Month Leader"
            name="Bryan"
            value={10000}
          />
          <MonthLeaderCard title="Last Month Leader" name="Bryan" value={700} />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2 xxl:grid-cols-3">
          {backofficeLeaderboardAgents.map((agent, index) => (
            <BackofficeAgentCard key={agent.id} agent={agent} index={index} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BarChart
            agents={agents}
            getValue={(agent) => agent.monthly_calls}
            title="Monthly Points"
            subtitle={getMonthName(0)}
          />
          <BarChart
            agents={agents}
            getValue={(agent) => agent.monthly_calls}
            title="Historical Wins"
            subtitle=""
          />
        </div>
      </div>
    </>
  );
}
