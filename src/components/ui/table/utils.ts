import type React from "react";
import type { DateRange } from "@/types/date-range.types";
import type {
  Column,
  FilterCondition,
  FilterItem,
  FilterOperator,
  GroupNode,
  GroupRule,
  SortRule,
} from "./types";

export const DATE_RANGE_VALUE_SEPARATOR = "___to___";
/** Matches MULTI_VALUE_SEPARATOR in the backend's filter-tree.ts. */
export const MULTI_VALUE_SEPARATOR = "___or___";
export const GROUP_DEPTH_CAN_CREATE_CHILD_GROUPS = 1;

export function getCellValue<T>(
  row: T,
  column: Column<T> | (keyof T | string),
): React.ReactNode {
  if (typeof column === "object" && column !== null && "key" in column) {
    if (column.getValue) return column.getValue(row);
    return row[column.key as keyof T] as React.ReactNode;
  }
  return row[column as keyof T] as React.ReactNode;
}

export function isEmailColumn<T>(column: Column<T>): boolean {
  return String(column.key).toLowerCase() === "email";
}

export function getColumnType<T>(column?: Column<T> | null): Column<T>["type"] {
  return column?.type ?? "text";
}

export function getDefaultOperatorForColumnType(
  columnType: Column<unknown>["type"],
): FilterOperator {
  if (columnType === "date") return "is_on";
  // A closed set is picked from, so equality is the sensible default —
  // "contains" on an enum invites matching a fragment of a value nobody sees.
  if (columnType === "select") return "is";
  return "contains";
}

/**
 * Keeps a condition's value meaningful when the operator changes.
 *
 * Switching between a single-value and a multi-value operator used to blank
 * the value, so picking "is any of" after "is EST" lost EST.
 */
export function convertFilterValue(
  value: string,
  from: FilterOperator,
  to: FilterOperator,
): string {
  if (!operatorNeedsValue(to)) return "";

  const wasMulti = isMultiValueOperator(from);
  const isMulti = isMultiValueOperator(to);

  if (wasMulti === isMulti) return value;
  if (isMulti) return serializeMultiValue(value.trim() ? [value.trim()] : []);
  return parseMultiValue(value)[0] ?? "";
}

export function getFilterOperatorOptions(
  columnType: Column<unknown>["type"],
): Array<{ label: string; value: string }> {
  if (columnType === "date") {
    return [
      { label: "is on", value: "is_on" },
      { label: "is before", value: "is_before" },
      { label: "is after", value: "is_after" },
      { label: "is between", value: "is_between" },
      { label: "is empty", value: "is_empty" },
      { label: "is not empty", value: "is_not_empty" },
    ];
  }

  // A closed set is chosen from, never typed, so "contains" is meaningless on
  // it — matching a substring of "send_contract" is not something anyone
  // wants. Offer set membership instead.
  if (columnType === "select") {
    return [
      { label: "is", value: "is" },
      { label: "is not", value: "is_not" },
      { label: "is any of", value: "is_any_of" },
      { label: "is none of", value: "is_none_of" },
      { label: "is empty", value: "is_empty" },
      { label: "is not empty", value: "is_not_empty" },
    ];
  }

  return [
    { label: "contains", value: "contains" },
    { label: "does not contain", value: "does_not_contain" },
    { label: "is", value: "is" },
    { label: "is not", value: "is_not" },
    { label: "is empty", value: "is_empty" },
    { label: "is not empty", value: "is_not_empty" },
  ];
}

/** True for operators whose value is a list rather than a single string. */
export function isMultiValueOperator(operator: FilterOperator): boolean {
  return operator === "is_any_of" || operator === "is_none_of";
}

