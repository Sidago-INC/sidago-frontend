import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import ReactDatePicker from "react-datepicker";
import type { DateRange } from "@/types/date-range.types";
import { selectLikeFieldClassName, datePickerInputProps, datePickerPopperConfig } from "./datePickerInputStyles";

type DateRangePickerProps = {
  value?: DateRange;
  onChange: (value: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
};

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Pick a date range",
  className,
}: DateRangePickerProps) {
  const hasValue = Boolean(value?.from || value?.to);

  return (
    <div className="relative w-full">
      <ReactDatePicker
        {...datePickerInputProps}
        {...datePickerPopperConfig}
        selectsRange
        startDate={value?.from ?? null}
        endDate={value?.to ?? null}
        onChange={(update) => {
          const [start, end] = update as [Date | null, Date | null];
          if (!start && !end) {
            onChange(undefined);
            return;
          }
          onChange({ from: start ?? undefined, to: end ?? undefined });
        }}
        monthsShown={2}
        isClearable
        placeholderText={placeholder}
        dateFormat="yyyy-MM-dd"
        wrapperClassName="w-full"
        className={clsx(selectLikeFieldClassName, className)}
        clearButtonClassName="!right-7"
      />
      {!hasValue && (
        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
          <ChevronDown size={14} className="text-slate-400" />
        </span>
      )}
    </div>
  );
}
