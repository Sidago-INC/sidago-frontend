
import clsx from "clsx";
import React, { useMemo, useState } from "react";
import { closedContactsTabs, type ClosedContactsTabKey } from "../_lib/data";
import { useClosedContracts } from "../_lib/use-closed-contacts";
import { ClosedContactsTable } from "./ClosedContactsTable";

export function ClosedContacts() {
  const [activeTab, setActiveTab] =
    useState<ClosedContactsTabKey>("svg-current");

  const activeView = useMemo(
    () =>
      closedContactsTabs.find((tab) => tab.key === activeTab) ??
      closedContactsTabs[0],
    [activeTab],
  );

  const { data, isLoading, isError, error } = useClosedContracts(
    activeView.category,
    activeView.brand,
  );

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <div className="inline-flex min-w-full px-4 py-2 gap-2 border-b border-slate-200/80 bg-white/75 backdrop-blur-md transition-colors dark:border-slate-600 dark:bg-slate-950/70">
          {closedContactsTabs.map((tab) => {
            const isActive = tab.key === activeView.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={clsx(
                  "whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition cursor-pointer",
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

      {isLoading ? (
        <div className="flex min-h-[200px] items-center justify-center text-sm text-gray-500">
          Loading closed contracts…
        </div>
      ) : isError ? (
        <div className="flex min-h-[200px] items-center justify-center text-sm text-red-500">
          Failed to load: {error instanceof Error ? error.message : String(error)}
        </div>
      ) : (
        <ClosedContactsTable data={data ?? []} title={activeView.title} />
      )}
    </div>
  );
}
