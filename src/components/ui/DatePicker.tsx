import clsx from "clsx";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { CalendarDays, X } from "lucide-react";
import { DayPicker } from "react-day-picker";

type DatePickerProps = {
  value?: Date;
  onChange: (value: Date | undefined) => void;
  placeholder?: string;
  className?: string;
};

function formatDate(date?: Date) {
  if (!date) {
    return "";
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
}: DatePickerProps) {
  const hasValue = Boolean(value);

  return (
    <Popover className="relative">
      <PopoverButton
        className={clsx(
          "flex h-10 w-full items-center justify-between gap-3 rounded-md border bg-white px-3 text-left text-xs transition focus:outline-none dark:bg-slate-900",
          hasValue
            ? "border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-100"
            : "border-slate-200 text-slate-400 dark:border-slate-700 dark:text-slate-500",
          className,
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <CalendarDays className="h-4 w-4 shrink-0" />
          <span className="truncate">
            {hasValue ? formatDate(value) : placeholder}
          </span>
        </span>
        <span className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 dark:text-slate-500">
          <X className={clsx("h-4 w-4", !hasValue && "opacity-0")} />
        </span>
      </PopoverButton>

      <PopoverPanel
        anchor="bottom start"
        className="z-[320] mt-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-slate-700 dark:bg-slate-950"
      >
        {({ close }) => (
          <>
            {hasValue ? (
              <div className="mb-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    onChange(undefined);
                    close();
                  }}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear
                </button>
              </div>
            ) : null}
            <DayPicker
              mode="single"
              selected={value}
              onSelect={(date) => {
                onChange(date);
                if (date) close();
              }}
              showOutsideDays
              className="rdp-custom"
              classNames={{
                month: "space-y-4",
                month_caption:
                  "flex items-center justify-center pb-1 text-sm font-semibold text-slate-900 dark:text-slate-100",
                weekdays: "grid grid-cols-7 gap-1",
                weekday:
                  "flex h-8 items-center justify-center text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500",
                week: "grid grid-cols-7 gap-1",
                day: "h-9 w-9 text-xs",
                day_button:
                  "h-9 w-9 cursor-pointer rounded-xl text-xs text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
                today: "font-semibold text-indigo-700 dark:text-indigo-300",
                selected:
                  "bg-indigo-600 text-white hover:bg-indigo-600 dark:bg-indigo-500 dark:text-white dark:hover:bg-indigo-500",
                outside: "text-slate-300 dark:text-slate-700",
                chevron: "fill-slate-500 dark:fill-slate-400",
              }}
            />
          </>
        )}
      </PopoverPanel>
    </Popover>
  );
}
