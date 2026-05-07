
import React from "react";

export function UnassignedHotLeadsEmptyState({
  subtitle,
}: {
  subtitle: string;
}) {
  return (
    <div className="px-6 py-16 md:px-10">
      <div className="mx-auto flex max-w-xl flex-col items-center rounded-3xl border border-slate-200/80 bg-white/85 px-6 py-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
        <div className="mb-6 flex h-36 w-full max-w-sm items-center justify-center rounded-3xl border border-slate-200/80 bg-slate-50/80 px-6 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="w-full max-w-60 space-y-3">
            <div className="h-3 w-24 rounded-full bg-slate-300/80 dark:bg-slate-700" />
            <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950/80">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-sky-100 dark:bg-sky-950/60" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
                  <div className="h-3 w-16 rounded-full bg-slate-100 dark:bg-slate-900" />
                </div>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-900" />
              <div className="h-2.5 w-5/6 rounded-full bg-slate-100 dark:bg-slate-900" />
            </div>
            <div className="flex justify-end">
              <div className="h-10 w-32 rounded-2xl border border-dashed border-slate-300 bg-white/70 dark:border-slate-700 dark:bg-slate-950/70" />
            </div>
          </div>
        </div>
        <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          No leads yet
        </h3>
        <p className="mt-3 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
