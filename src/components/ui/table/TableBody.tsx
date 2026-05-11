

import clsx from "clsx";
import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { EmailLink } from "../EmailLink";
import type { Column, GroupNode } from "./types";
import { getCellValue, isEmailColumn } from "./utils";

function renderCellValue<T>(row: T, column: Column<T>): React.ReactNode {
  if (column.render) return column.render(row);
  const value = getCellValue(row, column);
  if (isEmailColumn(column)) return <EmailLink value={String(value ?? "")} />;
  return value;
}

interface GroupedRowsProps<T> {
  groups: GroupNode<T>[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  collapsedGroups: Record<string, boolean>;
  onToggleGroup: (id: string) => void;
  showCounts: boolean;
  pageKey: string;
}

function GroupedRows<T>({
  groups,
  columns,
  onRowClick,
  collapsedGroups,
  onToggleGroup,
  showCounts,
  pageKey,
}: GroupedRowsProps<T>): React.ReactNode {
  return groups.map((group) => (
    <React.Fragment key={group.id}>
      <tr>
        <td colSpan={columns.length} className="px-4 py-2">
          <button
            type="button"
            onClick={() => onToggleGroup(group.id)}
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
        (group.children && group.children.length > 0 ? (
          <GroupedRows
            groups={group.children}
            columns={columns}
            onRowClick={onRowClick}
            collapsedGroups={collapsedGroups}
            onToggleGroup={onToggleGroup}
            showCounts={showCounts}
            pageKey={pageKey}
          />
        ) : (
          group.rows.map((row, index) => (
            <tr
              key={`${group.id}-${pageKey}-${index}`}
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
          ))
        ))}
    </React.Fragment>
  ));
}

interface TableBodyProps<T> {
  groupedData: GroupNode<T>[] | null;
  paginatedData: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  collapsedGroups: Record<string, boolean>;
  onToggleGroup: (id: string) => void;
  showCounts: boolean;
  emptyState?: React.ReactNode;
  emptyText: string;
  safeCurrentPage: number;
}

export function TableBody<T>({
  groupedData,
  paginatedData,
  columns,
  onRowClick,
  collapsedGroups,
  onToggleGroup,
  showCounts,
  emptyState,
  emptyText,
  safeCurrentPage,
}: TableBodyProps<T>) {
  return (
    <tbody className="divide-y divide-slate-200/80 dark:divide-slate-600">
      {groupedData ? (
        <GroupedRows
          groups={groupedData}
          columns={columns}
          onRowClick={onRowClick}
          collapsedGroups={collapsedGroups}
          onToggleGroup={onToggleGroup}
          showCounts={showCounts}
          pageKey={String(safeCurrentPage)}
        />
      ) : paginatedData.length === 0 ? (
        <tr>
          <td colSpan={columns.length} className="px-0 py-0">
            {emptyState ?? (
              <div className="p-10 text-center text-gray-500">{emptyText}</div>
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
  );
}
