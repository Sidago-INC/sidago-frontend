

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  Column,
  FilterCondition,
  FilterGate,
  FilterItem,
  GroupNode,
  GroupRule,
  PageState,
  SelectableColumn,
  SortRule,
} from "./types";
import {
  buildGroupNodes,
  countActiveFilterItems,
  getCellValue,
  getColumnType,
  isFilterConditionActive,
  normalizeDateValue,
  parseDateRangeFilterValue,
  updateFilterGroup,
} from "./utils";

interface UseTableStateOptions<T> {
  data: T[];
  columns: Column<T>[];
  title: string;
  initialRowsPerPage?: number;
}

export interface UseTableStateReturn<T> {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  tableElementRef: React.RefObject<HTMLTableElement | null>;
  groupRules: GroupRule[];
  setGroupRules: React.Dispatch<React.SetStateAction<GroupRule[]>>;
  showCounts: boolean;
  setShowCounts: React.Dispatch<React.SetStateAction<boolean>>;
  collapsedGroups: Record<string, boolean>;
  setCollapsedGroups: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  filterSearch: string;
  setFilterSearch: React.Dispatch<React.SetStateAction<string>>;
  isSearchOpen: boolean;
  setIsSearchOpen: React.Dispatch<React.SetStateAction<boolean>>;
  rootFilterGate: FilterGate;
  setRootFilterGate: React.Dispatch<React.SetStateAction<FilterGate>>;
  filterItems: FilterItem[];
  setFilterItems: React.Dispatch<React.SetStateAction<FilterItem[]>>;
  sortRules: SortRule[];
  setSortRules: React.Dispatch<React.SetStateAction<SortRule[]>>;
  rowsPerPage: number;
  setRowsPerPage: React.Dispatch<React.SetStateAction<number>>;
  selectableColumns: SelectableColumn[];
  columnMap: Map<string, Column<T>>;
  processedData: T[];
  groupedData: GroupNode<T>[] | null;
  safeCurrentPage: number;
  totalPages: number;
  pageNumbers: number[];
  paginatedData: T[];
  paginationStart: number;
  paginationEnd: number;
  activeFilterConditionCount: number;
  paginationContextKey: string;
  closeSearch: () => void;
  handlePrintPage: () => void;
  handlePrintData: () => void;
  handleExportSvg: () => void;
  setPageState: React.Dispatch<React.SetStateAction<PageState>>;
  appendFilterItemToGroup: (groupId: string, item: FilterItem) => void;
}

