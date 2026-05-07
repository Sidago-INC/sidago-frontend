import { CalendarDays } from "lucide-react";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export function DatePickerField({ label, value, onChange }: Props) {
  return (
    <div>
      <p className="mb-1 text-xs text-slate-400 dark:text-gray-500">{label}</p>
      <div className="relative">
        <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-gray-500" />
        <input
          type="date"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 transition focus:outline-none ring-0 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
        />
      </div>
    </div>
  );
}
