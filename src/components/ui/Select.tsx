import { useId } from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";
import clsx from "clsx";

export type SelectOption = {
  label: string;
  value: string | number;
};

type Props = {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  value?: string | number;
  onChange?: (value: string | number) => void;
  className?: string;
  optionsClassName?: string;
  labelClassName?: string;
  disabled?: boolean;
  floatingOptions?: boolean;
};

export function Select({
  label,
  error,
  className = "",
  options,
  placeholder = "Select an option",
  value,
  onChange,
  optionsClassName,
  labelClassName,
  disabled,
  floatingOptions = false,
}: Props) {
  const id = useId();
  const selected = options.find((o) => String(o.value) === String(value));

  return (
    <div className="flex w-full flex-col gap-1">
      {label && (
        <label htmlFor={id} className={clsx("text-sm font-medium", labelClassName)}>
          {label}
        </label>
      )}

      <Listbox value={value ?? ""} onChange={onChange} disabled={disabled}>
        <div className="relative">
          <ListboxButton
            id={id}
            className={clsx(
              "relative w-full cursor-pointer rounded border bg-white pr-8 text-left text-slate-900 transition focus:border-indigo-500 focus:outline-none dark:bg-gray-800 dark:text-gray-100 dark:focus:border-indigo-400",
              error ? "border-red-500" : "border-gray-300 dark:border-gray-600",
              "px-4 py-2",
              className,
            )}
          >
            <span
              className={clsx(
                "block truncate",
                !selected && "text-slate-400 dark:text-gray-500",
              )}
            >
              {selected ? selected.label : placeholder}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
              <ChevronDown size={14} className="text-slate-400" />
            </span>
          </ListboxButton>

          <ListboxOptions
            anchor={floatingOptions ? "bottom start" : undefined}
            className={clsx(
              floatingOptions
                ? "z-[300] max-h-64 w-[var(--button-width)] overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg [--anchor-gap:0.25rem] dark:border-slate-700 dark:bg-gray-800"
                : "absolute left-0 top-full z-[260] mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-gray-800",
              optionsClassName,
            )}
          >
            {options.map((option) => (
              <ListboxOption
                key={option.value}
                value={option.value}
                className={({ focus }) =>
                  clsx(
                    "relative cursor-pointer select-none px-4 py-2 text-sm",
                    focus
                      ? "bg-indigo-50 text-indigo-700 dark:bg-slate-700 dark:text-indigo-300"
                      : "text-slate-700 dark:text-gray-200",
                  )
                }
              >
                {({ selected: isSelected }) => (
                  <div className="flex items-center justify-between gap-2">
                    <span className={clsx("truncate", isSelected && "font-medium")}>
                      {option.label}
                    </span>
                    {isSelected && <Check size={14} className="shrink-0" />}
                  </div>
                )}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </div>
      </Listbox>

      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
