import { Select } from "@/components/ui/Select";
import type { Lead } from "../_lib/data";

type Props = {
  leads: Lead[];
  currentIndex: number;
  onSelect: (index: number) => void;
};

export function LeadSelector({ leads, currentIndex, onSelect }: Props) {
  const options = leads.map((lead, index) => ({
    value: index,
    label: lead.lead_id || lead.full_name,
  }));

  return (
    <div className="flex min-w-0 items-center gap-2">
      <label className="whitespace-nowrap text-xs font-medium text-slate-400 dark:text-gray-500">
        Lead
      </label>
      <Select
        value={currentIndex}
        options={options}
        placeholder="Select lead"
        onChange={(value) => onSelect(Number(value))}
        className="max-w-55 cursor-pointer truncate rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 transition focus:outline-none focus:ring-0 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
      />
      <span className="whitespace-nowrap text-xs font-medium text-slate-400 dark:text-gray-500">
        {currentIndex + 1} / {leads.length}
      </span>
    </div>
  );
}
