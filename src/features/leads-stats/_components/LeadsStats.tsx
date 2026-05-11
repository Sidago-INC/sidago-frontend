

import { DateRangePicker, SimpleStatusCard } from "@/components/ui";
import { Ban, CircleOff, Target, RefreshCcw, Wrench } from "lucide-react";
import { type DateRange } from "react-day-picker";
import { useState } from "react";

const leadStats = [
  {
    id: "leads-fixed",
    label: "Leads fixed",
    value: 128,
    icon: <Wrench size={18} />,
    titleClassName: "text-emerald-700 dark:text-emerald-300",
  },
  {
    id: "leads-sent-to-fix",
    label: "Leads sent to fix",
    value: 46,
    icon: <RefreshCcw size={18} />,
    titleClassName: "text-sky-700 dark:text-sky-300",
  },
  {
    id: "leads-sent-to-cant-locate",
    label: "Leads sent to can't locate",
    value: 19,
    icon: <Target size={18} />,
    titleClassName: "text-amber-700 dark:text-amber-300",
  },
  {
    id: "new-leads-created",
    label: "New leads created",
    value: 73,
    icon: <Wrench size={18} />,
    titleClassName: "text-violet-700 dark:text-violet-300",
  },
  {
    id: "leads-sent-to-void",
    label: "Leads sent to VOID",
    value: 11,
    icon: <Ban size={18} />,
    titleClassName: "text-rose-700 dark:text-rose-300",
  },
  {
    id: "leads-sent-to-dnc",
    label: "Leads sent to DNC",
    value: 8,
    icon: <CircleOff size={18} />,
    titleClassName: "text-slate-600 dark:text-slate-300",
  },
];

export function LeadsStats() {
  const today = new Date();
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>({
    from: today,
  });

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
        {leadStats.map((item) => (
          <SimpleStatusCard
            key={item.id}
            title={
              <span className="flex items-center gap-2">
                <span className={item.titleClassName}>{item.icon}</span>
                <span>{item.label}</span>
              </span>
            }
            value={item.value}
            className="border-slate-200 dark:border-slate-800 dark:bg-slate-900"
            valueClassName="text-xl font-bold text-slate-900 dark:text-slate-100"
          />
        ))}
      </div>
    </div>
  );
}
