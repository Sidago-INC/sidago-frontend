

import { Button } from "@/components/ui";
import { CircleMinus, PlayCircle } from "lucide-react";
import { PingDot } from "./PingDot";

type AutoCallingBannerProps = {
  isAutoCalling: boolean;
  testMode: boolean;
  currentLeadName: string;
  onStart: () => void;
  onStop: () => void;
};

export function AutoCallingBanner({
  isAutoCalling,
  testMode,
  currentLeadName,
  onStart,
  onStop,
}: AutoCallingBannerProps) {
  return (
    <div
      className={`sticky top-14 z-30 transition-all duration-300 ${
        isAutoCalling
          ? "bg-linear-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/40"
          : "border-b border-slate-200 bg-white dark:border-gray-700 dark:bg-gray-900"
      }`}
    >
      <div className="flex flex-col gap-2.5 px-4 py-2.5 sm:h-14 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-0">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {isAutoCalling && <PingDot />}
          <span
            className={`truncate text-sm font-semibold ${
              isAutoCalling ? "text-white" : "text-slate-600 dark:text-gray-300"
            }`}
          >
            {isAutoCalling ? "Auto Calling in progress..." : "Auto Calling"}
          </span>
          {isAutoCalling && testMode && (
            <span className="shrink-0 rounded bg-amber-400 px-1.5 py-0.5 text-xs font-bold text-amber-900">
              TEST
            </span>
          )}
          {isAutoCalling && (
            <span className="hidden truncate text-xs font-medium text-emerald-100 sm:block">
              Calling: {currentLeadName}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <Button
            onClick={onStart}
            disabled={isAutoCalling}
            className={`${isAutoCalling ? "hidden sm:flex" : "flex"} min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition-all sm:px-5 ${
              isAutoCalling
                ? "cursor-not-allowed bg-white/20 text-white/50"
                : "cursor-pointer bg-emerald-500 text-white shadow-md shadow-emerald-200 hover:bg-emerald-400 dark:shadow-emerald-900/40"
            }`}
          >
            <PlayCircle className="h-4 w-4 shrink-0" />
            <span className="sm:hidden">Start Call</span>
            <span className="hidden sm:inline">Start Auto Calling</span>
          </Button>

          <Button
            onClick={onStop}
            disabled={!isAutoCalling}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition-all sm:px-5 ${
              !isAutoCalling
                ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-600"
                : "cursor-pointer bg-white text-red-600 shadow-md hover:bg-red-50"
            }`}
          >
            <CircleMinus className="h-4 w-4 shrink-0" />
            <span className="sm:hidden">Stop Call</span>
            <span className="hidden sm:inline">Stop Auto Calling</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
