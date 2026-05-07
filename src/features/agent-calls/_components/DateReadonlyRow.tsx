import { LucideIcon } from "lucide-react";

type Props = {
  icon: LucideIcon;
  label: string;
  value: string;
};

export function DateReadonlyRow({ icon: Icon, label, value }: Props) {
  return (
    <div className="border-t border-slate-100 pt-2 dark:border-gray-700">
      <p className="mb-0.5 flex items-center gap-1 text-xs text-slate-400 dark:text-gray-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className="text-sm font-medium text-slate-700 dark:text-gray-300">
        {value || "-"}
      </p>
    </div>
  );
}
