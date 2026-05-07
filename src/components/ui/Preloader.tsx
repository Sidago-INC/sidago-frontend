
import React, { memo } from "react";
import { Wave } from "./Spinner";

export const Preloader = memo(function Preloader({
  text = "Loading",
  fullScreen = true,
}: {
  text?: string;
  fullScreen?: boolean;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-center ${
        fullScreen
          ? "fixed inset-0 z-50 bg-slate-950/20 backdrop-blur-lg dark:bg-slate-950/50"
          : "py-8"
      }`}
    >
      <div className="relative">
        <div className="absolute -inset-12 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.18),transparent_65%)] opacity-80" />
        <div className="relative flex min-w-[260px] flex-col items-center gap-4 rounded-3xl border border-white/40 bg-white/85 px-8 py-6 text-center shadow-xl backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70">
          <div className="relative flex h-14 w-14 items-center justify-center">
            <span className="absolute inset-0 rounded-full border-2 border-slate-200/80 border-t-indigo-500/90 animate-spin dark:border-slate-700/70 dark:border-t-indigo-300/90" />
            <span className="absolute inset-2 rounded-full border border-indigo-200/70 animate-pulse dark:border-indigo-400/40" />
            <div className="relative flex h-8 w-8 items-center justify-center rounded-2xl bg-white/70 shadow-sm dark:bg-slate-950/60">
              <Wave />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {text}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Warming up the experience. This will be quick.
            </p>
          </div>
          <div className="h-1.5 w-40 overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-700/50">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-indigo-400 via-sky-400 to-indigo-500" />
          </div>
        </div>
      </div>
    </div>
  );
});
