

import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import type { SyntheticEvent } from "react";
import type { SmsStatus } from "../_lib/data";
import { AgentSmsStatusBadge } from "./AgentSmsStatusBadge";

const cellInputClass =
  "h-8 min-w-[8rem] w-full rounded-lg border border-transparent bg-transparent px-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:bg-slate-50 focus:border-slate-200 focus:bg-white focus:text-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500 dark:hover:bg-slate-800/70 dark:focus:border-slate-700 dark:focus:bg-slate-900";

const cellButtonClass =
  "flex h-8 w-full min-w-[8rem] items-center justify-between gap-2 rounded-lg border border-transparent bg-transparent px-2 py-1 text-left text-sm text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-0 dark:text-slate-200 dark:hover:bg-slate-800/70";

const readTextClass =
  "block min-h-8 px-2.5 py-1.5 text-sm text-slate-700 dark:text-slate-200";

function stopCellClick(event: SyntheticEvent) {
  event.stopPropagation();
}

export function AgentSmsReadText({
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

export function AgentSmsEditableTrigger({
  children,
  onClick,
}: {
  children: React.ReactNode;
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

export function AgentSmsInlineTextCell({
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

function PickerPlaceholder({ label }: { label: string }) {
  return (
    <span className="truncate px-0.5 text-slate-400 dark:text-slate-500">
      {label}
    </span>
  );
}

export function AgentSmsStatusEditor({
  value,
  options,
  onChange,
}: {
  value: SmsStatus;
  options: Array<{ label: string; value: SmsStatus }>;
  onChange: (value: SmsStatus) => void;
}) {
  return (
    <div onClick={stopCellClick}>
      <Listbox value={value} onChange={onChange}>
        <div className="relative min-w-[10rem]">
          <ListboxButton className={cellButtonClass}>
            {value ? (
              <AgentSmsStatusBadge status={value} />
            ) : (
              <PickerPlaceholder label="Select status" />
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
                <AgentSmsStatusBadge status={option.value} />
              </ListboxOption>
            ))}
          </ListboxOptions>
        </div>
      </Listbox>
    </div>
  );
}
