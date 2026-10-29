import clsx from "clsx";
import { getTimezoneBadgeStyle } from "@/types/timezone.types";

/**
 * Narrows the call queue to one timezone.
 *
 * "All" is the normal queue, ordered by compute_timezone_priority(). Picking a
 * timezone lets an agent work it outside its priority window — e.g. PST at
 * 6pm EST, when MST is ranked first. INTL is deliberately absent: those leads
 * are opted out and must never be shown to agents, and the backend rejects
 * timezone=INTL.
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
      // Phones: a full-width segmented control, one equal cell per option so
      // all five fit on one row. sm and up: the compact inline pill row.
      className="grid w-full grid-cols-5 gap-1 rounded-lg bg-slate-100 p-1 sm:flex sm:w-auto sm:shrink-0 sm:items-center sm:bg-transparent sm:p-0 dark:bg-gray-800 sm:dark:bg-transparent"
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
              "min-h-9 cursor-pointer rounded-md border px-1 text-xs font-medium transition-colors sm:min-h-8 sm:px-2.5",
              selected
                ? clsx(
                    "shadow-sm sm:shadow-none",
                    option.value
                      ? getTimezoneBadgeStyle(option.value)
                      : "border-slate-700 bg-slate-700 text-white dark:border-slate-200 dark:bg-slate-200 dark:text-slate-900",
                  )
                : "border-transparent bg-transparent text-slate-500 hover:bg-white sm:border-slate-200 sm:bg-white sm:hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-gray-900 sm:dark:border-slate-700 sm:dark:bg-gray-900 sm:dark:hover:bg-gray-800",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
