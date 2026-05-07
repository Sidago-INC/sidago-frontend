import clsx from "clsx";
import React, { InputHTMLAttributes, useId } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({
  label,
  error,
  className = "px-4 py-1.5 rounded border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none transition focus:ring-0 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500",
  type = "text",
  id,
  ...props
}: Props) {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium">
          {label}
        </label>
      )}

      <input
        id={inputId}
        type={type}
        className={clsx(
          className,
          error ? "border-red-500" : "border-gray-300 dark:border-gray-600",
        )}
        {...props}
      />

      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
