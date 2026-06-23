import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

type Props = {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
};

export function LeadStatBox({ icon: Icon, label, value }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 sm:px-4 dark:border-gray-600 dark:bg-gray-700/50">
      <p className="mb-0.5 flex items-center gap-1 text-xs font-medium text-slate-400 dark:text-gray-500">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {label}
      </p>
      <p className="text-left text-xs font-semibold leading-snug text-slate-700 sm:text-sm dark:text-gray-200">
        {value}
      </p>
    </div>
  );
}
