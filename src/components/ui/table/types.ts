import type React from "react";
import type { PaginationMeta } from "@/lib/pagination";

export type ServerPaginationConfig = {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
};

/** When set, the toolbar search is controlled by the parent and skips in-memory filtering. */
export type ServerSearchConfig = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

/** When set, filter/sort/group are controlled by the parent and skip in-memory processing. */
export type ServerGridConfig = {
  filters: FilterItem[];
  rootGate: FilterGate;
  sort: SortRule[];
  groupBy: string | null;
  onFiltersChange: (items: FilterItem[], gate: FilterGate) => void;
  onSortChange: (rules: SortRule[]) => void;
  onGroupByChange: (field: string | null) => void;
  /** True per-group counts from meta.groups, keyed by the group's raw value ("" = blank/NULL). */
  groupCounts?: { value: string; count: number }[];
};

export type Column<T> = {
  key: keyof T | string;
  title: string;
  render?: (row: T) => React.ReactNode;
  getValue?: (row: T) => React.ReactNode;
  type?: "text" | "select" | "date";
  options?: Array<{ label: string; value: string }>;
  /** Set false when the backend doesn't accept this field for that grid control. Default true. */
  filterable?: boolean;
  sortable?: boolean;
  groupable?: boolean;
};

export type TableProps<T> = {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  rowsPerPage?: number;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
  serverPagination?: ServerPaginationConfig;
  serverSearch?: ServerSearchConfig;
  serverGrid?: ServerGridConfig;
  emptyText?: string;
  emptyState?: React.ReactNode;
  /** @deprecated Toolbar/filters now always render when data is empty. */
  showTableWhenEmpty?: boolean;
  showToolbarTitle?: boolean;
  headerContent?: React.ReactNode;
  onRowClick?: (row: T) => void;
  title: string;
  description?: string;
};

export type SortDirection = "asc" | "desc";

export type FilterOperator =
  | "contains"
  | "does_not_contain"
  | "is"
  | "is_not"
  | "is_on"
  | "is_before"
  | "is_after"
  | "is_between"
  | "is_empty"
  | "is_not_empty";

export type FilterGate = "AND" | "OR";

export type FilterCondition = {
  id: string;
  field: string;
  operator: FilterOperator;
  value: string;
};

export type FilterItem =
  | { id: string; type: "condition"; condition: FilterCondition }
  | { id: string; type: "group"; gate: FilterGate; items: FilterItem[] };

export type GroupRule = { field: string; direction: SortDirection };
export type SortRule = { field: string; direction: SortDirection };

export type GroupNode<T> = {
  id: string;
  label: string;
  level: number;
  rows: T[];
  children: GroupNode<T>[] | null;
  /** True count from serverGrid.groupCounts; falls back to rows.length when absent. */
  count?: number;
};

export type SelectableColumn = { value: string; label: string };

export type PageState = { page: number; contextKey: string };
