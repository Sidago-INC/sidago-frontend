

import { EmailLink } from "@/components/ui/EmailLink";
import { isValidElement, useState } from "react";

type EditableFieldProps = {
  label: string;
  children: React.ReactNode;
  align?: "row" | "stack";
};

export function EditableField({
  label,
  children,
  align = "row",
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const preview = getEditablePreview(label, children);

  return (
    <div
      className={
        align === "stack"
          ? "space-y-1 py-2"
          : "flex items-center justify-between gap-4 py-1.5"
      }
    >
      <p className="shrink-0 text-[10px] uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <div className={align === "stack" ? "w-full" : "w-64 max-w-[65%]"}>
        {isEditing ? (
          children
        ) : (
          <div
            role="button"
            tabIndex={0}
            onClick={() => setIsEditing(true)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setIsEditing(true);
              }
            }}
            className={`w-full cursor-text rounded border border-gray-300 bg-white text-xs font-semibold text-slate-600 transition focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-slate-200 ${
              align === "stack"
                ? "min-h-24.5 px-3 py-2 text-left whitespace-pre-line"
                : "min-h-7.5 px-3 py-1.5 text-left truncate"
            }`}
          >
            {preview}
          </div>
        )}
      </div>
    </div>
  );
}

function getEditablePreview(
  label: string,
  children: React.ReactNode,
): React.ReactNode {
  if (!isValidElement(children)) return <EmptyPreview label={label} />;

  const props = children.props as {
    value?: unknown;
    checked?: boolean;
    options?: Array<{ label: string; value: string | number }>;
  };

  if (typeof props.checked === "boolean") {
    return props.checked ? "Yes" : "No";
  }

  const value = props.value == null ? "" : String(props.value);
  if (!value) return <EmptyPreview label={label} />;

  if (label.toLowerCase().includes("email")) {
    return <EmailLink value={value} />;
  }

  const option = props.options?.find((item) => String(item.value) === value);
  return option?.label ?? value;
}

function EmptyPreview({ label }: { label: string }) {
  return <span aria-label={`Empty ${label}`} className="block" />;
}
