import clsx from "clsx";
import { getTimezoneBadgeStyle } from "@/types/timezone.types";

/**
 * Narrows the call queue to one timezone.
 *
 * "All" is the normal queue, ordered by compute_timezone_priority(). Picking a
 * timezone lets an agent work it outside its priority window — e.g. PST at
 * 6pm EST, when MST is ranked first. INTL is left out: the queue never
 * returns it.
 */
export const QUEUE_TIMEZONES = ["EST", "CST", "MST", "PST"] as const;
export type QueueTimezone = (typeof QUEUE_TIMEZONES)[number];

type Props = {
  value: QueueTimezone | null;
  onChange: (value: QueueTimezone | null) => void;
};

export function QueueTimezoneFilter({ value, onChange }: Props) {
  const options: { value: QueueTimezone | null; label: string }[] = [
    { value: null, label: "All" },
    ...QUEUE_TIMEZONES.map((tz) => ({ value: tz, label: tz })),
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Filter queue by timezone"
      className="flex shrink-0 items-center gap-1"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.label}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={clsx(
              "min-h-8 cursor-pointer rounded-md border px-2.5 text-xs font-medium transition-colors",
              selected
                ? option.value
                  ? getTimezoneBadgeStyle(option.value)
                  : "border-slate-700 bg-slate-700 text-white dark:border-slate-200 dark:bg-slate-200 dark:text-slate-900"
                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:bg-gray-900 dark:text-slate-400 dark:hover:bg-gray-800",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
