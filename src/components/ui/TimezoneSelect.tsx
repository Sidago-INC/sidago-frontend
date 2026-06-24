import { useId } from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";
import clsx from "clsx";
import { TIMEZONE_OPTIONS, type TIMEZONE } from "@/types/timezone.types";
import { TimezoneBadge } from "./Badge";

type TimezoneSelectProps = {
  label?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  value?: string;
  onChange?: (value: TIMEZONE) => void;
  className?: string;
  labelClassName?: string;
  disabled?: boolean;
};

export function TimezoneSelect({
  label,
  error,
  required = false,
  placeholder = "Select time zone",
  value,
  onChange,
  className = "",
  labelClassName,
  disabled,
}: TimezoneSelectProps) {
  const id = useId();
  const selected = TIMEZONE_OPTIONS.find((option) => option.value === value);

  return (
    <div className="flex w-full flex-col gap-1">
      {label ? (
        <label htmlFor={id} className={clsx("text-sm font-medium", labelClassName)}>
          {label}
          {required ? <span className="text-red-500"> *</span> : null}
        </label>
      ) : null}

      <Listbox
        value={value ?? ""}
        onChange={(nextValue) => onChange?.(nextValue as TIMEZONE)}
        disabled={disabled}
      >
        {({ open }) => (
          <div className="relative">
            <ListboxButton
              id={id}
              aria-required={required || undefined}
              className={clsx(
                "relative flex w-full cursor-pointer items-center rounded border bg-white px-3 py-2 text-left shadow-none transition focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 dark:bg-gray-800",
                error ? "border-red-500" : "border-gray-300 dark:border-gray-600",
                className,
              )}
            >
              <span className="flex min-w-0 flex-1 items-center pr-6">
                {selected ? (
                  <TimezoneBadge timezone={selected.value} />
                ) : (
                  <span className="text-sm text-slate-400 dark:text-gray-500">
                    {placeholder}
                  </span>
                )}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                <ChevronDown
                  size={14}
                  className={clsx(
                    "text-slate-400 transition",
                    open && "rotate-180",
                  )}
                />
              </span>
            </ListboxButton>

            {open ? (
              <ListboxOptions className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded border border-gray-300 bg-white py-1 shadow-lg focus:outline-none dark:border-gray-600 dark:bg-gray-800">
                {TIMEZONE_OPTIONS.map((option) => (
                  <ListboxOption
                    key={option.value}
                    value={option.value}
                    className={({ focus }) =>
                      clsx(
                        "relative cursor-pointer select-none px-3 py-2",
                        focus
                          ? "bg-indigo-50 dark:bg-slate-700"
                          : "text-slate-700 dark:text-gray-200",
                      )
                    }
                  >
                    {({ selected: isSelected }) => (
                      <div className="flex items-center justify-between gap-2">
                        <TimezoneBadge timezone={option.value} />
                        {isSelected ? (
                          <Check size={14} className="shrink-0 text-indigo-600" />
                        ) : null}
                      </div>
                    )}
                  </ListboxOption>
                ))}
              </ListboxOptions>
            ) : null}
          </div>
        )}
      </Listbox>

      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </div>
  );
}
