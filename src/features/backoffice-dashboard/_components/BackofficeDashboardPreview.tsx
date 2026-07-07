
import { Button, CompanySymbolBadge, StatusCard } from "@/components/ui";
import { WinnerBadge } from "@/features/agent-dashboard/_components/WinnerBadge";
import { AdminTodayStatsCards } from "@/features/admin-dashboard/AdminTodayStatsCards";
import { useAdminTodayAgentCards } from "@/features/admin-dashboard/_lib/hooks";
import clsx from "clsx";
import { ArrowRight } from "lucide-react";

const WINNER_CARD_TONE = "bg-indigo-50 dark:bg-indigo-950/30";

type BackofficeDashboardPreviewProps = {
  onOpenMonthlyStats: () => void;
};

export function BackofficeDashboardPreview({
  onOpenMonthlyStats,
}: BackofficeDashboardPreviewProps) {
  const today = new Date();
  const { data } = useAdminTodayAgentCards(today);
  const cards = data?.cards ?? [];
  const winner = cards.find((c) => c.isWinner);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          onClick={onOpenMonthlyStats}
          className="inline-flex items-center justify-center gap-2 rounded bg-indigo-600 px-5 py-1 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 cursor-pointer"
        >
          Monthly Stats.
          <ArrowRight size={16} />
        </Button>
      </div>

      {winner ? (
        <StatusCard
          className="border-slate-200 dark:border-slate-800 dark:bg-slate-900"
          header={
            <div className="flex items-center gap-3">
              <div className="min-w-0">
                <p className="truncate text-lg font-bold text-slate-900 dark:text-slate-100">
                  Today Winner
                </p>
                <div className="pt-1">
                  <CompanySymbolBadge symbol={winner.brand} index={0} />
                </div>
              </div>
            </div>
          }
          aside={
            <WinnerBadge label={`${winner.name} ${winner.surname}`} />
          }
          metrics={[
            {
              id: "calls-today",
              label: "Calls Today",
              value: winner.callsToday,
              className: clsx("rounded-xl px-4 py-3", WINNER_CARD_TONE),
              valueClassName:
                "text-xl font-bold text-slate-900 dark:text-slate-100",
            },
            {
              id: "hot-leads-today",
              label: "Hot Leads Today",
              value: winner.hotLeadsToday,
              className: clsx("rounded-xl px-4 py-3", WINNER_CARD_TONE),
              valueClassName:
                "text-xl font-bold text-slate-900 dark:text-slate-100",
            },
            {
              id: "current-hot-leads",
              label: "Current Hot Leads",
              value: winner.currentHotLeads,
              className: clsx("rounded-xl px-4 py-3", WINNER_CARD_TONE),
              valueClassName:
                "text-xl font-bold text-slate-900 dark:text-slate-100",
            },
          ]}
        />
      ) : (
        <div className="flex h-32 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Today Winner
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              No winner yet today
            </p>
          </div>
        </div>
      )}

      <AdminTodayStatsCards selectedDate={today} />
    </div>
  );
}
