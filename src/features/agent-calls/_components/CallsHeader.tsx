

import { Button } from "@/components/ui";
import type { QueueLead } from "../_lib/apiTypes";
import { SkipForward } from "lucide-react";
import { CallsLogo } from "./CallsLogo";
import { LeadSelector } from "./LeadSelector";

type Props = {
  leads: QueueLead[];
  currentIndex: number;
  onSelectLead: (value: number) => void;
  onSkip: () => void;
};

export function CallsHeader({
  leads,
  currentIndex,
  onSelectLead,
  onSkip,
}: Props) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="flex min-h-14 items-center gap-2 px-4 py-2 sm:gap-4">
        <CallsLogo className="hidden sm:flex" />

        <div className="hidden h-5 w-px shrink-0 bg-slate-200 sm:block dark:bg-gray-700" />

        <LeadSelector
          leads={leads}
          currentIndex={currentIndex}
          onSelect={onSelectLead}
        />

        <Button
          onClick={onSkip}
          aria-label="Skip lead"
          className="flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-slate-100 px-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200 sm:min-w-0 sm:px-3 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <span className="hidden sm:inline">Skip</span>
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
