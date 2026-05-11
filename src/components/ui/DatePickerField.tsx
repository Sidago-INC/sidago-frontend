

import { DatePicker } from "./DatePicker";

type DatePickerFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

function parseDateValue(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  const date = new Date(trimmedValue);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date;
}

function formatDateValue(value: Date | undefined) {
  if (!value || Number.isNaN(value.getTime())) {
    return "";
  }

  return value.toISOString().slice(0, 10);
}

export function DatePickerField({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
}: DatePickerFieldProps) {
  return (
    <DatePicker
      value={parseDateValue(value)}
      onChange={(nextValue) => onChange(formatDateValue(nextValue))}
      placeholder={placeholder}
      className={className}
    />
  );
}
