import { Agent } from "@/types";
import { Flame, Phone, Star, Trophy } from "lucide-react";
import { getMonthName } from "../_lib/utils";
import { WidgetCard } from "./WidgetCard";

export function StatusSection({
  currentAgent,
  monthlyWinner,
  loggedInName,
}: {
  currentAgent?: Agent;
  monthlyWinner?: Agent;
  loggedInName: string;
}) {
  if (!currentAgent) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-800 dark:bg-amber-950/30">
        <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
          Agent &quot;{loggedInName || "Unknown"}&quot; not found in this table.
          Showing all agents below.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 text-sm font-bold tracking-wide text-slate-700 dark:text-slate-200">
        My Stats - {currentAgent.name} {currentAgent.surname}
      </p>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <WidgetCard
          label="Hot Leads Today"
          value={currentAgent.hot_leads_today}
          colorClass="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
          icon={
            <Flame className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          }
        />
        <WidgetCard
          label="Calls Today"
          value={currentAgent.today_calls_made}
          colorClass="border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200"
          icon={<Phone className="h-5 w-5 text-sky-600 dark:text-sky-400" />}
        />
        <WidgetCard
          label={`Points - ${getMonthName(0)}`}
          value={currentAgent.monthly_points}
          colorClass="border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200"
          icon={
            <Star className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          }
        />
        <WidgetCard
          label="Monthly Leader"
          value={
            monthlyWinner
              ? `${monthlyWinner.name} ${monthlyWinner.surname}`
              : "-"
          }
          colorClass="border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
          icon={
            <Trophy className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          }
        />
      </div>
    </div>
  );
}
