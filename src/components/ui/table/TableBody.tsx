

import clsx from "clsx";
import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { EmailLink } from "../EmailLink";
import { LongTextCell } from "../LongTextCell";
import { CellPopover } from "../CellPopover";
import type { Column, GroupNode } from "./types";
import { getCellValue, isEmailColumn } from "./utils";

function getDefaultColumnWidth<T>(column: Column<T>): number {
  const key = String(column.key).toLowerCase();
  const title = column.title.toLowerCase();

  if (column.longText || /(description|notes|details|summary|comments?|body|message)/.test(`${key} ${title}`)) {
    return 220;
  }
  if (/(date|time|last.*date|called.*date|action.*date|to be called by|timezone|country|status|lead type|contact type)/.test(`${key} ${title}`)) {
    return 130;
  }
  if (/(phone|email|website|twitter|zip|symbol|id)/.test(`${key} ${title}`)) {
    return 130;
  }
  if (/(company name|full name|city|state|market cap|lead name)/.test(`${key} ${title}`)) {
    return 170;
  }
  return 140;
}

function getColumnStyle<T>(column: Column<T>, columnWidths: Record<string, number>): React.CSSProperties {
  const key = String(column.key);
  const width = columnWidths[key] ?? Number(column.width ?? getDefaultColumnWidth(column));
  const minWidth = column.minWidth ?? 80;
  const maxWidth = column.maxWidth ?? (column.longText ? 240 : 220);

  return {
    width: `${Math.max(minWidth, Math.min(width, maxWidth))}px`,
    minWidth: `${minWidth}px`,
    maxWidth: `${maxWidth}px`,
    overflow: "hidden",
  };
}

