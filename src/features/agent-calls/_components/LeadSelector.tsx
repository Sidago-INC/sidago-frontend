import { Select } from "@/components/ui/Select";
import type { QueueLead } from "../_lib/apiTypes";

type Props = {
  leads: QueueLead[];
  currentIndex: number;
  onSelect: (index: number) => void;
};

export function LeadSelector({ leads, currentIndex, onSelect }: Props) {
  const options = leads.map((lead, index) => ({
    value: index,
    label: [lead.companySymbol, lead.fullName].filter(Boolean).join(" - "),
  }));

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
      <label className="hidden shrink-0 text-xs font-medium text-slate-400 sm:inline dark:text-gray-500">
        Lead
      </label>
      <Select
        value={currentIndex}
        options={options}
        placeholder="Select lead"
        searchable
        searchPlaceholder="Search leads..."
        onChange={(value) => onSelect(Number(value))}
        className="min-w-0 flex-1 cursor-pointer truncate rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-700 transition focus:outline-none focus:ring-0 sm:max-w-55 sm:px-3 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
      />
      <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-600 sm:text-sm dark:text-gray-300">
        {currentIndex + 1}/{leads.length}
      </span>
    </div>
  );
}
