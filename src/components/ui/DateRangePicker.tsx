import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import ReactDatePicker from "react-datepicker";
import { formatDateRangeLabel, type DateRange } from "@/types/date-range.types";
import { CompactDateInput } from "./CompactDateInput";
import { selectLikeFieldClassName, datePickerInputProps, datePickerPopperConfig } from "./datePickerInputStyles";

type DateRangePickerProps = {
  value?: DateRange;
  onChange: (value: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
  fullWidth?: boolean;
};

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Pick a date range",
  className,
  fullWidth = true,
}: DateRangePickerProps) {
  const hasValue = Boolean(value?.from || value?.to);
  const displayValue = formatDateRangeLabel(value);

  return (
    <div
      className={clsx(
        "relative",
        fullWidth ? "w-full" : "datepicker-field--compact inline-flex w-auto",
      )}
    >
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
        value={displayValue}
        customInput={fullWidth ? undefined : <CompactDateInput />}
        wrapperClassName={fullWidth ? "w-full" : "w-auto"}
        className={clsx(
          selectLikeFieldClassName,
          fullWidth ? "w-full" : "!w-auto !min-w-0 !px-2",
          className,
        )}
        clearButtonClassName={
          fullWidth ? "!right-7" : "datepicker-field__clear !right-1.5"
        }
      />
      {!hasValue && (
        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
          <ChevronDown size={14} className="text-slate-400" />
        </span>
      )}
    </div>
  );
}
