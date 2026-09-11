
import { EmailLink } from "@/components/ui/EmailLink";
import clsx from "clsx";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type TextareaHTMLAttributes,
} from "react";

type EmailInputProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "value" | "onChange" | "rows"
> & {
  value: string;
  onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  label?: string;
  error?: string;
  wrapperClassName?: string;
  labelClassName?: string;
};

function resizeTextarea(element: HTMLTextAreaElement) {
  element.style.height = "auto";
  element.style.height = `${element.scrollHeight}px`;
}

export function EmailInput({
  value,
  onChange,
  readOnly = false,
  disabled = false,
  className,
  label,
  error,
  wrapperClassName,
  labelClassName,
  placeholder,
  id,
  ...props
}: EmailInputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [editing, setEditing] = useState(false);
  const canEdit = Boolean(onChange) && !readOnly && !disabled;
  const trimmed = value.trim();
  const showEditor = canEdit && (editing || !trimmed);

  useEffect(() => {
    if (!showEditor) return;
    const element = textareaRef.current;
    if (!element) return;
    resizeTextarea(element);
  }, [showEditor, value]);

  useEffect(() => {
    if (!editing) return;
    const element = textareaRef.current;
    if (!element) return;
    element.focus();
    element.setSelectionRange(element.value.length, element.value.length);
  }, [editing]);

  return (
    <div className={clsx("flex min-w-0 w-full flex-col gap-1", wrapperClassName)}>
      {label ? (
        <label
          htmlFor={inputId}
          className={clsx("text-sm font-medium", labelClassName)}
        >
          {label}
        </label>
      ) : null}

      {showEditor ? (
        <textarea
          {...props}
          id={inputId}
          ref={textareaRef}
          value={value}
          rows={1}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(event) => {
            resizeTextarea(event.currentTarget);
            onChange?.(event);
          }}
          onBlur={() => setEditing(false)}
          className={clsx(
            "w-full resize-none rounded border bg-white px-3 py-1.5 text-sm leading-5 text-slate-700 transition focus:border-indigo-500 focus:outline-none dark:bg-gray-800 dark:text-slate-200 dark:focus:border-indigo-400",
            error ? "border-red-500" : "border-gray-300 dark:border-gray-600",
            className,
          )}
        />
      ) : (
        <div
          id={canEdit ? undefined : inputId}
          role={canEdit ? "textbox" : undefined}
          tabIndex={canEdit ? 0 : undefined}
          aria-label={label || "Email"}
          aria-readonly={canEdit ? undefined : true}
          onClick={(event) => {
            if (!canEdit) return;
            if ((event.target as HTMLElement).closest("a")) return;
            setEditing(true);
          }}
          onKeyDown={(event) => {
            if (!canEdit) return;
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setEditing(true);
            }
          }}
          className={clsx(
            "w-full rounded border bg-white px-3 py-1.5 text-sm leading-5 text-slate-700 dark:bg-gray-800 dark:text-slate-200",
            "whitespace-normal break-words",
            error ? "border-red-500" : "border-gray-300 dark:border-gray-600",
            canEdit ? "cursor-text" : "cursor-default",
            className,
          )}
        >
          {trimmed ? (
            <EmailLink value={value} />
          ) : (
            <span className="font-normal text-slate-400 dark:text-slate-500">
              {placeholder || "\u00a0"}
            </span>
          )}
        </div>
      )}

      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </div>
  );
}
