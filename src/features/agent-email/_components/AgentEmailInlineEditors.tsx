

import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import clsx from "clsx";
import { BooleanCheckBadge, EmailPriorityBadge } from "@/components/ui";
import { Check, ChevronDown } from "lucide-react";
import type { ReactNode, SyntheticEvent } from "react";
import type { EmailPriority } from "../_lib/data";

const cellInputClass =
  "h-8 min-w-[8rem] w-full rounded-lg border border-transparent bg-transparent px-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:bg-slate-50 focus:border-slate-200 focus:bg-white focus:text-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500 dark:hover:bg-slate-800/70 dark:focus:border-slate-700 dark:focus:bg-slate-900";

const cellButtonClass =
  "flex h-8 w-full min-w-[8rem] items-center justify-between gap-2 rounded-lg border border-transparent bg-transparent px-2 py-1 text-left text-sm text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-0 dark:text-slate-200 dark:hover:bg-slate-800/70";

const readTextClass =
  "block min-h-8 px-2.5 py-1.5 text-sm text-slate-700 dark:text-slate-200";

function stopCellClick(event: SyntheticEvent) {
  event.stopPropagation();
}

function PickerPlaceholder({ label }: { label: string }) {
  return (
    <span className="truncate px-0.5 text-slate-400 dark:text-slate-500">
      {label}
    </span>
  );
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

export function AgentEmailPriorityEditor({
  value,
  options,
  onChange,
}: {
  value: EmailPriority;
  options: Array<{ label: string; value: EmailPriority }>;
  onChange: (value: EmailPriority) => void;
}) {
  return (
    <div onClick={stopCellClick}>
      <Listbox value={value} onChange={onChange}>
        <div className="relative min-w-[9rem]">
          <ListboxButton className={cellButtonClass}>
            {value ? (
              <EmailPriorityBadge value={value} />
            ) : (
              <PickerPlaceholder label="Select priority" />
            )}
            <ChevronDown size={14} className="shrink-0 text-slate-400" />
          </ListboxButton>
          <ListboxOptions
            anchor="bottom start"
            className="z-[300] mt-1 max-h-72 w-[var(--button-width)] overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl [--anchor-gap:0.25rem] dark:border-slate-700 dark:bg-slate-950"
          >
            {options.map((option) => (
              <ListboxOption
                key={option.value}
                value={option.value}
                className={({ focus }) =>
                  clsx(
                    "cursor-pointer rounded-lg px-3 py-2",
                    focus && "bg-indigo-50 dark:bg-slate-800",
                  )
                }
              >
                <EmailPriorityBadge value={option.value} />
              </ListboxOption>
            ))}
          </ListboxOptions>
        </div>
      </Listbox>
    </div>
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
