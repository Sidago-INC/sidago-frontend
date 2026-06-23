import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import ReactDatePicker from "react-datepicker";
import { selectLikeFieldClassName, datePickerInputProps, datePickerPopperConfig } from "./datePickerInputStyles";

type DatePickerProps = {
  value?: Date;
  onChange: (value: Date | undefined) => void;
  placeholder?: string;
  className?: string;
};

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
}: DatePickerProps) {
  const hasValue = Boolean(value);

  return (
    <div className="relative w-full">
      <ReactDatePicker
        {...datePickerInputProps}
        {...datePickerPopperConfig}
        selected={value ?? null}
        onChange={(date: Date | null) => onChange(date ?? undefined)}
        placeholderText={placeholder}
        isClearable
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
