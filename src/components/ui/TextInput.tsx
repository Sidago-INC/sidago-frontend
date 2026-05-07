
import clsx from "clsx";
import { InputHTMLAttributes, useId } from "react";

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  wrapperClassName?: string;
  labelClassName?: string;
};

export function TextInput({
  label,
  error,
  className,
  wrapperClassName,
  labelClassName,
  id,
  type = "text",
  ...props
}: TextInputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className={clsx("flex w-full flex-col gap-1", wrapperClassName)}>
      {label && (
        <label htmlFor={inputId} className={clsx("text-sm font-medium", labelClassName)}>
          {label}
        </label>
      )}

      <input
        id={inputId}
        type={type}
        className={clsx(
          "w-full rounded border bg-white px-3 py-1.5 text-sm text-slate-700 transition focus:border-indigo-500 focus:outline-none dark:bg-gray-800 dark:text-slate-200 dark:focus:border-indigo-400",
          error ? "border-red-500" : "border-gray-300 dark:border-gray-600",
          className,
        )}
        {...props}
      />

      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