function renderTooltipValue(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function getCellTooltip<T>(row: T, column: Column<T>): string | undefined {
  // Prioritize getValue if it exists - it's the canonical source of the cell value
  if (column.getValue) {
    const value = column.getValue(row);
    if (typeof value === "string" || typeof value === "number") {
      const text = String(value ?? "").trim();
      if (text) return text;
    }
  }

  // Fall back to extracting from render function
  if (column.render) {
    const rendered = column.render(row);
    if (React.isValidElement(rendered)) {
      const props = rendered.props as {
        children?: unknown;
        value?: unknown;
        title?: string;
      };
      // Check if title is already set
      if (props.title) return props.title;
      
      const tooltipText = renderTooltipValue(
        typeof props.children === "string"
          ? props.children
          : typeof props.value === "string"
            ? props.value
            : undefined,
      );
      return tooltipText || undefined;
    }
    // If render returns a string directly, use it as tooltip
    if (typeof rendered === "string" || typeof rendered === "number") {
      const text = String(rendered ?? "").trim();
      if (text && text !== "—") return text;
    }
    return undefined;
  }

  // Final fallback: try to extract from the raw value
  const value = getCellValue(row, column);
  if (typeof value === "string" || typeof value === "number") {
    const text = String(value ?? "").trim();
    return text || undefined;
  }

  return undefined;
}

function renderCellValue<T>(row: T, column: Column<T>, columnWidths: Record<string, number>): React.ReactNode {
  if (column.render) {
    const rendered = column.render(row);
    if (React.isValidElement(rendered)) {
      const props = rendered.props as {
        children?: unknown;
        value?: unknown;
      };
      const tooltipText = renderTooltipValue(
        typeof props.children === "string"
          ? props.children
          : typeof props.value === "string"
            ? props.value
            : undefined,
      );
      if (tooltipText) {
        return React.cloneElement(
          rendered as React.ReactElement<Record<string, unknown>>,
          {
            title: tooltipText,
            "aria-label": tooltipText,
          },
        );
      }
    }
    return rendered;
  }

  const value = getCellValue(row, column);
  if (isEmailColumn(column)) {
    const text = String(value ?? "").trim();
    return text ? (
      <CellPopover content={text}>
        <EmailLink 
          value={text} 
        />
      </CellPopover>
    ) : (
      <span className="text-slate-400 dark:text-slate-500">—</span>
    );
  }

  if (typeof value === "string" || typeof value === "number") {
    const text = String(value ?? "").trim();
    if (!text) return <span className="text-slate-400 dark:text-slate-500">—</span>;
    if (column.longText || text.length > 80 || /\n/.test(text)) {
      return <LongTextCell value={text} label={column.title} preview={90} />;
    }
    return (
      <CellPopover content={text}>
        <span
          className="block max-w-full truncate text-left cursor-help"
          style={{
            maxWidth: getColumnStyle(column, columnWidths).maxWidth ?? "220px",
          }}
        >
          {text}
        </span>
      </CellPopover>
    );
  }

  if (value === null || value === undefined || value === "") {
    return <span className="text-slate-400 dark:text-slate-500">—</span>;
  }

  const text = String(value).trim();
  return (
    <span className="block max-w-full truncate text-left" title={text} aria-label={text}>
      {value}
    </span>
  );
}

interface GroupedRowsProps<T> {
  groups: GroupNode<T>[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  collapsedGroups: Record<string, boolean>;
  onToggleGroup: (id: string) => void;
  showCounts: boolean;
  pageKey: string;
  onShowOnlyGroup?: (group: GroupNode<T>) => void;
  columnWidths: Record<string, number>;
}

/**
 * True when the server counted rows for this group but none of them are on the
 * page currently loaded. Such a group renders collapsed with its real total,
 * and clicking it filters down to that group rather than expanding onto
 * nothing.
 */
function isEmptyHere<T>(group: GroupNode<T>): boolean {
  // A parent holds no rows of its own — its rows live in its children — so it
  // must always expand. Only a LEAF with a real count but nothing on this page
  // is "elsewhere".
  if (group.children?.length) return false;
  return group.rows.length === 0 && (group.count ?? 0) > 0;
}

function GroupedRows<T>({
  groups,
  columns,
  onRowClick,
  collapsedGroups,
  onToggleGroup,
  showCounts,
  pageKey,
  onShowOnlyGroup,
  columnWidths,
}: GroupedRowsProps<T>): React.ReactNode {
  return groups.map((group) => (
    <React.Fragment key={group.id}>
      <tr>
        <td colSpan={columns.length} className="px-4 py-2">
          <button
            type="button"
            onClick={() =>
              isEmptyHere(group) && onShowOnlyGroup
                ? onShowOnlyGroup(group)
                : onToggleGroup(group.id)
            }
            title={
              isEmptyHere(group)
                ? `Show only ${group.label} (${group.count ?? 0} rows)`
                : undefined
            }
            className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 cursor-pointer dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <span
              className="flex items-center gap-2"
              style={{ paddingLeft: `${group.level * 16}px` }}
            >
              {isEmptyHere(group) || collapsedGroups[group.id] ? (
                <ChevronRight size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
              <span>{group.label}</span>
              {showCounts && (
                <span className="rounded-md bg-slate-200 px-2 py-0.5 text-xs text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                  {group.count ?? group.rows.length}
                </span>
              )}
              {isEmptyHere(group) && onShowOnlyGroup && (
                <span className="text-xs font-normal text-indigo-500 dark:text-indigo-400">
                  Open
                </span>
              )}
            </span>
          </button>
        </td>
      </tr>

      {!isEmptyHere(group) &&
        !collapsedGroups[group.id] &&
        (group.children && group.children.length > 0 ? (
          <GroupedRows
            groups={group.children}
            columns={columns}
            onRowClick={onRowClick}
            collapsedGroups={collapsedGroups}
            onToggleGroup={onToggleGroup}
            showCounts={showCounts}
            pageKey={pageKey}
            onShowOnlyGroup={onShowOnlyGroup}
            columnWidths={columnWidths}
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
              {columns.map((col) => {
                const cellTooltip = getCellTooltip(row, col);
                return (
                  <td
                    key={String(col.key)}
                    className="overflow-hidden px-6 py-4 text-sm text-gray-700 transition-colors dark:text-slate-200 whitespace-nowrap"
                    style={getColumnStyle(col, columnWidths)}
                  >
                    <CellPopover content={cellTooltip ?? ""}>
                      {renderCellValue(row, col, columnWidths)}
                    </CellPopover>
                  </td>
                );
              })}
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
  onShowOnlyGroup?: (group: GroupNode<T>) => void;
  columnWidths: Record<string, number>;
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
  onShowOnlyGroup,
  columnWidths,
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
          onShowOnlyGroup={onShowOnlyGroup}
          columnWidths={columnWidths}
        />
      ) : paginatedData.length === 0 ? (
        <tr>
          <td colSpan={columns.length} className="px-0 py-0">
            {emptyState ?? (
              <div className="p-10 text-center text-gray-500 dark:text-slate-400">
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
            {columns.map((col) => {
              const cellTooltip = getCellTooltip(row, col);
              return (
                <td
                  key={String(col.key)}
                  className="overflow-hidden px-6 py-4 text-sm text-gray-700 transition-colors dark:text-white whitespace-nowrap"
                  style={getColumnStyle(col, columnWidths)}
                >
                  <CellPopover content={cellTooltip ?? ""}>
                    {renderCellValue(row, col, columnWidths)}
                  </CellPopover>
                </td>
              );
            })}
          </tr>
        ))
      )}
    </tbody>
  );
}
