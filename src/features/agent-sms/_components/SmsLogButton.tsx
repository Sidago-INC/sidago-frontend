

import { Check } from "lucide-react";

type SmsLogButtonProps = {
  checked: boolean;
  onToggle: () => void;
};

export function SmsLogButton({ checked, onToggle }: SmsLogButtonProps) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      className={
        checked
          ? "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-emerald-200 bg-emerald-100 text-emerald-700 transition hover:bg-emerald-200 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
          : "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-400 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500 dark:hover:bg-slate-700"
      }
      aria-label={checked ? "SMS log completed" : "SMS log pending"}
      title={checked ? "SMS log completed" : "SMS log pending"}
    >
      <Check className="h-4 w-4" />
    </button>
  );
}
