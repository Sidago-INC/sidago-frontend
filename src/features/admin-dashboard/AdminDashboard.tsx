

import { DatePicker } from "@/components/ui";
import { useState } from "react";
import { easternTodayDate } from "@/lib/est";
import { AdminAgentScoreCards } from "./AdminAgentScoreCards";
import { AdminTodayStatsCards } from "./AdminTodayStatsCards";

export default function AdminDashboard() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    easternTodayDate(),
  );

  return (
    <main className="min-h-full p-6 md:p-8">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Today
            </p>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Agent activity cards
            </h2>
          </div>
          <div className="w-full md:w-56">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Filter Date
              </p>
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                placeholder="Pick a date"
              />
            </div>
          </div>
        </div>
        <AdminTodayStatsCards selectedDate={selectedDate} />
      </div>
      <div className="mt-10 space-y-6">
        <div className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Monthly
          </p>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Agent score cards
          </h2>
        </div>
        <AdminAgentScoreCards selectedDate={selectedDate} />
      </div>
    </main>
  );
}
