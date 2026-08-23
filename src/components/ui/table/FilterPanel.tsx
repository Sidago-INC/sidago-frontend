

import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import clsx from "clsx";
import { Check, ChevronDown, CircleHelp, Plus, Trash2 } from "lucide-react";
import React, { type Dispatch, type SetStateAction } from "react";
import { DateInput } from "../DateInput";
import { DateRangePicker } from "../DateRangePicker";
import { Input } from "../Input";
import { Select } from "../Select";
import type {
  Column,
  FilterCondition,
  FilterGate,
  FilterItem,
  SelectableColumn,
} from "./types";
import {
  GROUP_DEPTH_CAN_CREATE_CHILD_GROUPS,
  convertFilterValue,
  createFilterGroup,
  createFilterItem,
  getColumnType,
  getDefaultOperatorForColumnType,
  getFilterOperatorOptions,
  isMultiValueOperator,
  operatorNeedsValue,
  parseDateRangeFilterValue,
  parseMultiValue,
  removeFilterItem,
  serializeDateRangeFilterValue,
  serializeMultiValue,
  updateFilterCondition,
  updateFilterGroup,
} from "./utils";

const FILTER_GATE_OPTIONS = [
  { label: "and", value: "AND" },
  { label: "or", value: "OR" },
];

interface FilterConditionRowProps {
  condition: FilterCondition;
  connector: React.ReactNode;
  columnMap: Map<string, Column<unknown>>;
  selectableColumns: SelectableColumn[];
  onChange: (condition: FilterCondition) => void;
  onRemove: () => void;
}

