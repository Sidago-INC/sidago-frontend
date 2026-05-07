import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import React, { useMemo, useRef, useState } from "react";
import { Input } from "./Input";
import { Select } from "./Select";
import { EmailLink } from "./EmailLink";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Ellipsis,
  FileDown,
  Printer,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import clsx from "clsx";

export type Column<T> = {
  key: keyof T | string;
  title: string;
  render?: (row: T) => React.ReactNode;
  getValue?: (row: T) => React.ReactNode;
  type?: "text" | "select" | "date";
  options?: Array<{ label: string; value: string }>;
};

type Props<T> = {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  emptyText?: string;
  emptyState?: React.ReactNode;
  showTableWhenEmpty?: boolean;
  onRowClick?: (row: T) => void;
  title: string;
  description?: string;
};

type SortDirection = "asc" | "desc";
type FilterOperator =
  | "contains"
  | "does_not_contain"
  | "is"
  | "is_not"
  | "is_empty"
  | "is_not_empty";
type FilterGate = "AND" | "OR";

type FilterCondition = {
  id: string;
  field: string;
  operator: FilterOperator;
  value: string;
};

type FilterItem =
  | {
      id: string;
      type: "condition";
      condition: FilterCondition;
    }
  | {
      id: string;
      type: "group";
      gate: FilterGate;
      items: FilterItem[];
    };

type GroupRule = {
  field: string;
  direction: SortDirection;
};

type SortRule = {
  field: string;
  direction: SortDirection;
};

type GroupNode<T> = {
  id: string;
  label: string;
  level: number;
  rows: T[];
  children: GroupNode<T>[] | null;
};

const GROUP_DEPTH_CAN_CREATE_CHILD_GROUPS = 1;

function getCellValue<T>(row: T, column: Column<T> | (keyof T | string)) {
  if (typeof column === "object" && column !== null && "key" in column) {
    if (column.getValue) {
      return column.getValue(row);
    }

    return row[column.key as keyof T] as React.ReactNode;
  }

  return row[column as keyof T] as React.ReactNode;
}

function isEmailColumn<T>(column: Column<T>) {
  return String(column.key).toLowerCase() === "email";
}

function renderCellValue<T>(row: T, column: Column<T>) {
  if (column.render) {
    return column.render(row);
  }

  const value = getCellValue(row, column);

  if (isEmailColumn(column)) {
    return <EmailLink value={String(value ?? "")} />;
  }

  return value;
}

function createFilterCondition(field = ""): FilterCondition {
  return {
    id: Math.random().toString(36).slice(2, 9),
    field,
    operator: "contains",
    value: "",
  };
}

function createFilterItem(field = ""): FilterItem {
  return {
    id: Math.random().toString(36).slice(2, 9),
    type: "condition",
    condition: createFilterCondition(field),
  };
}

function createFilterGroup(): FilterItem {
  return {
    id: Math.random().toString(36).slice(2, 9),
    type: "group",
    gate: "AND",
    items: [],
  };
}

function createSortRule(field = ""): SortRule {
  return {
    field,
    direction: "asc",
  };
}

function operatorNeedsValue(operator: FilterOperator) {
  return operator !== "is_empty" && operator !== "is_not_empty";
}

