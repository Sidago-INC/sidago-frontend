

import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import clsx from "clsx";
import { X } from "lucide-react";
import { type Dispatch, type SetStateAction } from "react";
import { Select } from "../Select";
import type { SelectableColumn, SortDirection, SortRule } from "./types";
import { createSortRule } from "./utils";

interface SortPanelProps {
  sortRules: SortRule[];
  setSortRules: Dispatch<SetStateAction<SortRule[]>>;
  selectableColumns: SelectableColumn[];
  buttonClassName: string;
}

const SORT_DIRECTION_OPTIONS = [
  { label: "A to Z", value: "asc" },
  { label: "Z to A", value: "desc" },
];

export function SortPanel({
  sortRules,
  setSortRules,
  selectableColumns,
  buttonClassName,
}: SortPanelProps) {
  return (
    <Popover className="relative">
      <PopoverButton className={buttonClassName}>
        Sort
        {sortRules.length > 0 && (
          <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-md bg-slate-800 px-1.5 py-0.5 text-[11px] font-semibold text-white">
            {sortRules.length}
          </span>
        )}
      </PopoverButton>

      <PopoverPanel
        anchor="bottom end"
        className="w-screen md:w-2xl border border-slate-200 shadow-2xl bg-white rounded-xl p-2 backdrop-blur-md transition-colors dark:border-slate-600 dark:bg-slate-950/70 flex flex-col overflow-hidden"
      >
        <div className="space-y-3">
          {sortRules.length > 0 ? (
            sortRules.map((sortRule, index) => (
              <div
                key={`${sortRule.field}-${index}`}
                className="grid w-full min-w-0 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center"
              >
                <div className="min-w-0 flex-1">
                  <Select
                    value={sortRule.field}
                    onChange={(value) =>
                      setSortRules((current) =>
                        current.map((item, i) =>
                          i === index
                            ? { ...item, field: value as string }
                            : item,
                        ),
                      )
                    }
                    options={selectableColumns}
                    placeholder=""
                    className="h-8 rounded text-xs w-full min-w-0"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <Select
                    value={sortRule.direction}
                    onChange={(value) =>
                      setSortRules((current) =>
                        current.map((item, i) =>
                          i === index
                            ? { ...item, direction: value as SortDirection }
                            : item,
                        ),
                      )
                    }
                    options={SORT_DIRECTION_OPTIONS}
                    placeholder=""
                    className="h-8 rounded text-xs w-full min-w-0"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0 md:justify-self-end">
                  <button
                    type="button"
                    onClick={() =>
                      setSortRules((current) =>
                        current.filter((_, i) => i !== index),
                      )
                    }
                    className="flex items-center cursor-pointer justify-center h-9 w-9 rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-900 dark:hover:text-slate-200"
                    aria-label="Remove sort"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="grid w-full min-w-0 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center">
              <div className="min-w-0 flex-1">
                <Select
                  value=""
                  onChange={(value) =>
                    setSortRules(value ? [createSortRule(value as string)] : [])
                  }
                  options={selectableColumns}
                  placeholder=""
                  className="h-8 rounded text-xs w-full min-w-0"
                />
              </div>

              <div className="min-w-0 flex-1">
                <Select
                  value="asc"
                  onChange={(value) =>
                    setSortRules((current) =>
                      current.length === 0
                        ? current
                        : current.map((item, i) =>
                            i === 0
                              ? { ...item, direction: value as SortDirection }
                              : item,
                          ),
                    )
                  }
                  options={SORT_DIRECTION_OPTIONS}
                  placeholder=""
                  className="h-8 rounded text-xs w-full min-w-0"
                />
              </div>
            </div>
          )}
        </div>

        <div className="mt-3 max-h-[40vh] space-y-1 overflow-y-auto overflow-x-hidden border-t border-slate-200 pt-3 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setSortRules([])}
            className={clsx(
              "flex w-full min-w-0 items-center rounded px-3 py-2 text-left text-sm transition cursor-pointer",
              "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900",
              sortRules.length === 0 &&
                "bg-slate-100 font-medium dark:bg-slate-900",
            )}
          >
            <span className="truncate">No sort</span>
          </button>
          {selectableColumns.map((column) => (
            <button
              key={column.value}
              type="button"
              onClick={() =>
                setSortRules((current) =>
                  current.some((item) => item.field === column.value)
                    ? current
                    : [...current, createSortRule(column.value)],
                )
              }
              className={clsx(
                "flex w-full min-w-0 items-center rounded px-3 py-2 text-left text-sm transition cursor-pointer",
                "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900",
                sortRules.some((item) => item.field === column.value) &&
                  "bg-slate-100 font-medium dark:bg-slate-900",
              )}
            >
              <span className="truncate">{column.label}</span>
            </button>
          ))}
        </div>
      </PopoverPanel>
    </Popover>
  );
}
