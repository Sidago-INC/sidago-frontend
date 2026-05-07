
import { Button } from "@/components/ui";
import { Lead } from "@/types";
import { CircleMinus, PlayCircle } from "lucide-react";
import { PingDot } from "./PingDot";

type AutoCallingBannerProps = {
  isAutoCalling: boolean;
  currentLead: Lead;
  onStart: () => void;
  onStop: () => void;
};

export function AutoCallingBanner({
  isAutoCalling,
  currentLead,
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
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-3">
          {isAutoCalling && <PingDot />}
          <span
            className={`text-sm font-semibold ${
              isAutoCalling ? "text-white" : "text-slate-600 dark:text-gray-300"
            }`}
          >
            {isAutoCalling ? "Auto Calling in progress..." : "Auto Calling"}
          </span>
          {isAutoCalling && (
            <span className="hidden text-xs font-medium text-emerald-100 sm:block">
              Calling: {currentLead.full_name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={onStart}
            disabled={isAutoCalling}
            className={`${isAutoCalling ? "hidden sm:flex" : "flex"} items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all sm:px-5 ${
              isAutoCalling
                ? "cursor-not-allowed bg-white/20 text-white/50"
                : "cursor-pointer bg-emerald-500 text-white shadow-md shadow-emerald-200 hover:bg-emerald-400 dark:shadow-emerald-900/40"
            }`}
          >
            <PlayCircle className="h-4 w-4" />
            <span className="sm:hidden">Start Call</span>
            <span className="hidden sm:inline">Start Auto Calling</span>
          </Button>

          <Button
            onClick={onStop}
            disabled={!isAutoCalling}
            className={`flex items-center gap-2 rounded-xl px-4 sm:px-5 py-2 text-sm font-bold transition-all ${
              !isAutoCalling
                ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-600"
                : "bg-white text-red-600 shadow-md hover:bg-red-50 cursor-pointer"
            }`}
          >
            <CircleMinus className="h-4 w-4" />
            <span className="sm:hidden">Stop Call</span>
            <span className="hidden sm:inline">Stop Auto Calling</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
