import type React from "react";

export type Column<T> = {
  key: keyof T | string;
  title: string;
  render?: (row: T) => React.ReactNode;
  getValue?: (row: T) => React.ReactNode;
  type?: "text" | "select" | "date";
  options?: Array<{ label: string; value: string }>;
};

export type TableProps<T> = {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  emptyText?: string;
  emptyState?: React.ReactNode;
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
};

export type SelectableColumn = { value: string; label: string };

export type PageState = { page: number; contextKey: string };
