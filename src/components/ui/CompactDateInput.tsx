import clsx from "clsx";
import { forwardRef } from "react";

type CompactDateInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const CompactDateInput = forwardRef<HTMLInputElement, CompactDateInputProps>(
  function CompactDateInput({ value, className, placeholder, ...props }, ref) {
    const text = String(value ?? "").trim();
    const placeholderText = String(placeholder ?? "").trim();
    const size =
      text.length > 0 ? text.length : Math.max(placeholderText.length, 12);

    return (
      <input
        {...props}
        ref={ref}
        value={value}
        placeholder={placeholder}
        size={size}
        className={clsx(className, "!w-auto !min-w-0 !px-2 !pr-6")}
      />
    );
  },
);
