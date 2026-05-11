
import { Textarea as HeadlessTextarea } from "@headlessui/react";
import clsx from "clsx";
import { TextareaHTMLAttributes, useId } from "react";

export function Textarea({
  label,
  error,
  className,
  wrapperClassName,
  labelClassName,
  id,
  rows = 4,
  ...props
}: Props) {
  const generatedId = useId();
  const textareaId = id || generatedId;

  return (
    <div className={clsx("flex w-full flex-col gap-1", wrapperClassName)}>
      {label && (
        <label
          htmlFor={textareaId}
          className={clsx("text-sm font-medium", labelClassName)}
        >
          {label}
        </label>
      )}

      <HeadlessTextarea
        id={textareaId}
        rows={rows}
        className={clsx(
          "resize-none rounded border bg-white px-4 py-2 text-slate-700 transition focus:border-indigo-500 focus:outline-none dark:bg-gray-800 dark:text-slate-200 dark:focus:border-indigo-400",
          error ? "border-red-500" : "border-gray-300 dark:border-gray-600",
          className,
        )}
        {...props}
      />

      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
  wrapperClassName?: string;
  labelClassName?: string;
};