function FilterConditionRow({
  condition,
  connector,
  columnMap,
  selectableColumns,
  onChange,
  onRemove,
}: FilterConditionRowProps) {
  const selectedColumn = columnMap.get(condition.field);
  const selectedColumnType = getColumnType(selectedColumn);
  // A closed set (Timezone, Lead Type, Contact Type) can be picked from a
  // list. Open-ended columns like Lead ID or Company Symbol declare `options`
  // built from the rows on screen — on a server-paged grid that is only the
  // current 100 of 36,000, so those keep the free-text box.
  const selectOptions =
    selectedColumnType === "select" && selectedColumn?.options?.length
      ? selectedColumn.options
      : null;
  const useSelectValue =
    Boolean(selectOptions) && selectOptions!.length <= SELECT_FILTER_MAX_OPTIONS;
  const filterOperatorOptions = getFilterOperatorOptions(selectedColumnType);
  const selectedRange = parseDateRangeFilterValue(condition.value);

  return (
    <div className="grid gap-2 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
      {connector}
      <div className="grid min-w-0 gap-0 overflow-hidden rounded-md border border-slate-200 bg-white md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1.25fr)_40px] dark:border-slate-700 dark:bg-slate-900">
        <Select
          value={condition.field}
          onChange={(value) => {
            const field = value as string;
            const columnType = getColumnType(columnMap.get(field));
            onChange({
              ...condition,
              field,
              operator: getDefaultOperatorForColumnType(columnType),
              value: "",
            });
          }}
          options={selectableColumns}
          placeholder=""
          className="h-10 rounded-none border-0 border-r border-slate-200 text-xs dark:border-slate-700"
          floatingOptions
        />

        <Select
          value={condition.operator}
          onChange={(value) => {
            const operator = value as FilterCondition["operator"];
            onChange({
              ...condition,
              operator,
              // Carry the value across where it still means something: moving
              // "is EST" to "is any of" should keep EST ticked, not blank the
              // condition. Moving the other way keeps the first choice.
              value: convertFilterValue(
                condition.value,
                condition.operator,
                operator,
              ),
            });
          }}
          options={filterOperatorOptions}
          placeholder=""
          searchable
          searchPlaceholder="Find an operator"
          className="h-10 rounded-none border-0 border-r border-slate-200 text-xs dark:border-slate-700"
          floatingOptions
        />

        {!operatorNeedsValue(condition.operator) ? (
          <div className="flex h-10 items-center border-r border-dashed border-slate-200 px-3 text-xs text-slate-400 dark:border-slate-700 dark:text-slate-500">
            No value needed
          </div>
        ) : selectedColumnType === "date" &&
          condition.operator === "is_between" ? (
          <div className="border-r border-slate-200 p-1 dark:border-slate-700">
            <DateRangePicker
              value={selectedRange}
              onChange={(value) =>
                onChange({
                  ...condition,
                  value: serializeDateRangeFilterValue(value),
                })
              }
              placeholder="Pick a date range"
              className="h-8 rounded-sm border-0 px-2"
            />
          </div>
        ) : useSelectValue && isMultiValueOperator(condition.operator) ? (
          <MultiValuePicker
            options={selectOptions!}
            value={condition.value}
            onChange={(next) => onChange({ ...condition, value: next })}
          />
        ) : useSelectValue ? (
          <Select
            value={condition.value}
            onChange={(value) =>
              onChange({ ...condition, value: String(value) })
            }
            options={selectOptions!}
            placeholder="Select a value"
            className="h-10 rounded-none border-0 border-r border-slate-200 bg-white px-4 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100"
            floatingOptions
          />
        ) : selectedColumnType === "date" ? (
          <DateInput
            value={condition.value}
            onChange={(event) =>
              onChange({ ...condition, value: event.target.value })
            }
            className="h-10 rounded-none border-0 border-r border-slate-200 bg-white py-2 pl-9 pr-4 text-xs text-slate-900 transition focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100"
            iconClassName="h-3.5 w-3.5"
          />
        ) : (
          <Input
            value={condition.value}
            onChange={(event) =>
              onChange({ ...condition, value: event.target.value })
            }
            placeholder="Enter a value"
            className="h-10 rounded-none border-0 border-r border-slate-200 bg-white px-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100 dark:placeholder:text-gray-500"
          />
        )}

        <button
          type="button"
          onClick={onRemove}
          className="flex h-10 w-10 cursor-pointer items-center justify-center text-slate-400 transition hover:bg-slate-50 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          aria-label="Remove condition"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

interface FilterConnectorProps {
  itemIndex: number;
  gate: FilterGate;
  onGateChange: (gate: FilterGate) => void;
}

function FilterConnector({
  itemIndex,
  gate,
  onGateChange,
}: FilterConnectorProps) {
  if (itemIndex === 0) {
    return (
      <span className="w-20 px-2 text-xs font-medium text-slate-600 dark:text-slate-300">
        Where
      </span>
    );
  }

  if (itemIndex === 1) {
    return (
      <div className="w-20">
        <Select
          value={gate}
          onChange={(value) => onGateChange(value as FilterGate)}
          options={FILTER_GATE_OPTIONS}
          placeholder=""
          className="h-10 rounded-md px-2 text-xs font-medium lowercase"
          floatingOptions
        />
      </div>
    );
  }

  return (
    <span className="w-20 px-2 text-xs font-medium text-slate-600 dark:text-slate-300">
      {gate.toLowerCase()}
    </span>
  );
}

interface GroupAddMenuProps {
  groupId: string;
  groupDepth: number;
  iconOnly?: boolean;
  selectableColumns: SelectableColumn[];
  columns: Column<unknown>[];
  onAppend: (groupId: string, item: FilterItem) => void;
}

function GroupAddMenu({
  groupId,
  groupDepth,
  iconOnly = false,
  selectableColumns,
  columns,
  onAppend,
}: GroupAddMenuProps) {
  const canAddNestedGroup = groupDepth <= GROUP_DEPTH_CAN_CREATE_CHILD_GROUPS;

  return (
    <Popover className="relative">
      <PopoverButton
        className={clsx(
          "inline-flex cursor-pointer items-center justify-center text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200",
          iconOnly
            ? "h-8 w-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
            : "h-9 gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium dark:border-slate-700 dark:bg-slate-900",
        )}
      >
        <Plus size={15} />
        {!iconOnly && "Add to group"}
      </PopoverButton>
      <PopoverPanel
        anchor="bottom start"
        className="z-300 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-700 dark:bg-slate-950"
      >
        <button
          type="button"
          onClick={() =>
            onAppend(
              groupId,
              createFilterItem(
                selectableColumns[0]?.value ?? "",
                getDefaultOperatorForColumnType(columns[0]?.type),
              ),
            )
          }
          className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
        >
          <Plus size={15} />
          Add condition
        </button>
        <button
          type="button"
          onClick={() => {
            if (!canAddNestedGroup) return;
            onAppend(groupId, createFilterGroup());
          }}
          disabled={!canAddNestedGroup}
          className={clsx(
            "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs",
            canAddNestedGroup
              ? "cursor-pointer text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
              : "cursor-not-allowed text-slate-400 dark:text-slate-600",
          )}
        >
          <Plus size={15} />
          Add condition group
        </button>
      </PopoverPanel>
    </Popover>
  );
}

interface FilterItemsListProps {
  items: FilterItem[];
  gate: FilterGate;
  onGateChange: (gate: FilterGate) => void;
  depth: number;
  selectableColumns: SelectableColumn[];
  columnMap: Map<string, Column<unknown>>;
  columns: Column<unknown>[];
  setFilterItems: Dispatch<SetStateAction<FilterItem[]>>;
  onAppendToGroup: (groupId: string, item: FilterItem) => void;
}

function FilterItemsList({
  items,
  gate,
  onGateChange,
  depth,
  selectableColumns,
  columnMap,
  columns,
  setFilterItems,
  onAppendToGroup,
}: FilterItemsListProps) {
  return (
    <>
      {items.map((item, itemIndex) => {
        const connector = (
          <FilterConnector
            itemIndex={itemIndex}
            gate={gate}
            onGateChange={onGateChange}
          />
        );

        if (item.type === "condition") {
          return (
            <FilterConditionRow
              key={item.id}
              condition={item.condition}
              connector={connector}
              columnMap={columnMap}
              selectableColumns={selectableColumns}
              onChange={(condition) =>
                setFilterItems((current) =>
                  updateFilterCondition(current, item.id, () => condition),
                )
              }
              onRemove={() =>
                setFilterItems((current) => removeFilterItem(current, item.id))
              }
            />
          );
        }

        const groupDepth = depth + 1;
        const canAddNestedGroup =
          groupDepth <= GROUP_DEPTH_CAN_CREATE_CHILD_GROUPS;

        return (
          <div key={item.id} className="space-y-2">
            <div className="grid gap-2 md:grid-cols-[auto_minmax(0,1fr)] md:items-start">
              {connector}
              <div className="rounded-md border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/50">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {item.gate === "OR"
                      ? "Any of the following are true..."
                      : "All of the following are true..."}
                  </span>
                  <div className="flex items-center gap-1">
                    <GroupAddMenu
                      groupId={item.id}
                      groupDepth={groupDepth}
                      iconOnly
                      selectableColumns={selectableColumns}
                      columns={columns}
                      onAppend={onAppendToGroup}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFilterItems((current) =>
                          removeFilterItem(current, item.id),
                        )
                      }
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      aria-label="Remove condition group"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {item.items.length === 0 ? (
                  <div className="rounded-md border border-dashed border-slate-300 px-3 py-4 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    {canAddNestedGroup
                      ? "Add a condition or another group inside this block."
                      : "Add a condition inside this block."}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <FilterItemsList
                      items={item.items}
                      gate={item.gate}
                      onGateChange={(nextGate) =>
                        setFilterItems((current) =>
                          updateFilterGroup(current, item.id, (group) => ({
                            ...group,
                            gate: nextGate,
                          })),
                        )
                      }
                      depth={depth + 1}
                      selectableColumns={selectableColumns}
                      columnMap={columnMap}
                      columns={columns}
                      setFilterItems={setFilterItems}
                      onAppendToGroup={onAppendToGroup}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

interface FilterPanelProps {
  filterItems: FilterItem[];
  setFilterItems: Dispatch<SetStateAction<FilterItem[]>>;
  rootFilterGate: FilterGate;
  setRootFilterGate: Dispatch<SetStateAction<FilterGate>>;
  filterSearch: string;
  setFilterSearch: Dispatch<SetStateAction<string>>;
  selectableColumns: SelectableColumn[];
  columnMap: Map<string, Column<unknown>>;
  columns: Column<unknown>[];
  activeFilterConditionCount: number;
  buttonClassName: string;
  onAppendToGroup: (groupId: string, item: FilterItem) => void;
}

// Above this many distinct values a dropdown stops being easier than typing,
// and it is a sign the list came from the loaded page rather than a real
// enumeration.
const SELECT_FILTER_MAX_OPTIONS = 60;

/** Tick-list for "is any of" / "is none of". */
function MultiValuePicker({
  options,
  value,
  onChange,
}: {
  options: Array<{ label: string; value: string }>;
  value: string;
  onChange: (next: string) => void;
}) {
  const selected = new Set(parseMultiValue(value));

  const toggle = (option: string) => {
    const next = new Set(selected);
    if (next.has(option)) next.delete(option);
    else next.add(option);
    onChange(serializeMultiValue([...next]));
  };

  return (
    <Popover className="relative border-r border-slate-200 dark:border-slate-700">
      <PopoverButton className="flex h-10 w-full cursor-pointer items-center justify-between gap-2 px-4 text-left text-xs text-slate-900 dark:text-gray-100">
        <span className="truncate">
          {selected.size === 0
            ? "Select values"
            : selected.size === 1
              ? [...selected][0]
              : `${selected.size} selected`}
        </span>
        <ChevronDown size={13} className="shrink-0 text-slate-400" />
      </PopoverButton>

      <PopoverPanel
        anchor="bottom start"
        className="z-[500] max-h-64 w-56 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-950"
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => toggle(option.value)}
            className="flex w-full cursor-pointer items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <span className="truncate">{option.label}</span>
            {selected.has(option.value) && (
              <Check size={13} className="shrink-0 text-emerald-500" />
            )}
          </button>
        ))}
      </PopoverPanel>
    </Popover>
  );
}

export function FilterPanel({
  filterItems,
  setFilterItems,
  rootFilterGate,
  setRootFilterGate,
  setFilterSearch,
  selectableColumns,
  columnMap,
  columns,
  activeFilterConditionCount,
  buttonClassName,
  onAppendToGroup,
}: FilterPanelProps) {
  return (
    <Popover className="relative">
      <PopoverButton className={buttonClassName}>
        Filter
        {activeFilterConditionCount > 0 && (
          <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-md bg-slate-800 px-1.5 py-0.5 text-[11px] font-semibold text-white">
            {activeFilterConditionCount}
          </span>
        )}
      </PopoverButton>

      <PopoverPanel
        anchor="bottom end"
        className="z-50 w-screen md:w-2xl border border-slate-200 shadow-2xl bg-white rounded-xl p-2 text-xs backdrop-blur-md transition-colors dark:border-slate-600 dark:bg-slate-950/70 flex flex-col overflow-visible"
      >
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            {filterItems.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 px-4 py-5 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No conditions yet. Add one below.
              </div>
            )}

            <FilterItemsList
              items={filterItems}
              gate={rootFilterGate}
              onGateChange={setRootFilterGate}
              depth={0}
              selectableColumns={selectableColumns}
              columnMap={columnMap}
              columns={columns}
              setFilterItems={setFilterItems}
              onAppendToGroup={onAppendToGroup}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <button
              type="button"
              onClick={() =>
                setFilterItems((items) => [
                  ...items,
                  createFilterItem(
                    selectableColumns[0]?.value ?? "",
                    getDefaultOperatorForColumnType(columns[0]?.type),
                  ),
                ])
              }
              className="inline-flex items-center cursor-pointer gap-2 font-medium text-slate-600 hover:text-sky-700 dark:text-slate-300 dark:hover:text-sky-300"
            >
              <Plus size={16} />
              Add condition
            </button>

            <button
              type="button"
              onClick={() =>
                setFilterItems((items) => [...items, createFilterGroup()])
              }
              className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <span className="inline-flex items-center gap-1">
                Add condition group
                <CircleHelp size={14} />
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFilterSearch("");
                setRootFilterGate("AND");
                setFilterItems([]);
              }}
              className="cursor-pointer text-xs font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-300"
            >
              Reset
            </button>
          </div>
        </div>
      </PopoverPanel>
    </Popover>
  );
}
