import clsx from "clsx";
import { BooleanCheckBadge } from "@/components/ui";
import { Check } from "lucide-react";
import type { ReactNode, SyntheticEvent } from "react";

const cellInputClass =
  "h-8 min-w-[8rem] w-full rounded-lg border border-transparent bg-transparent px-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:bg-slate-50 focus:border-slate-200 focus:bg-white focus:text-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500 dark:hover:bg-slate-800/70 dark:focus:border-slate-700 dark:focus:bg-slate-900";

const readTextClass =
  "block min-h-8 px-2.5 py-1.5 text-sm text-slate-700 dark:text-slate-200";

function stopCellClick(event: SyntheticEvent) {
  event.stopPropagation();
}

export function AgentEmailReadText({
  value,
  placeholder = "-",
}: {
  value: string;
  placeholder?: string;
}) {
  if (!value.trim()) {
    return (
      <span
        className={clsx(readTextClass, "text-slate-400 dark:text-slate-500")}
      >
        {placeholder}
      </span>
    );
  }

  return <span className={readTextClass}>{value}</span>;
}

export function AgentEmailEditableTrigger({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className="block min-h-8 w-full cursor-pointer rounded-lg text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/70"
    >
      {children}
    </button>
  );
}

export function AgentEmailInlineTextCell({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onClick={stopCellClick}
      onChange={(event) => onChange(event.target.value)}
      className={cellInputClass}
    />
  );
}

export function AgentEmailBooleanEditor({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onChange(!checked);
      }}
      className={
        checked
          ? "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-emerald-200 bg-emerald-100 text-emerald-700 transition hover:bg-emerald-200 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
          : "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-400 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500 dark:hover:bg-slate-700"
      }
      aria-label={checked ? "Yes" : "No"}
      title={checked ? "Yes" : "No"}
    >
      <Check className="h-4 w-4" />
    </button>
  );
}

export function AgentEmailBooleanRead({ checked }: { checked: boolean }) {
  return (
    <div className="px-2.5 py-1.5">
      <BooleanCheckBadge checked={checked} />
    </div>
  );
}
