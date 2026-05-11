

import { Button } from "@/components/ui";
import type { Lead } from "../_lib/data";
import { SkipForward } from "lucide-react";
import { CallsLogo } from "./CallsLogo";
import { LeadSelector } from "./LeadSelector";

type Props = {
  leads: Lead[];
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
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <CallsLogo />

          <div className="h-5 w-px bg-slate-200 dark:bg-gray-700" />

          <LeadSelector
            leads={leads}
            currentIndex={currentIndex}
            onSelect={onSelectLead}
          />
        </div>

        <Button
          onClick={onSkip}
          className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 cursor-pointer"
        >
          Skip
          <SkipForward className="h-3.5 w-3.5" />
        </Button>
      </div>
    </header>
  );
}
