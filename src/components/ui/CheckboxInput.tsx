

import clsx from "clsx";
import { InputHTMLAttributes, useId } from "react";

type CheckboxInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  label?: string;
  error?: string;
  wrapperClassName?: string;
  labelClassName?: string;
};

export function CheckboxInput({
  label,
  error,
  className,
  wrapperClassName,
  labelClassName,
  id,
  ...props
}: CheckboxInputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className={clsx("flex w-full flex-col gap-1", wrapperClassName)}>
      <label
        htmlFor={inputId}
        className={clsx(
          "flex cursor-pointer items-center justify-between gap-3",
          labelClassName,
        )}
      >
        {label && <span>{label}</span>}
        <input
          id={inputId}
          type="checkbox"
          className={clsx(
            "h-4 w-4 rounded border-gray-300 text-indigo-600 transition focus:border-indigo-500 focus:outline-none focus:ring-0 dark:border-gray-600 dark:focus:border-indigo-400",
            className,
          )}
          {...props}
        />
      </label>

      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
