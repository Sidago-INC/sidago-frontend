

import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import clsx from "clsx";
import { Check, Ellipsis, X } from "lucide-react";
import { type Dispatch, type SetStateAction } from "react";
import { Select } from "../Select";
import type { GroupRule, SelectableColumn, SortDirection } from "./types";

interface GroupPanelProps {
  groupRules: GroupRule[];
  setGroupRules: Dispatch<SetStateAction<GroupRule[]>>;
  /**
   * Levels this grid can group by. Server grids cap at 2 — the API groups on
   * at most two columns, and a third is not renderable in a useful way.
   */
  maxLevels?: number;
  showCounts: boolean;
  setShowCounts: Dispatch<SetStateAction<boolean>>;
  selectableColumns: SelectableColumn[];
  buttonClassName: string;
}

const DIRECTION_OPTIONS = [
  { label: "First to Last", value: "asc" },
  { label: "Last to First", value: "desc" },
];

export function GroupPanel({
  groupRules,
  setGroupRules,
  maxLevels = Number.POSITIVE_INFINITY,
  showCounts,
  setShowCounts,
  selectableColumns,
  buttonClassName,
}: GroupPanelProps) {
  return (
    <Popover className="relative">
      <PopoverButton className={buttonClassName}>
        Group
        {groupRules.length > 0 && (
          <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-md bg-slate-800 px-1.5 py-0.5 text-[11px] font-semibold text-white">
            {groupRules.length}
          </span>
        )}
      </PopoverButton>

      <PopoverPanel
        anchor="bottom end"
        className="z-50 w-screen md:w-2xl border border-slate-200 shadow-2xl bg-white rounded-xl p-2 text-sm backdrop-blur-md transition-colors dark:border-slate-600 dark:bg-slate-950/70 flex flex-col overflow-visible"
      >
        <div className="space-y-3">
          {groupRules.length > 0 ? (
            groupRules.map((groupRule, index) => (
              <div
                key={`${groupRule.field}-${index}`}
                className="grid w-full min-w-0 gap-4 md:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center"
              >
                <span className="w-16 shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">
                  {index === 0 ? "Group by" : "then by"}
                </span>
                <div className="min-w-0 flex-1">
                  <Select
                    value={groupRule.field}
                    onChange={(value) =>
                      setGroupRules((current) =>
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
                    value={groupRule.direction}
                    onChange={(value) =>
                      setGroupRules((current) =>
                        current.map((item, i) =>
                          i === index
                            ? { ...item, direction: value as SortDirection }
                            : item,
                        ),
                      )
                    }
                    options={DIRECTION_OPTIONS}
                    placeholder=""
                    className="h-8 rounded text-xs w-full min-w-0"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0 md:justify-self-end">
                  <Popover className="relative">
                    <PopoverButton className="flex items-center justify-center h-9 w-9 rounded-lg outline-0 ring-0 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900">
                      <Ellipsis size={16} />
                    </PopoverButton>

                    <PopoverPanel
                      anchor="bottom end"
                      className="z-50 w-72 max-w-[90vw] border border-slate-200 shadow-2xl bg-white rounded-xl p-2 backdrop-blur-md transition-colors dark:border-slate-600 dark:bg-slate-950/70 flex flex-col overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setShowCounts(false)}
                        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
                      >
                        <span>Hide record counts for groups</span>
                        {!showCounts && (
                          <Check
                            size={16}
                            className="text-slate-700 dark:text-slate-200"
                          />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowCounts(true)}
                        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
                      >
                        <span>Show record counts for groups</span>
                        {showCounts && (
                          <Check
                            size={16}
                            className="text-slate-700 dark:text-slate-200"
                          />
                        )}
                      </button>
                    </PopoverPanel>
                  </Popover>

                  <button
                    type="button"
                    onClick={() =>
                      setGroupRules((current) =>
                        current.filter((_, i) => i !== index),
                      )
                    }
                    className="flex items-center cursor-pointer justify-center h-9 w-9 rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-900 dark:hover:text-slate-200"
                    aria-label="Remove group"
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
                    setGroupRules(
                      value
                        ? [{ field: value as string, direction: "asc" }]
                        : [],
                    )
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
                    setGroupRules((current) =>
                      current.length === 0
                        ? current
                        : current.map((item, i) =>
                            i === 0
                              ? { ...item, direction: value as SortDirection }
                              : item,
                          ),
                    )
                  }
                  options={DIRECTION_OPTIONS}
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
            onClick={() => setGroupRules([])}
            className={clsx(
              "cursor-pointer flex w-full min-w-0 items-center rounded px-3 py-2 text-left text-sm transition",
              "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900",
              groupRules.length === 0 &&
                "bg-slate-100 font-medium dark:bg-slate-900",
            )}
          >
            <span className="truncate">No grouping</span>
          </button>
          {selectableColumns.map((column) => (
            <button
              key={column.value}
              type="button"
              disabled={
                groupRules.length >= maxLevels &&
                !groupRules.some((item) => item.field === column.value)
              }
              title={
                groupRules.length >= maxLevels &&
                !groupRules.some((item) => item.field === column.value)
                  ? `Remove a level first — grouping goes ${maxLevels} deep`
                  : undefined
              }
              onClick={() =>
                setGroupRules((current) =>
                  current.some((item) => item.field === column.value) ||
                  current.length >= maxLevels
                    ? current
                    : [...current, { field: column.value, direction: "asc" }],
                )
              }
              className={clsx(
                "flex w-full min-w-0 items-center rounded px-3 py-2 text-left text-sm transition",
                "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900",
                "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent",
                groupRules.some((item) => item.field === column.value) &&
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
