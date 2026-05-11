

import clsx from "clsx";
import { CalendarDays } from "lucide-react";
import { InputHTMLAttributes, useId } from "react";

type DateInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
  error?: string;
  wrapperClassName?: string;
  labelClassName?: string;
  iconClassName?: string;
};

export function DateInput({
  label,
  error,
  className,
  wrapperClassName,
  labelClassName,
  iconClassName,
  id,
  ...props
}: DateInputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className={clsx("flex w-full flex-col gap-1", wrapperClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className={clsx("text-sm font-medium", labelClassName)}
        >
          {label}
        </label>
      )}

      <div className="relative">
        <CalendarDays
          className={clsx(
            "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-gray-500",
            iconClassName,
          )}
        />
        <input
          id={inputId}
          type="date"
          className={clsx(
            "w-full rounded border bg-white py-1.5 pl-9 pr-3 text-sm text-slate-700 transition focus:border-indigo-500 focus:outline-none dark:bg-gray-800 dark:text-slate-200 dark:focus:border-indigo-400",
            error ? "border-red-500" : "border-gray-300 dark:border-gray-600",
            className,
          )}
          {...props}
        />
      </div>

      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
