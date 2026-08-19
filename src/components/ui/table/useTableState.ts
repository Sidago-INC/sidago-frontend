

import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
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
import {
  DEFAULT_PAGE_SIZE,
  getPageNumbers,
  getPaginationRange,
} from "@/lib/pagination";
import type {
  ServerGridConfig,
  ServerPaginationConfig,
  ServerSearchConfig,
} from "./types";

interface UseTableStateOptions<T> {
  data: T[];
  columns: Column<T>[];
  title: string;
  initialRowsPerPage?: number;
  serverPagination?: ServerPaginationConfig;
  serverSearch?: ServerSearchConfig;
  serverGrid?: ServerGridConfig;
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
  sortableColumns: SelectableColumn[];
  groupableColumns: SelectableColumn[];
  columnMap: Map<string, Column<T>>;
  processedData: T[];
  groupedData: GroupNode<T>[] | null;
  safeCurrentPage: number;
  totalPages: number;
  pageNumbers: number[];
  paginatedData: T[];
  paginationStart: number;
  paginationEnd: number;
  totalCount: number;
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
  initialRowsPerPage = DEFAULT_PAGE_SIZE,
  serverPagination,
  serverSearch,
  serverGrid,
}: UseTableStateOptions<T>): UseTableStateReturn<T> {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const tableElementRef = useRef<HTMLTableElement | null>(null);

  const [localGroupRules, setLocalGroupRules] = useState<GroupRule[]>([]);
  const [localSortRules, setLocalSortRules] = useState<SortRule[]>([]);
  const [showCounts, setShowCounts] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});
  const [filterSearch, setFilterSearch] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [localRootFilterGate, setLocalRootFilterGate] =
    useState<FilterGate>("AND");
  const [localFilterItems, setLocalFilterItems] = useState<FilterItem[]>([]);

  const filterItems = serverGrid ? serverGrid.filters : localFilterItems;
  const rootFilterGate = serverGrid ? serverGrid.rootGate : localRootFilterGate;
  const sortRules = serverGrid ? serverGrid.sort : localSortRules;
  const groupRules: GroupRule[] = serverGrid
    ? serverGrid.groupBy
      ? [{ field: serverGrid.groupBy, direction: "asc" }]
      : []
    : localGroupRules;

  const setFilterItems: Dispatch<SetStateAction<FilterItem[]>> = (value) => {
    if (serverGrid) {
      const next =
        typeof value === "function" ? value(serverGrid.filters) : value;
      serverGrid.onFiltersChange(next, serverGrid.rootGate);
      return;
    }
    setLocalFilterItems(value);
  };

  const setRootFilterGate: Dispatch<SetStateAction<FilterGate>> = (value) => {
    if (serverGrid) {
      const next =
        typeof value === "function" ? value(serverGrid.rootGate) : value;
      serverGrid.onFiltersChange(serverGrid.filters, next);
      return;
    }
    setLocalRootFilterGate(value);
  };

  const setSortRules: Dispatch<SetStateAction<SortRule[]>> = (value) => {
    if (serverGrid) {
      const next = typeof value === "function" ? value(serverGrid.sort) : value;
      serverGrid.onSortChange(next);
      return;
    }
    setLocalSortRules(value);
  };

  const setGroupRules: Dispatch<SetStateAction<GroupRule[]>> = (value) => {
    if (serverGrid) {
      const next = typeof value === "function" ? value(groupRules) : value;
      // The backend accepts a single groupBy field. GroupPanel's column list
      // appends the clicked field rather than replacing (it's built for
      // multi-level client grouping), so the most-recently-added rule is the
      // one the user just picked — take the last item, not the first.
      serverGrid.onGroupByChange(next[next.length - 1]?.field ?? null);
      return;
    }
    setLocalGroupRules(value);
  };

  const [rowsPerPage, setRowsPerPageState] = useState(
    serverPagination?.meta.per_page ?? initialRowsPerPage,
  );
  const [pageState, setPageState] = useState<PageState>({
    page: 1,
    contextKey: "",
  });

  useEffect(() => {
    if (serverPagination) {
      setRowsPerPageState(serverPagination.meta.per_page);
      return;
    }

    setRowsPerPageState(initialRowsPerPage);
  }, [initialRowsPerPage, serverPagination]);

  const selectableColumns = useMemo(
    () =>
      columns
        .filter((column) => column.filterable !== false)
        .map((column) => ({
          value: String(column.key),
          label: column.title,
        })),
    [columns],
  );

  const sortableColumns = useMemo(
    () =>
      columns
        .filter((column) => column.sortable !== false)
        .map((column) => ({
          value: String(column.key),
          label: column.title,
        })),
    [columns],
  );

  const groupableColumns = useMemo(
    () =>
      columns
        .filter((column) => column.groupable !== false)
        .map((column) => ({
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
    // Filters (and search) are applied by the API; the page's rows need no local filtering.
    if (serverGrid) return data;

    return data.filter((row) => {
      // Server search is applied by the API; do not filter the current page in memory.
      const searchMatches = serverSearch
        ? true
        : !filterSearch.trim()
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
  }, [
    columnMap,
    columns,
    data,
    filterItems,
    filterSearch,
    rootFilterGate,
    serverGrid,
    serverSearch,
  ]);

  const processedData = useMemo(() => {
    if (serverGrid) return filteredData;

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
  }, [columnMap, filteredData, serverGrid, sortRules]);

  const groupedData = useMemo<GroupNode<T>[] | null>(() => {
    const activeGroupRules = groupRules.filter((rule) => rule.field);
    if (activeGroupRules.length === 0) return null;
    const nodes = buildGroupNodes(processedData, activeGroupRules, columnMap);

    if (!serverGrid?.groupCounts) return nodes;

    // True totals for the whole row-set, not just the rows loaded on this page.
    const countByValue = new Map(
      serverGrid.groupCounts.map((group) => [group.value, group.count]),
    );
    return nodes.map((node) => ({
      ...node,
      count: countByValue.get(node.label === "Unknown" ? "" : node.label),
    }));
  }, [columnMap, groupRules, processedData, serverGrid]);

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

  const totalPages = serverPagination
    ? serverPagination.meta.total_pages
    : Math.max(1, Math.ceil(processedData.length / rowsPerPage));
  const currentPage = serverPagination
    ? serverPagination.meta.current_page
    : pageState.contextKey === paginationContextKey
      ? pageState.page
      : 1;
  const safeCurrentPage = serverPagination
    ? currentPage
    : Math.min(currentPage, totalPages);

  const pageNumbers = useMemo(
    () => getPageNumbers(safeCurrentPage, totalPages),
    [safeCurrentPage, totalPages],
  );

  const paginatedData = useMemo(() => {
    if (serverPagination) {
      return processedData;
    }

    const startIndex = (safeCurrentPage - 1) * rowsPerPage;
    return processedData.slice(startIndex, startIndex + rowsPerPage);
  }, [processedData, rowsPerPage, safeCurrentPage, serverPagination]);

  const paginationRange = serverPagination
    ? getPaginationRange(serverPagination.meta, processedData.length)
    : {
        start: processedData.length ? (safeCurrentPage - 1) * rowsPerPage + 1 : 0,
        end: Math.min(safeCurrentPage * rowsPerPage, processedData.length),
      };
  const paginationStart = paginationRange.start;
  const paginationEnd = paginationRange.end;
  const totalCount = serverPagination
    ? serverPagination.meta.total_count
    : processedData.length;

  const setRowsPerPage: Dispatch<SetStateAction<number>> = (value) => {
    if (serverPagination) {
      const nextValue =
        typeof value === "function" ? value(serverPagination.meta.per_page) : value;
      serverPagination.onPerPageChange(nextValue);
      return;
    }

    setRowsPerPageState(value);
  };

  const handleSetPageState: Dispatch<SetStateAction<PageState>> = (value) => {
    if (serverPagination) {
      const nextState =
        typeof value === "function"
          ? value({
              page: serverPagination.meta.current_page,
              contextKey: paginationContextKey,
            })
          : value;
      serverPagination.onPageChange(nextState.page);
      return;
    }

    setPageState(value);
  };

  const activeSearchValue = serverSearch?.value ?? filterSearch;
  const activeFilterConditionCount =
    countActiveFilterItems(filterItems) +
    Number(Boolean(activeSearchValue.trim()));

  const closeSearch = () => {
    setIsSearchOpen(false);
    if (serverSearch) {
      serverSearch.onChange("");
      return;
    }
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
    sortableColumns,
    groupableColumns,
    columnMap,
    processedData,
    groupedData,
    safeCurrentPage,
    totalPages,
    pageNumbers,
    paginatedData,
    paginationStart,
    paginationEnd,
    totalCount,
    activeFilterConditionCount,
    paginationContextKey,
    closeSearch,
    handlePrintPage,
    handlePrintData,
    handleExportSvg,
    setPageState: handleSetPageState,
    appendFilterItemToGroup,
  };
}
