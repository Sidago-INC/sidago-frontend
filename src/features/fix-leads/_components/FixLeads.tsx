

import clsx from "clsx";
import { Button } from "@/components/ui";
import { useMemo, useState } from "react";
import {
  fixLeads24HourTabs,
  fixQueueData,
  type FixLeads24HourTabKey,
} from "../_lib/data";
import { FixLeadsTable } from "./FixLeadsTable";
import { ArrowRight } from "lucide-react";

export function FixLeads() {
  const [show24HourView, setShow24HourView] = useState(false);
  const [activeTab, setActiveTab] =
    useState<FixLeads24HourTabKey>("sent-to-fix");

  const active24HourTab = useMemo(
    () =>
      fixLeads24HourTabs.find((tab) => tab.key === activeTab) ??
      fixLeads24HourTabs[0],
    [activeTab],
  );

  const pageTitle = show24HourView ? "24hrs Leads" : "Fix Queue";
  const tableData = show24HourView ? active24HourTab.data : fixQueueData;
  const buttonLabel = show24HourView ? "Back to Fix Queue" : "24hrs Leads";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 px-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {pageTitle}
        </h1>
        <Button
          onClick={() => setShow24HourView((current) => !current)}
          className="inline-flex items-center justify-center gap-2 rounded bg-indigo-600 px-5 py-1 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 cursor-pointer"
        >
          {buttonLabel}
          <ArrowRight size={16} />
        </Button>
      </div>

      {show24HourView ? (
        <div className="overflow-x-auto">
          <div className="inline-flex min-w-full gap-2 border-b border-slate-200/80 bg-white/75 px-4 py-2 backdrop-blur-md transition-colors dark:border-slate-600 dark:bg-slate-950/70">
            {fixLeads24HourTabs.map((tab) => {
              const isActive = tab.key === active24HourTab.key;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={clsx(
                    "cursor-pointer whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition",
                    isActive
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-200 dark:hover:text-slate-900",
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <FixLeadsTable data={tableData} title={pageTitle} />
    </div>
  );
}