export function parseMultiValue(value: string): string[] {
  return value
    .split(MULTI_VALUE_SEPARATOR)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function serializeMultiValue(values: string[]): string {
  return [...new Set(values.filter(Boolean))].join(MULTI_VALUE_SEPARATOR);
}

export function operatorNeedsValue(operator: FilterOperator): boolean {
  return operator !== "is_empty" && operator !== "is_not_empty";
}

export function normalizeDateValue(value: React.ReactNode): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const text = String(value).trim();
  if (!text) return null;
  const directMatch = text.match(/\d{4}-\d{2}-\d{2}/);
  if (directMatch) return directMatch[0];
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

export function parseDateRangeFilterValue(
  value: string,
): DateRange | undefined {
  const [fromValue = "", toValue = ""] = value.split(
    DATE_RANGE_VALUE_SEPARATOR,
  );
  const from = fromValue ? new Date(fromValue) : undefined;
  const to = toValue ? new Date(toValue) : undefined;
  if (
    (from && Number.isNaN(from.getTime())) ||
    (to && Number.isNaN(to.getTime()))
  ) {
    return undefined;
  }
  if (!from && !to) return undefined;
  return { from, to };
}

export function serializeDateRangeFilterValue(
  value: DateRange | undefined,
): string {
  const from = value?.from ? value.from.toISOString().slice(0, 10) : "";
  const to = value?.to ? value.to.toISOString().slice(0, 10) : "";
  return `${from}${DATE_RANGE_VALUE_SEPARATOR}${to}`;
}

export function createFilterCondition(
  field = "",
  operator: FilterOperator = "contains",
): FilterCondition {
  return {
    id: Math.random().toString(36).slice(2, 9),
    field,
    operator,
    value: "",
  };
}

export function createFilterItem(
  field = "",
  operator: FilterOperator = "contains",
): FilterItem {
  return {
    id: Math.random().toString(36).slice(2, 9),
    type: "condition",
    condition: createFilterCondition(field, operator),
  };
}

export function createFilterGroup(): FilterItem {
  return {
    id: Math.random().toString(36).slice(2, 9),
    type: "group",
    gate: "AND",
    items: [],
  };
}

export function createSortRule(field = ""): SortRule {
  return { field, direction: "asc" };
}

export function isFilterConditionActive(condition: FilterCondition): boolean {
  if (!condition.field) return false;
  if (!operatorNeedsValue(condition.operator)) return true;
  if (isMultiValueOperator(condition.operator)) {
    return parseMultiValue(condition.value).length > 0;
  }
  return Boolean(condition.value.trim());
}

export function countActiveFilterItems(items: FilterItem[]): number {
  return items.reduce((count, item) => {
    if (item.type === "condition")
      return count + Number(isFilterConditionActive(item.condition));
    return count + countActiveFilterItems(item.items);
  }, 0);
}

export function updateFilterCondition(
  items: FilterItem[],
  conditionId: string,
  updater: (condition: FilterCondition) => FilterCondition,
): FilterItem[] {
  return items.map((item) => {
    if (item.type === "condition") {
      return item.id === conditionId
        ? { ...item, condition: updater(item.condition) }
        : item;
    }
    return {
      ...item,
      items: updateFilterCondition(item.items, conditionId, updater),
    };
  });
}

export function updateFilterGroup(
  items: FilterItem[],
  groupId: string,
  updater: (group: Extract<FilterItem, { type: "group" }>) => FilterItem,
): FilterItem[] {
  return items.map((item) => {
    if (item.type === "group") {
      return item.id === groupId
        ? updater(item)
        : { ...item, items: updateFilterGroup(item.items, groupId, updater) };
    }
    return item;
  });
}

export function removeFilterItem(
  items: FilterItem[],
  itemId: string,
): FilterItem[] {
  return items
    .filter((item) => item.id !== itemId)
    .map((item) =>
      item.type === "group"
        ? { ...item, items: removeFilterItem(item.items, itemId) }
        : item,
    );
}

export function buildGroupNodes<T>(
  rows: T[],
  groupRules: GroupRule[],
  columnMap: Map<string, Column<T>>,
  level = 0,
  path: string[] = [],
): GroupNode<T>[] {
  const currentRule = groupRules[level];
  if (!currentRule?.field) return [];

  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    const rawValue = getCellValue(row, currentRule.field);
    const derivedColumn = columnMap.get(currentRule.field);
    const resolvedValue = derivedColumn
      ? getCellValue(row, derivedColumn)
      : rawValue;
    const groupLabel =
      resolvedValue === null ||
      resolvedValue === undefined ||
      resolvedValue === ""
        ? "Unknown"
        : String(resolvedValue);
    const items = grouped.get(groupLabel) ?? [];
    items.push(row);
    grouped.set(groupLabel, items);
  }

  return Array.from(grouped.entries())
    .sort(([left], [right]) => {
      const comparison = left.localeCompare(right, undefined, {
        numeric: true,
        sensitivity: "base",
      });
      return currentRule.direction === "asc" ? comparison : comparison * -1;
    })
    .map(([label, nestedRows]) => {
      const nextPath = [...path, `${currentRule.field}:${label}`];
      return {
        id: nextPath.join("|"),
        label,
        level,
        rows: nestedRows,
        children:
          level < groupRules.length - 1
            ? buildGroupNodes(
                nestedRows,
                groupRules,
                columnMap,
                level + 1,
                nextPath,
              )
            : null,
      };
    });
}