export function Table<T>({
  data,
  columns,
  isLoading,
  title,
  description,
  emptyText = "No data found",
  emptyState,
  showTableWhenEmpty = false,
  onRowClick,
}: Props<T>) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const tableElementRef = useRef<HTMLTableElement | null>(null);
  const toolbarButtonClass =
    "flex h-9 cursor-pointer items-center justify-center rounded-xl px-3 text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900";
  const toolbarIconButtonClass =
    "flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900";
  const [groupRules, setGroupRules] = useState<GroupRule[]>([]);
  const [sortRules, setSortRules] = useState<SortRule[]>([]);
  const [showCounts, setShowCounts] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});
  const [filterSearch, setFilterSearch] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [rootFilterGate, setRootFilterGate] = useState<FilterGate>("AND");
  const selectableColumns = useMemo(
    () =>
      columns.map((column) => ({
        value: String(column.key),
        label: column.title,
      })),
    [columns],
  );
  const columnMap = useMemo(
    () => new Map(columns.map((column) => [String(column.key), column])),
    [columns],
  );
  const [filterItems, setFilterItems] = useState<FilterItem[]>([]);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [pageState, setPageState] = useState({
    page: 1,
    contextKey: "",
  });
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      const searchMatches = !filterSearch.trim()
        ? true
        : columns.some((column) =>
            String(getCellValue(row, column) ?? "")
              .toLowerCase()
              .includes(filterSearch.trim().toLowerCase()),
          );

      if (!searchMatches) {
        return false;
      }

      const isActiveCondition = (condition: FilterCondition) =>
        condition.field &&
        (!operatorNeedsValue(condition.operator) || condition.value.trim());

      const matchesCondition = (condition: FilterCondition) => {
        const value = String(
          getCellValue(
            row,
            columnMap.get(condition.field) ?? condition.field,
          ) ?? "",
        ).toLowerCase();
        const query = condition.value.trim().toLowerCase();

        return condition.operator === "contains"
          ? value.includes(query)
          : condition.operator === "does_not_contain"
            ? !value.includes(query)
            : condition.operator === "is"
              ? value === query
              : condition.operator === "is_not"
                ? value !== query
                : condition.operator === "is_empty"
                  ? value.trim() === ""
                  : value.trim() !== "";
      };

      const getItemMatch = (
        item: FilterItem,
      ): { id: string; matches: boolean } | null => {
        if (item.type === "condition") {
          return isActiveCondition(item.condition)
            ? {
                id: item.id,
                matches: matchesCondition(item.condition),
              }
            : null;
        }

        const activeChildren = item.items
          .map(getItemMatch)
          .filter((child): child is { id: string; matches: boolean } =>
            Boolean(child),
          );

        if (activeChildren.length === 0) {
          return null;
        }

        return {
          id: item.id,
          matches:
            item.gate === "AND"
              ? activeChildren.every((child) => child.matches)
              : activeChildren.some((child) => child.matches),
        };
      };

      const activeItems = filterItems
        .map(getItemMatch)
        .filter((item): item is { id: string; matches: boolean } =>
          Boolean(item),
        );

      if (activeItems.length === 0) {
        return true;
      }

      return rootFilterGate === "AND"
        ? activeItems.every((item) => item.matches)
        : activeItems.some((item) => item.matches);
    });
  }, [columnMap, columns, data, filterItems, filterSearch, rootFilterGate]);
  const processedData = useMemo(() => {
    const activeSortRules = sortRules.filter((rule) => rule.field);

    if (activeSortRules.length === 0) {
      return filteredData;
    }

    return [...filteredData].sort((left, right) => {
      for (const rule of activeSortRules) {
        const leftValue = String(
          getCellValue(left, columnMap.get(rule.field) ?? rule.field) ?? "",
        ).toLowerCase();
        const rightValue = String(
          getCellValue(right, columnMap.get(rule.field) ?? rule.field) ?? "",
        ).toLowerCase();

        if (leftValue === rightValue) {
          continue;
        }

        const result = leftValue > rightValue ? 1 : -1;
        return rule.direction === "asc" ? result : result * -1;
      }

      return 0;
    });
  }, [columnMap, filteredData, sortRules]);
  const groupedData = useMemo<GroupNode<T>[] | null>(() => {
    const activeGroupRules = groupRules.filter((rule) => rule.field);

    if (activeGroupRules.length === 0) {
      return null;
    }

    const buildGroups = (
      rows: T[],
      level: number,
      path: string[] = [],
    ): GroupNode<T>[] => {
      const currentRule = activeGroupRules[level];
      const groupKey = currentRule?.field;

      if (!groupKey) {
        return [];
      }

      const grouped = new Map<string, T[]>();

      for (const row of rows) {
        const rawValue = getCellValue(row, groupKey);
        const derivedColumn = columnMap.get(groupKey);
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
          const nextPath = [...path, `${groupKey}:${label}`];

          return {
            id: nextPath.join("|"),
            label,
            level,
            rows: nestedRows,
            children:
              level < activeGroupRules.length - 1
                ? buildGroups(nestedRows, level + 1, nextPath)
                : null,
          };
        });
    };

    return buildGroups(processedData, 0);
  }, [columnMap, groupRules, processedData]);
  const paginationContextKey = useMemo(
    () =>
      JSON.stringify({
        filterSearch,
        filterItems,
        rootFilterGate,
        sortRules,
        groupRules,
        rowsPerPage,
        dataLength: data.length,
        columnKeys: columns.map((column) => String(column.key)),
      }),
    [
      columns,
      data.length,
      filterItems,
      filterSearch,
      groupRules,
      rootFilterGate,
      rowsPerPage,
      sortRules,
    ],
  );
  const totalPages = Math.max(1, Math.ceil(processedData.length / rowsPerPage));
  const currentPage =
    pageState.contextKey === paginationContextKey ? pageState.page : 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageNumbers = useMemo(() => {
    const pages = new Set<number>([
      1,
      totalPages,
      safeCurrentPage - 1,
      safeCurrentPage,
      safeCurrentPage + 1,
    ]);

    return Array.from(pages)
      .filter((page) => page >= 1 && page <= totalPages)
      .sort((left, right) => left - right);
  }, [safeCurrentPage, totalPages]);
  const paginatedData = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * rowsPerPage;
    return processedData.slice(startIndex, startIndex + rowsPerPage);
  }, [processedData, rowsPerPage, safeCurrentPage]);
  const paginationStart = processedData.length
    ? (safeCurrentPage - 1) * rowsPerPage + 1
    : 0;
  const paginationEnd = Math.min(
    safeCurrentPage * rowsPerPage,
    processedData.length,
  );

  const renderGroupedRows = (groups: GroupNode<T>[]): React.ReactNode =>
    groups.map((group) => (
      <React.Fragment key={group.id}>
        <tr>
          <td colSpan={columns.length} className="px-4 py-2">
            <button
              type="button"
              onClick={() =>
                setCollapsedGroups((current) => ({
                  ...current,
                  [group.id]: !current[group.id],
                }))
              }
              className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 cursor-pointer dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <span
                className="flex items-center gap-2"
                style={{ paddingLeft: `${group.level * 16}px` }}
              >
                {collapsedGroups[group.id] ? (
                  <ChevronRight size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
                <span>{group.label}</span>
                {showCounts && (
                  <span className="rounded-md bg-slate-200 px-2 py-0.5 text-xs text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                    {group.rows.length}
                  </span>
                )}
              </span>
            </button>
          </td>
        </tr>

        {!collapsedGroups[group.id] &&
          (group.children && group.children.length > 0
            ? renderGroupedRows(group.children)
            : group.rows.map((row, index) => (
                <tr
                  key={`${group.id}-${index}`}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={clsx(
                    "transition-colors duration-150",
                    onRowClick
                      ? "cursor-pointer hover:bg-indigo-50/40 dark:hover:bg-slate-800"
                      : "hover:bg-indigo-50/40 dark:hover:bg-slate-800",
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.title}
                      className="px-6 py-4 text-sm text-gray-700 dark:text-slate-200 whitespace-nowrap"
                    >
                      {renderCellValue(row, col)}
                    </td>
                  ))}
                </tr>
              )))}
      </React.Fragment>
    ));

  const handleTableScrollKeys = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    const container = scrollContainerRef.current;

    if (!container) {
      return;
    }

    const horizontalStep = 64;
    const verticalStep = 48;

    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        container.scrollBy({ left: -horizontalStep, behavior: "smooth" });
        break;
      case "ArrowRight":
        event.preventDefault();
        container.scrollBy({ left: horizontalStep, behavior: "smooth" });
        break;
      case "ArrowUp":
        event.preventDefault();
        container.scrollBy({ top: -verticalStep, behavior: "smooth" });
        break;
      case "ArrowDown":
        event.preventDefault();
        container.scrollBy({ top: verticalStep, behavior: "smooth" });
        break;
      default:
        break;
    }
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
    setFilterSearch("");
  };

  const handlePrintPage = () => {
    if (typeof window === "undefined") {
      return;
    }

    window.print();
  };

  const handlePrintData = () => {
    if (typeof window === "undefined") {
      return;
    }

    const tableMarkup = tableElementRef.current?.outerHTML;

    if (!tableMarkup) {
      return;
    }

    const printWindow = window.open("", "_blank", "width=1200,height=800");

    if (!printWindow) {
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
            h1 { margin-bottom: 16px; font-size: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 12px; vertical-align: top; }
            th { background: #f8fafc; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          ${tableMarkup}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleExportSvg = () => {
    if (typeof window === "undefined") {
      return;
    }

    const rows = processedData;
    const headers = columns.map((column) => column.title);
    const rowLines = rows.map((row) =>
      columns
        .map(
          (column) =>
            `${column.title}: ${String(getCellValue(row, column) ?? "")}`,
        )
        .join(" | "),
    );
    const lines = [title, headers.join(" | "), ...rowLines];
    const lineHeight = 22;
    const padding = 24;
    const svgWidth = 1600;
    const svgHeight = Math.max(160, padding * 2 + lines.length * lineHeight);
    const escapedLines = lines.map((line) =>
      line
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;"),
    );

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
        <rect width="100%" height="100%" fill="#ffffff" />
        ${escapedLines
          .map(
            (line, index) => `
              <text x="${padding}" y="${padding + (index + 1) * lineHeight}" font-family="Arial, sans-serif" font-size="${index === 0 ? 18 : 12}" fill="#0f172a">
                ${line}
              </text>`,
          )
          .join("")}
      </svg>
    `;

    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.toLowerCase().replace(/\s+/g, "-")}.svg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  // 🔹 Loading
  const isFilterConditionActive = (condition: FilterCondition) =>
    Boolean(
      condition.field &&
        (!operatorNeedsValue(condition.operator) || condition.value.trim()),
    );

  const countActiveFilterItems = (items: FilterItem[]): number =>
    items.reduce((count, item) => {
      if (item.type === "condition") {
        return count + Number(isFilterConditionActive(item.condition));
      }

      return count + countActiveFilterItems(item.items);
    }, 0);

  const activeFilterConditionCount =
    countActiveFilterItems(filterItems) + Number(Boolean(filterSearch.trim()));

  const filterOperatorOptions = [
    { label: "contains", value: "contains" },
    { label: "does not contain", value: "does_not_contain" },
    { label: "is", value: "is" },
    { label: "is not", value: "is_not" },
    { label: "is empty", value: "is_empty" },
    { label: "is not empty", value: "is_not_empty" },
  ];
  const filterGateOptions = [
    { label: "and", value: "AND" },
    { label: "or", value: "OR" },
  ];

  const updateFilterCondition = (
    items: FilterItem[],
    conditionId: string,
    updater: (condition: FilterCondition) => FilterCondition,
  ): FilterItem[] =>
    items.map((item) => {
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

  const updateFilterGroup = (
    items: FilterItem[],
    groupId: string,
    updater: (group: Extract<FilterItem, { type: "group" }>) => FilterItem,
  ): FilterItem[] =>
    items.map((item) => {
      if (item.type === "group") {
        return item.id === groupId
          ? updater(item)
          : {
              ...item,
              items: updateFilterGroup(item.items, groupId, updater),
            };
      }

      return item;
    });

  const removeFilterItem = (items: FilterItem[], itemId: string): FilterItem[] =>
    items
      .filter((item) => item.id !== itemId)
      .map((item) =>
        item.type === "group"
          ? { ...item, items: removeFilterItem(item.items, itemId) }
          : item,
      );

  const appendFilterItemToGroup = (groupId: string, item: FilterItem) => {
    setFilterItems((items) =>
      updateFilterGroup(items, groupId, (group) => ({
        ...group,
        items: [...group.items, item],
      })),
    );
  };

  const renderFilterConditionRow = ({
    condition,
    connector,
    onChange,
    onRemove,
  }: {
    condition: FilterCondition;
    connector: React.ReactNode;
    onChange: (condition: FilterCondition) => void;
    onRemove: () => void;
  }) => {
    return (
      <div
        key={condition.id}
        className="grid gap-2 md:grid-cols-[auto_minmax(0,1fr)] md:items-center"
      >
        {connector}
        <div className="grid min-w-0 gap-0 overflow-hidden rounded-md border border-slate-200 bg-white md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1.25fr)_40px] dark:border-slate-700 dark:bg-slate-900">
          <Select
            value={condition.field}
            onChange={(value) =>
              onChange({ ...condition, field: value as string, value: "" })
            }
            options={selectableColumns}
            placeholder=""
            className="h-10 rounded-none border-0 border-r border-slate-200 text-xs dark:border-slate-700"
            floatingOptions
          />

          <Select
            value={condition.operator}
            onChange={(value) => {
              const operator = value as FilterOperator;
              onChange({
                ...condition,
                operator,
                value: operatorNeedsValue(operator) ? condition.value : "",
              });
            }}
            options={filterOperatorOptions}
            placeholder=""
            className="h-10 rounded-none border-0 border-r border-slate-200 text-xs dark:border-slate-700"
            floatingOptions
          />

          {!operatorNeedsValue(condition.operator) ? (
            <div className="flex h-10 items-center border-r border-dashed border-slate-200 px-3 text-xs text-slate-400 dark:border-slate-700 dark:text-slate-500">
              No value needed
            </div>
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
  };

  const renderFilterConnector = (
    itemIndex: number,
    gate: FilterGate,
    onGateChange: (gate: FilterGate) => void,
  ) => {
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
            options={filterGateOptions}
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
  };

  const renderGroupAddMenu = (
    groupId: string,
    groupDepth: number,
    iconOnly = false,
  ) => {
    const canAddNestedGroup =
      groupDepth <= GROUP_DEPTH_CAN_CREATE_CHILD_GROUPS;

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
        className="z-[300] w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-700 dark:bg-slate-950"
      >
        <button
          type="button"
          onClick={() =>
            appendFilterItemToGroup(
              groupId,
              createFilterItem(selectableColumns[0]?.value ?? ""),
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
            if (!canAddNestedGroup) {
              return;
            }

            appendFilterItemToGroup(groupId, createFilterGroup());
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
  };

  const renderFilterItems = (
    items: FilterItem[],
    gate: FilterGate,
    onGateChange: (gate: FilterGate) => void,
    depth = 0,
  ): React.ReactNode =>
    items.map((item, itemIndex) => {
      const connector = renderFilterConnector(itemIndex, gate, onGateChange);

      if (item.type === "condition") {
        return renderFilterConditionRow({
          condition: item.condition,
          connector,
          onChange: (condition) =>
            setFilterItems((current) =>
              updateFilterCondition(current, item.id, () => condition),
            ),
          onRemove: () =>
            setFilterItems((current) => removeFilterItem(current, item.id)),
        });
      }

      const groupDepth = depth + 1;
      const canAddNestedGroup =
        groupDepth <= GROUP_DEPTH_CAN_CREATE_CHILD_GROUPS;

      return (
        <div key={item.id} className="space-y-2">
          <div
            className="grid gap-2 md:grid-cols-[auto_minmax(0,1fr)] md:items-start"
          >
            {connector}
            <div className="rounded-md border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/50">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {item.gate === "OR"
                    ? "Any of the following are true..."
                    : "All of the following are true..."}
                </span>
                <div className="flex items-center gap-1">
                  {renderGroupAddMenu(item.id, groupDepth, true)}
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
                  {renderFilterItems(
                    item.items,
                    item.gate,
                    (nextGate) =>
                      setFilterItems((current) =>
                        updateFilterGroup(current, item.id, (group) => ({
                          ...group,
                          gate: nextGate,
                        })),
                      ),
                    depth + 1,
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    });

  if (isLoading) {
    return (
      <div className="bg-white shadow p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  // 🔹 Empty
  if ((!data || data.length === 0) && !showTableWhenEmpty) {
    return (
      <div className="overflow-hidden ">
        {emptyState ?? (
          <div className="p-10 text-center text-gray-500">{emptyText}</div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-center md:justify-between mb-2 border-b border-slate-200/80 bg-white/75 px-8 backdrop-blur-md transition-colors dark:border-slate-600 dark:bg-slate-950/70">
        <div className="min-w-0 py-2 hidden md:block">
          <h3 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h3>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Popover className="relative">
            <PopoverButton className={toolbarButtonClass}>
              Group
              {groupRules.length > 0 && (
                <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-md bg-slate-800 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                  {groupRules.length}
                </span>
              )}
            </PopoverButton>

            <PopoverPanel
              anchor="bottom end"
              className="w-screen md:w-2xl border border-slate-200 shadow-2xl bg-white rounded-xl p-2 text-sm backdrop-blur-md transition-colors dark:border-slate-600 dark:bg-slate-950/70 flex flex-col overflow-visible"
            >
              <div className="space-y-3">
                {groupRules.map((groupRule, index) => (
                  <div
                    key={`${groupRule.field}-${index}`}
                    className="grid w-full min-w-0 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <Select
                        value={groupRule.field}
                        onChange={(value) =>
                          setGroupRules((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
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
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? {
                                    ...item,
                                    direction: value as SortDirection,
                                  }
                                : item,
                            ),
                          )
                        }
                        options={[
                          { label: "First to Last", value: "asc" },
                          { label: "Last to First", value: "desc" },
                        ]}
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
                          className="w-72 max-w-[90vw] border border-slate-200 shadow-2xl bg-white rounded-xl p-2 backdrop-blur-md transition-colors dark:border-slate-600 dark:bg-slate-950/70 flex flex-col overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setShowCounts(false);
                            }}
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
                            onClick={() => {
                              setShowCounts(true);
                            }}
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
                            current.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          )
                        }
                        className="flex items-center cursor-pointer justify-center h-9 w-9 rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-900 dark:hover:text-slate-200"
                        aria-label="Remove group"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}

                {groupRules.length === 0 && (
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
                              : current.map((item, itemIndex) =>
                                  itemIndex === 0
                                    ? {
                                        ...item,
                                        direction: value as SortDirection,
                                      }
                                    : item,
                                ),
                          )
                        }
                        options={[
                          { label: "First to Last", value: "asc" },
                          { label: "Last to First", value: "desc" },
                        ]}
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
                    onClick={() =>
                      setGroupRules((current) =>
                        current.some((item) => item.field === column.value)
                          ? current
                          : [
                              ...current,
                              { field: column.value, direction: "asc" },
                            ],
                      )
                    }
                    className={clsx(
                      "flex w-full min-w-0 items-center rounded px-3 py-2 text-left text-sm transition",
                      "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900",
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
          <Popover className="relative">
            <PopoverButton className={toolbarButtonClass}>
              Filter
              {activeFilterConditionCount > 0 && (
                <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-md bg-slate-800 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                  {activeFilterConditionCount}
                </span>
              )}
            </PopoverButton>

            <PopoverPanel
              anchor="bottom end"
              className="w-screen md:w-2xl border border-slate-200 shadow-2xl bg-white rounded-xl p-2 text-xs backdrop-blur-md transition-colors dark:border-slate-600 dark:bg-slate-950/70 flex flex-col overflow-visible"
            >
              <div className="flex flex-col gap-4">
                <div className="space-y-2">
                  {filterItems.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-300 px-4 py-5 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      No conditions yet. Add one below.
                    </div>
                  )}

                  {renderFilterItems(filterItems, rootFilterGate, (nextGate) =>
                    setRootFilterGate(nextGate),
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <button
                    type="button"
                    onClick={() =>
                      setFilterItems((items) => [
                        ...items,
                        createFilterItem(selectableColumns[0]?.value ?? ""),
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
                      setFilterItems((items) => [
                        ...items,
                        createFilterGroup(),
                      ])
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
          <Popover className="relative">
            <PopoverButton className={toolbarButtonClass}>
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
                {sortRules.map((sortRule, index) => (
                  <div
                    key={`${sortRule.field}-${index}`}
                    className="grid w-full min-w-0 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <Select
                        value={sortRule.field}
                        onChange={(value) =>
                          setSortRules((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
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
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, direction: value as SortDirection }
                                : item,
                            ),
                          )
                        }
                        options={[
                          { label: "A to Z", value: "asc" },
                          { label: "Z to A", value: "desc" },
                        ]}
                        placeholder=""
                        className="h-8 rounded text-xs w-full min-w-0"
                      />
                    </div>

                    <div className="flex items-center gap-2 shrink-0 md:justify-self-end">
                      <button
                        type="button"
                        onClick={() =>
                          setSortRules((current) =>
                            current.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          )
                        }
                        className="flex items-center cursor-pointer justify-center h-9 w-9 rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-900 dark:hover:text-slate-200 cursor-pointer"
                        aria-label="Remove sort"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}

                {sortRules.length === 0 && (
                  <div className="grid w-full min-w-0 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center">
                    <div className="min-w-0 flex-1">
                      <Select
                        value=""
                        onChange={(value) =>
                          setSortRules(
                            value ? [createSortRule(value as string)] : [],
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
                          setSortRules((current) =>
                            current.length === 0
                              ? current
                              : current.map((item, itemIndex) =>
                                  itemIndex === 0
                                    ? { ...item, direction: value as SortDirection }
                                    : item,
                                ),
                          )
                        }
                        options={[
                          { label: "A to Z", value: "asc" },
                          { label: "Z to A", value: "desc" },
                        ]}
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
          {isSearchOpen ? (
            <div className="relative w-72">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              />
              <input
                type="text"
                value={filterSearch}
                onChange={(event) => setFilterSearch(event.target.value)}
                placeholder="Search in table"
                className="h-9 w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={closeSearch}
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
                aria-label="Close search"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className={toolbarIconButtonClass}
              aria-label="Open search"
            >
              <Search size={15} />
            </button>
          )}
          <Popover className="relative">
            <PopoverButton className={toolbarIconButtonClass}>
              <Ellipsis size={16} />
            </PopoverButton>

            <PopoverPanel
              anchor="bottom end"
              className="w-56 border border-slate-200 shadow-2xl bg-white rounded-xl p-2 backdrop-blur-md transition-colors dark:border-slate-600 dark:bg-slate-950/70 flex flex-col overflow-hidden"
            >
              <button
                type="button"
                onClick={handlePrintPage}
                className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                <Printer size={16} />
                <span>Print the page</span>
              </button>
              <button
                type="button"
                onClick={handlePrintData}
                className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                <Printer size={16} />
                <span>Print the data</span>
              </button>
              <button
                type="button"
                onClick={handleExportSvg}
                className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                <FileDown size={16} />
                <span>Export the data as CSV</span>
              </button>
            </PopoverPanel>
          </Popover>
        </div>
      </div>
      <div
        ref={scrollContainerRef}
        tabIndex={0}
        onKeyDown={handleTableScrollKeys}
        className="overflow-x-auto overflow-y-visible px-4 outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60"
        aria-label="Scrollable table"
      >
        <table ref={tableElementRef} className="min-w-240 w-full">
          {/* Header */}
          <thead className="text-xs uppercase text-gray-500 dark:text-white tracking-wide border-b border-slate-200/80 transition-colors dark:border-slate-600">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.title}
                  className="px-6 py-4 text-left font-semibold whitespace-nowrap"
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-slate-200/80 dark:divide-slate-600">
            {groupedData ? (
              renderGroupedRows(groupedData)
            ) : processedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-0 py-0">
                  {emptyState ?? (
                    <div className="p-10 text-center text-gray-500">
                      {emptyText}
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, i) => (
                <tr
                  key={`${safeCurrentPage}-${i}`}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={clsx(
                    "transition-colors duration-150 dark:hover:bg-slate-800",
                    onRowClick
                      ? "cursor-pointer hover:bg-indigo-50/40"
                      : "hover:bg-indigo-50/40",
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.title}
                      className="px-6 py-4 text-sm text-gray-700 transition-colors dark:text-white whitespace-nowrap"
                    >
                      {renderCellValue(row, col)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {!groupedData && processedData.length > 0 && (
        <div className="mt-4 px-4 pb-2">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="grid grid-cols-2 items-center gap-3 sm:flex sm:flex-row sm:items-center sm:gap-6">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">
                Showing {paginationStart} to {paginationEnd} of{" "}
                {processedData.length} entries
              </p>
              <div className="flex items-center justify-end gap-3 sm:justify-start">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">
                  Rows per page
                </span>
                <Popover className="relative">
                  <PopoverButton className="flex h-6 min-w-6 cursor-pointer items-center justify-between gap-2 rounded border border-slate-200 focus:outline-0 focus:ring-0 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-950">
                    <span>{rowsPerPage}</span>
                    <ChevronDown size={14} />
                  </PopoverButton>
                  <PopoverPanel
                    anchor="bottom start"
                    className="mt-2 flex w-24 flex-col overflow-hidden rounded border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-950"
                  >
                    {["10", "20", "30", "50", "100", "500"].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRowsPerPage(Number(value))}
                        className={clsx(
                          "cursor-pointer rounded-lg px-3 py-2 text-left text-sm font-medium transition",
                          rowsPerPage === Number(value)
                            ? "bg-blue-600 text-white"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white",
                        )}
                      >
                        {value}
                      </button>
                    ))}
                  </PopoverPanel>
                </Popover>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 sm:justify-end">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPageState({
                      page: Math.max(1, safeCurrentPage - 1),
                      contextKey: paginationContextKey,
                    })
                  }
                  disabled={safeCurrentPage === 1}
                  className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-white"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex items-center gap-1">
                  {pageNumbers.map((page, index) => {
                    const previousPage = pageNumbers[index - 1];
                    const showGap = previousPage && page - previousPage > 1;

                    return (
                      <React.Fragment key={page}>
                        {showGap && (
                          <span className="px-2 text-sm font-medium text-slate-400">
                            ...
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setPageState({
                              page,
                              contextKey: paginationContextKey,
                            })
                          }
                          className={clsx(
                            "flex h-6 min-w-6 cursor-pointer items-center justify-center rounded text-sm font-semibold transition",
                            page === safeCurrentPage
                              ? "bg-blue-600 text-white shadow-sm hover:bg-blue-500 dark:bg-blue-600 dark:text-white"
                              : "text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white",
                          )}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setPageState({
                      page: Math.min(totalPages, safeCurrentPage + 1),
                      contextKey: paginationContextKey,
                    })
                  }
                  disabled={safeCurrentPage === totalPages}
                  className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-white"
                  aria-label="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="hidden text-sm font-medium text-slate-500 dark:text-slate-400 md:block">
                Page {safeCurrentPage} of {totalPages}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
