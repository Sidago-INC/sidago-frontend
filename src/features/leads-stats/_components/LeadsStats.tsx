

import { DateRangePicker, SimpleStatusCard } from "@/components/ui";
import { Ban, CircleOff, Target, RefreshCcw, Wrench } from "lucide-react";
import { type DateRange } from "react-day-picker";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDrawer } from "@/providers/DrawerProvider";
import {
  useLeadStatsSummary,
  useLeadStatsSocket,
  toYMD,
  type LeadStatsFlagType,
  type LeadStatsSummary,
} from "../_lib/hooks";
import { LeadStatsDrilldown } from "./LeadStatsDrilldown";

export function LeadsStats() {
  const today = new Date();
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>({
    from: today,
    to: today,
  });
  const [socketStats, setSocketStats] = useState<LeadStatsSummary | null>(null);
  const { open } = useDrawer();

  const fromDate = selectedRange?.from ?? today;
  const toDate = selectedRange?.to ?? selectedRange?.from ?? today;
  const fromStr = toYMD(fromDate);
  const toStr = toYMD(toDate);

  const { data: stats, isLoading } = useLeadStatsSummary(fromDate, toDate);

  // Socket updates are live "right now" stats — clear the override whenever the
  // user navigates to a historical range so stale live data doesn't bleed in.
  useEffect(() => {
    setSocketStats(null);
  }, [fromStr, toStr]);

  const handleSocketUpdate = useCallback((update: LeadStatsSummary) => {
    setSocketStats(update);
  }, []);
  useLeadStatsSocket(handleSocketUpdate);

  const effectiveStats = socketStats ?? stats;

  const openDrilldown = (label: string, flagType: LeadStatsFlagType) => {
    open({
      direction: "right",
      size: "480px",
      header: (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-indigo-500">
            Lead Details
          </p>
          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {label}
          </p>
        </div>
      ),
      children: (
        <LeadStatsDrilldown flagType={flagType} from={fromStr} to={toStr} />
      ),
    });
  };

  const leadStats = useMemo(
    () => [
      {
        id: "leads-fixed",
        label: "Leads fixed",
        value: effectiveStats?.leadsFixed ?? 0,
        icon: <Wrench size={18} />,
        titleClassName: "text-emerald-700 dark:text-emerald-300",
        flagType: "fixed" as LeadStatsFlagType,
      },
      {
        id: "leads-sent-to-fix",
        label: "Leads sent to fix",
        value: effectiveStats?.leadsSentToFix ?? 0,
        icon: <RefreshCcw size={18} />,
        titleClassName: "text-sky-700 dark:text-sky-300",
        flagType: "fix" as LeadStatsFlagType,
      },
      {
        id: "leads-sent-to-cant-locate",
        label: "Leads sent to can't locate",
        value: effectiveStats?.leadsSentToCantLocate ?? 0,
        icon: <Target size={18} />,
        titleClassName: "text-amber-700 dark:text-amber-300",
        flagType: "cant_locate" as LeadStatsFlagType,
      },
      {
        id: "new-leads-created",
        label: "New leads created",
        value: effectiveStats?.newLeadsCreated ?? 0,
        icon: <Wrench size={18} />,
        titleClassName: "text-violet-700 dark:text-violet-300",
        flagType: "new_lead" as LeadStatsFlagType,
      },
      {
        id: "leads-sent-to-void",
        label: "Leads sent to VOID",
        value: effectiveStats?.leadsSentToVoid ?? 0,
        icon: <Ban size={18} />,
        titleClassName: "text-rose-700 dark:text-rose-300",
        flagType: "void" as LeadStatsFlagType,
      },
      {
        id: "leads-sent-to-dnc",
        label: "Leads sent to DNC",
        value: effectiveStats?.leadsSentToDnc ?? 0,
        icon: <CircleOff size={18} />,
        titleClassName: "text-slate-600 dark:text-slate-300",
        flagType: null,
      },
    ],
    [effectiveStats],
  );

  return (
    <div className="mx-auto flex w-full flex-col gap-6 px-4 py-6 lg:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Fixed Leads
          </h1>
        </div>

        <div className="flex w-full max-w-xl flex-col lg:items-end">
          <div className="w-full lg:max-w-md">
            <DateRangePicker
              value={selectedRange}
              onChange={(value) =>
                setSelectedRange(
                  value ?? {
                    from: today,
                    to: today,
                  },
                )
              }
              placeholder="Pick a date or range"
              className="h-11 rounded-xl border-slate-300 bg-white text-sm dark:border-slate-700 dark:bg-slate-950"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {leadStats.map((item) =>
          item.flagType ? (
            <div
              key={item.id}
              onClick={() =>
                openDrilldown(item.label, item.flagType as LeadStatsFlagType)
              }
              className="cursor-pointer"
            >
              <SimpleStatusCard
                title={
                  <span className="flex items-center gap-2">
                    <span className={item.titleClassName}>{item.icon}</span>
                    <span>{item.label}</span>
                  </span>
                }
                value={isLoading ? "—" : item.value}
                className="border-slate-200 dark:border-slate-800 dark:bg-slate-900"
                valueClassName="text-xl font-bold text-slate-900 dark:text-slate-100"
              />
            </div>
          ) : (
            <SimpleStatusCard
              key={item.id}
              title={
                <span className="flex items-center gap-2">
                  <span className={item.titleClassName}>{item.icon}</span>
                  <span>{item.label}</span>
                </span>
              }
              value={isLoading ? "—" : item.value}
              className="border-slate-200 dark:border-slate-800 dark:bg-slate-900"
              valueClassName="text-xl font-bold text-slate-900 dark:text-slate-100"
            />
          ),
        )}
      </div>
    </div>
  );
}