export function useTableState<T>({
  data,
  columns,
  title,
  initialRowsPerPage = 10,
}: UseTableStateOptions<T>): UseTableStateReturn<T> {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const tableElementRef = useRef<HTMLTableElement | null>(null);

  const [groupRules, setGroupRules] = useState<GroupRule[]>([]);
  const [sortRules, setSortRules] = useState<SortRule[]>([]);
  const [showCounts, setShowCounts] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});
  const [filterSearch, setFilterSearch] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [rootFilterGate, setRootFilterGate] = useState<FilterGate>("AND");
  const [filterItems, setFilterItems] = useState<FilterItem[]>([]);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);
  const [pageState, setPageState] = useState<PageState>({
    page: 1,
    contextKey: "",
  });

  useEffect(() => {
    setRowsPerPage(initialRowsPerPage);
  }, [initialRowsPerPage]);

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

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      const searchMatches = !filterSearch.trim()
        ? true
        : columns.some((column) =>
            String(getCellValue(row, column) ?? "")
              .toLowerCase()
              .includes(filterSearch.trim().toLowerCase()),
          );

      if (!searchMatches) return false;

      const matchesCondition = (condition: FilterCondition): boolean => {
        const column = columnMap.get(condition.field);
        const rawValue = getCellValue(row, column ?? condition.field);
        const columnType = getColumnType(column);
        const value = String(rawValue ?? "").toLowerCase();
        const query = condition.value.trim().toLowerCase();

        if (columnType === "date") {
          const normalizedValue = normalizeDateValue(rawValue);

          if (condition.operator === "is_empty") return !normalizedValue;
          if (condition.operator === "is_not_empty")
            return Boolean(normalizedValue);
          if (!normalizedValue) return false;

          if (condition.operator === "is_between") {
            const range = parseDateRangeFilterValue(condition.value);
            const start = range?.from
              ? range.from.toISOString().slice(0, 10)
              : undefined;
            const endDate = range?.to ?? range?.from;
            const end = endDate
              ? endDate.toISOString().slice(0, 10)
              : undefined;
            if (!start && !end) return false;
            return (
              (!start || normalizedValue >= start) &&
              (!end || normalizedValue <= end)
            );
          }

          if (!query) return false;

          switch (condition.operator) {
            case "is_on":
            case "is":
              return normalizedValue === query;
            case "is_before":
              return normalizedValue < query;
            case "is_after":
              return normalizedValue > query;
            case "is_not":
              return normalizedValue !== query;
            default:
              return false;
          }
        }

        switch (condition.operator) {
          case "contains":
            return value.includes(query);
          case "does_not_contain":
            return !value.includes(query);
          case "is":
            return value === query;
          case "is_not":
            return value !== query;
          case "is_empty":
            return value.trim() === "";
          case "is_not_empty":
            return value.trim() !== "";
          default:
            return false;
        }
      };

      const getItemMatch = (
        item: FilterItem,
      ): { id: string; matches: boolean } | null => {
        if (item.type === "condition") {
          return isFilterConditionActive(item.condition)
            ? { id: item.id, matches: matchesCondition(item.condition) }
            : null;
        }

        const activeChildren = item.items
          .map(getItemMatch)
          .filter((child): child is { id: string; matches: boolean } =>
            Boolean(child),
          );

        if (activeChildren.length === 0) return null;

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

      if (activeItems.length === 0) return true;

      return rootFilterGate === "AND"
        ? activeItems.every((item) => item.matches)
        : activeItems.some((item) => item.matches);
    });
  }, [columnMap, columns, data, filterItems, filterSearch, rootFilterGate]);

  const processedData = useMemo(() => {
    const activeSortRules = sortRules.filter((rule) => rule.field);
    if (activeSortRules.length === 0) return filteredData;

    return [...filteredData].sort((left, right) => {
      for (const rule of activeSortRules) {
        const leftValue = String(
          getCellValue(left, columnMap.get(rule.field) ?? rule.field) ?? "",
        ).toLowerCase();
        const rightValue = String(
          getCellValue(right, columnMap.get(rule.field) ?? rule.field) ?? "",
        ).toLowerCase();

        if (leftValue === rightValue) continue;
        const result = leftValue > rightValue ? 1 : -1;
        return rule.direction === "asc" ? result : result * -1;
      }
      return 0;
    });
  }, [columnMap, filteredData, sortRules]);

  const groupedData = useMemo<GroupNode<T>[] | null>(() => {
    const activeGroupRules = groupRules.filter((rule) => rule.field);
    if (activeGroupRules.length === 0) return null;
    return buildGroupNodes(processedData, activeGroupRules, columnMap);
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

  const activeFilterConditionCount =
    countActiveFilterItems(filterItems) + Number(Boolean(filterSearch.trim()));

  const closeSearch = () => {
    setIsSearchOpen(false);
    setFilterSearch("");
  };

  const handlePrintPage = () => {
    if (typeof window === "undefined") return;
    window.print();
  };

  const handlePrintData = () => {
    if (typeof window === "undefined") return;
    const tableMarkup = tableElementRef.current?.outerHTML;
    if (!tableMarkup) return;

    const printWindow = window.open("", "_blank", "width=1200,height=800");
    if (!printWindow) return;

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
    if (typeof window === "undefined") return;

    const headers = columns.map((column) => column.title);
    const rowLines = processedData.map((row) =>
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

  const appendFilterItemToGroup = (groupId: string, item: FilterItem) => {
    setFilterItems((items) =>
      updateFilterGroup(items, groupId, (group) => ({
        ...group,
        items: [...group.items, item],
      })),
    );
  };

  return {
    scrollContainerRef,
    tableElementRef,
    groupRules,
    setGroupRules,
    showCounts,
    setShowCounts,
    collapsedGroups,
    setCollapsedGroups,
    filterSearch,
    setFilterSearch,
    isSearchOpen,
    setIsSearchOpen,
    rootFilterGate,
    setRootFilterGate,
    filterItems,
    setFilterItems,
    sortRules,
    setSortRules,
    rowsPerPage,
    setRowsPerPage,
    selectableColumns,
    columnMap,
    processedData,
    groupedData,
    safeCurrentPage,
    totalPages,
    pageNumbers,
    paginatedData,
    paginationStart,
    paginationEnd,
    activeFilterConditionCount,
    paginationContextKey,
    closeSearch,
    handlePrintPage,
    handlePrintData,
    handleExportSvg,
    setPageState,
    appendFilterItemToGroup,
  };
}
