import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { useId } from "react";
import ReactDatePicker from "react-datepicker";
import { selectLikeFieldClassName, datePickerInputProps, datePickerPopperConfig } from "./datePickerInputStyles";

type DatePickerFieldProps = {
  label?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  labelClassName?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
};

function parseDateValue(value: string) {
  const trimmedValue = value.trim();
  if (!trimmedValue) return null;

  const date = new Date(trimmedValue);
  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function formatDateValue(value: Date | null) {
  if (!value || Number.isNaN(value.getTime())) return "";
  return value.toISOString().slice(0, 10);
}

export function DatePickerField({
  label,
  error,
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  labelClassName,
  disabled,
  minDate,
  maxDate,
}: DatePickerFieldProps) {
  const id = useId();
  const hasValue = Boolean(value.trim());

  return (
    <div className="flex w-full flex-col gap-1">
      {label && (
        <label
          htmlFor={id}
          className={clsx("text-sm font-medium", labelClassName)}
        >
          {label}
        </label>
      )}

      <div className="relative w-full">
        <ReactDatePicker
          {...datePickerInputProps}
          {...datePickerPopperConfig}
          id={id}
          name={`date-field-${id.replace(/:/g, "")}`}
          selected={parseDateValue(value)}
          onChange={(date: Date | null) => onChange(formatDateValue(date))}
          placeholderText={placeholder}
          isClearable
          disabled={disabled}
          minDate={minDate}
          maxDate={maxDate}
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

      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
