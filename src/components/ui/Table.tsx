
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import {
  Ellipsis,
  FileDown,
  Loader2,
  Printer,
  Search,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { FilterPanel } from "./table/FilterPanel";
import { GroupPanel } from "./table/GroupPanel";
import { SortPanel } from "./table/SortPanel";
import { TableBody } from "./table/TableBody";
import { TablePagination } from "./table/TablePagination";
import {
  MAX_SERVER_GROUP_LEVELS,
  useTableState,
} from "./table/useTableState";

export type {
  Column,
  ServerGridConfig,
  ServerPaginationConfig,
  ServerSearchConfig,
  TableProps,
} from "./table/types";

type Props<T> = import("./table/types").TableProps<T>;

const TOOLBAR_BUTTON_CLASS =
  "flex h-9 cursor-pointer items-center justify-center rounded-xl px-3 text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900";

const TOOLBAR_ICON_BUTTON_CLASS =
  "flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900";

const RESIZE_HANDLE_WIDTH = 8;
const RESIZE_HANDLE_LINE_WIDTH = 2;
const VIRTUAL_ROW_HEIGHT = 53;
const VIRTUAL_ROW_OVERSCAN = 12;
const VIRTUALIZATION_THRESHOLD = 100;

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;

  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;

  return Boolean(
    target.closest("input, textarea, select, [contenteditable='true']"),
  );
}

function getDefaultColumnWidth<T>(column: import("./table/types").Column<T>): number {
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

export function Table<T>({
  data,
  columns,
  isLoading,
  rowsPerPage: initialRowsPerPage,
  onRowsPerPageChange,
  serverPagination,
  serverSearch,
  serverGrid,
  title,
  description,
  emptyText = "No data found",
  emptyState,
  showTableWhenEmpty: _showTableWhenEmpty = false,
  showToolbarTitle = true,
  headerContent,
  onRowClick,
}: Props<T>) {
  const state = useTableState({
    data,
    columns,
    title,
    initialRowsPerPage,
    serverPagination,
    serverSearch,
    serverGrid,
  });

  const columnWidthsKey = useMemo(
    () => columns.map((column) => String(column.key)).join("|"),
    [columns],
  );
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [hoveredHeaderKey, setHoveredHeaderKey] = useState<string | null>(null);
  // This is a viewport coordinate, taken from the actual header cell rather
  // than calculated from configured widths. CSS table layout can distribute
  // widths differently from those configured values, so summing widths can
  // place the guide inside a column.
  const [resizeIndicatorLeft, setResizeIndicatorLeft] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [virtualScrollTop, setVirtualScrollTop] = useState(0);
  const [virtualViewportHeight, setVirtualViewportHeight] = useState(600);
  const dragState = useRef<{
    key: string;
    startX: number;
    startWidth: number;
    columnLeftOffset: number;
    currentWidth: number;
    startIndicatorLeft: number;
    headerElement: HTMLTableCellElement;
  } | null>(null);
  const resizeFrameRef = useRef<number | null>(null);
  const pendingResizeXRef = useRef<number | null>(null);

  const resolvedColumnWidths = useMemo(() => {
    const next: Record<string, number> = {};
    for (const column of columns) {
      const key = String(column.key);
      const defaultWidth = Number(column.width ?? getDefaultColumnWidth(column));
      const stored = columnWidths[key];
      next[key] = typeof stored === "number" ? stored : defaultWidth;
    }
    return next;
  }, [columnWidths, columns]);

  useEffect(() => {
    setColumnWidths((current) => {
      const next: Record<string, number> = {};
      for (const column of columns) {
        const key = String(column.key);
        const currentWidth = current[key];
        const defaultWidth = Number(column.width ?? getDefaultColumnWidth(column));
        next[key] = typeof currentWidth === "number" ? currentWidth : defaultWidth;
      }
      return next;
    });
  }, [columnWidthsKey, columns]);

  const handleResizeStart = (
    event: React.PointerEvent<HTMLElement>,
    column: import("./table/types").Column<T>,
  ) => {
    if (column.resizable === false) return;
    if (event.button !== 0) return;
    event.preventDefault();
    
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const headerElement = event.currentTarget.parentElement;
    if (!(headerElement instanceof HTMLTableCellElement)) return;

    // Calculate the column's left offset by summing previous column widths
    let columnLeftOffset = 0;
    for (const col of columns) {
      if (String(col.key) === String(column.key)) break;
      const colKey = String(col.key);
      columnLeftOffset += resolvedColumnWidths[colKey] ?? Number(col.width ?? getDefaultColumnWidth(col));
    }
    
    const startIndicatorLeft = headerElement.getBoundingClientRect().right;
    dragState.current = {
      key: String(column.key),
      startX: event.clientX,
      startWidth:
        resolvedColumnWidths[String(column.key)] ??
        Number(column.width ?? getDefaultColumnWidth(column)),
      columnLeftOffset,
      currentWidth:
        resolvedColumnWidths[String(column.key)] ??
        Number(column.width ?? getDefaultColumnWidth(column)),
      startIndicatorLeft,
      headerElement,
    };

    // Anchor the guide to the rendered right edge of this exact header. The
    // browser may adjust fixed table column widths, making a summed offset
    // inaccurate.
    setResizeIndicatorLeft(startIndicatorLeft);
    setIsDragging(true);
    
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  // Resize work is limited to one paint per frame. Pointer events can arrive
  // far faster than the browser can lay out a wide grid, especially on a
  // trackpad or high-refresh-rate display.
  useEffect(() => {
    if (!isDragging) return;

    const applyPendingResize = () => {
      resizeFrameRef.current = null;
      const clientX = pendingResizeXRef.current;
      pendingResizeXRef.current = null;
      const drag = dragState.current;
      if (!drag || clientX === null) return;

      const column = columns.find((entry) => String(entry.key) === drag.key);
      if (!column) return;

      const minWidth = column.minWidth ?? 80;
      const requestedWidth = Math.max(
        drag.startWidth + clientX - drag.startX,
        minWidth,
      );
      // Columns are unlimited by default. A maximum applies only when the
      // column definition explicitly sets one.
      const nextWidth =
        column.maxWidth === undefined
          ? requestedWidth
          : Math.min(requestedWidth, column.maxWidth);
      drag.currentWidth = nextWidth;
      setColumnWidths((current) =>
        current[drag.key] === nextWidth
          ? current
          : { ...current, [drag.key]: nextWidth },
      );

      const container = scrollContainerRef.current;
      if (container) {
        setResizeIndicatorLeft(
          drag.startIndicatorLeft + nextWidth - drag.startWidth,
        );
      }
    };

    const queueResize = (clientX: number) => {
      pendingResizeXRef.current = clientX;
      if (resizeFrameRef.current === null) {
        resizeFrameRef.current = window.requestAnimationFrame(applyPendingResize);
      }
    };

    const handleGlobalPointerMove = (event: PointerEvent) => {
      event.preventDefault();
      queueResize(event.clientX);
    };

    const updateIndicatorForScroll = () => {
      const drag = dragState.current;
      const container = scrollContainerRef.current;
      if (!drag || !container) return;
      setResizeIndicatorLeft(drag.headerElement.getBoundingClientRect().right);
    };

    const handleGlobalPointerUp = () => {
      if (resizeFrameRef.current !== null) {
        window.cancelAnimationFrame(resizeFrameRef.current);
        applyPendingResize();
      }
      dragState.current = null;
      pendingResizeXRef.current = null;
      setResizeIndicatorLeft(null);
      setIsDragging(false);
    };

    const container = scrollContainerRef.current;
    document.addEventListener("pointermove", handleGlobalPointerMove);
    document.addEventListener("pointerup", handleGlobalPointerUp);
    document.addEventListener("pointercancel", handleGlobalPointerUp);
    container?.addEventListener("scroll", updateIndicatorForScroll, {
      passive: true,
    });

    return () => {
      if (resizeFrameRef.current !== null) {
        window.cancelAnimationFrame(resizeFrameRef.current);
        resizeFrameRef.current = null;
      }
      document.removeEventListener("pointermove", handleGlobalPointerMove);
      document.removeEventListener("pointerup", handleGlobalPointerUp);
      document.removeEventListener("pointercancel", handleGlobalPointerUp);
      container?.removeEventListener("scroll", updateIndicatorForScroll);
    };
  }, [isDragging, columns]);

  const {
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
    hasActiveSearch,
    paginationContextKey,
    closeSearch,
    handlePrintPage,
    handlePrintData,
    handleExportCsv,
    setPageState,
    appendFilterItemToGroup,
  } = state;

  // A 500-row page may otherwise mount thousands of cells and Headless UI
  // popovers. Keep only the rows around the viewport in the DOM. Grouped rows
  // remain unvirtualized because their expandable hierarchy has variable
  // heights and must stay fully accessible.
  const shouldVirtualizeRows =
    !groupedData && paginatedData.length >= VIRTUALIZATION_THRESHOLD;
  const virtualRows = useMemo(() => {
    if (!shouldVirtualizeRows) return undefined;

    const startIndex = Math.max(
      0,
      Math.floor(virtualScrollTop / VIRTUAL_ROW_HEIGHT) - VIRTUAL_ROW_OVERSCAN,
    );
    const endIndex = Math.min(
      paginatedData.length,
      Math.ceil(
        (virtualScrollTop + virtualViewportHeight) / VIRTUAL_ROW_HEIGHT,
      ) + VIRTUAL_ROW_OVERSCAN,
    );

    return {
      startIndex,
      endIndex,
      topSpacerHeight: startIndex * VIRTUAL_ROW_HEIGHT,
      bottomSpacerHeight:
        (paginatedData.length - endIndex) * VIRTUAL_ROW_HEIGHT,
    };
  }, [
    paginatedData.length,
    shouldVirtualizeRows,
    virtualScrollTop,
    virtualViewportHeight,
  ]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let frame: number | undefined;
    const updateViewport = () => {
      setVirtualViewportHeight(container.clientHeight || 600);
    };
    const handleScroll = () => {
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        setVirtualScrollTop(container.scrollTop);
      });
    };

    updateViewport();
    container.addEventListener("scroll", handleScroll, { passive: true });
    const observer = new ResizeObserver(updateViewport);
    observer.observe(container);

    return () => {
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      container.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, [scrollContainerRef]);

  useEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "auto" });
    setVirtualScrollTop(0);
  }, [safeCurrentPage, paginatedData]);

  useEffect(() => {
    onRowsPerPageChange?.(rowsPerPage);
  }, [onRowsPerPageChange, rowsPerPage]);

  // A grouped grid is paginated, so a group of 18,383 rows can never be
  // "expanded" on a 100-row page. Clicking one therefore OPENS it: the grid
  // filters to that group and you page inside it. That is why the other groups
  // disappear — they have no rows once the filter is on. This finds that
  // filter so the grid can offer a way back out.
  const groupFields = groupRules.map((rule) => rule.field).filter(Boolean);
  const openedGroup =
    groupFields.length &&
    filterItems.length === groupFields.length &&
    filterItems.every(
      (item, index) =>
        item.type === "condition" &&
        item.condition.field === groupFields[index],
    )
      ? filterItems
          .map((item) =>
            item.type === "condition"
              ? item.condition.value || "(blank)"
              : "",
          )
          .join(" › ")
      : null;

  const handleTableScrollKeys = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    if (isEditableTarget(event.target)) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const horizontalStep = 64;
    const verticalStep = 48;

    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        container.scrollBy({ left: -horizontalStep, behavior: "auto" });
        break;
      case "ArrowRight":
        event.preventDefault();
        container.scrollBy({ left: horizontalStep, behavior: "auto" });
        break;
      case "ArrowUp":
        event.preventDefault();
        container.scrollBy({ top: -verticalStep, behavior: "auto" });
        break;
      case "ArrowDown":
        event.preventDefault();
        container.scrollBy({ top: verticalStep, behavior: "auto" });
        break;
      case "Home":
        if (event.shiftKey) {
          event.preventDefault();
          container.scrollTo({ left: 0, behavior: "auto" });
        }
        break;
      case "End":
        if (event.shiftKey) {
          event.preventDefault();
          container.scrollTo({
            left: container.scrollWidth,
            behavior: "auto",
          });
        }
        break;
    }
  };

  const focusScrollContainer = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (isEditableTarget(event.target)) return;

    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.closest("a, button, [role='button']")) return;

    scrollContainerRef.current?.focus({ preventScroll: true });
  };

  // The skeleton replaces the whole table, toolbar included. Show it only on
  // the cold start, when there is genuinely nothing to display. Doing it on
  // every load unmounted the search input the user was typing into, which is
  // what made typing look like a page reload.
  const hasRows = data.length > 0;
  const showSkeleton = Boolean(isLoading) && !hasRows;
  const isRefreshing = Boolean(isLoading) && hasRows;

  if (showSkeleton) {
    return (
      <div className="space-y-3 rounded-2xl bg-white p-4 dark:bg-slate-900">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-10 animate-pulse rounded bg-slate-100 dark:bg-slate-800"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 max-h-[calc(100dvh-3.5rem)] flex-col">
      <div className="relative z-30 mb-2 flex shrink-0 items-center justify-center border-b border-slate-200/80 bg-white/75 px-3 backdrop-blur-md transition-colors dark:border-slate-600 dark:bg-slate-950/70 md:justify-between md:px-8">
        {showToolbarTitle ? (
          <div className="min-w-0 py-2 hidden md:block">
            <h3 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
              {title}
            </h3>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {description}
            </p>
          </div>
        ) : (
          <div className="hidden md:block" />
        )}

        <div className="flex w-full min-w-0 items-center justify-end gap-1 sm:gap-2 md:w-auto">
          {isRefreshing && (
            <Loader2
              size={15}
              className="animate-spin text-slate-400 dark:text-slate-500"
              aria-label="Refreshing"
            />
          )}
          {headerContent}

          <GroupPanel
            groupRules={groupRules}
            setGroupRules={setGroupRules}
            showCounts={showCounts}
            setShowCounts={setShowCounts}
            selectableColumns={groupableColumns}
            maxLevels={serverGrid ? MAX_SERVER_GROUP_LEVELS : undefined}
            buttonClassName={TOOLBAR_BUTTON_CLASS}
          />

          <FilterPanel
            filterItems={filterItems}
            setFilterItems={setFilterItems}
            rootFilterGate={rootFilterGate}
            setRootFilterGate={setRootFilterGate}
            filterSearch={filterSearch}
            setFilterSearch={setFilterSearch}
            selectableColumns={selectableColumns}
            columnMap={
              columnMap as Map<string, import("./table/types").Column<unknown>>
            }
            columns={columns as import("./table/types").Column<unknown>[]}
            activeFilterConditionCount={activeFilterConditionCount}
            buttonClassName={TOOLBAR_BUTTON_CLASS}
            onAppendToGroup={appendFilterItemToGroup}
          />

          <SortPanel
            sortRules={sortRules}
            setSortRules={setSortRules}
            selectableColumns={sortableColumns}
            buttonClassName={TOOLBAR_BUTTON_CLASS}
          />

          {isSearchOpen ? (
            <div className="relative min-w-0 flex-1 md:w-72 md:flex-none">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              />
              <input
                type="text"
                value={serverSearch ? serverSearch.value : filterSearch}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  if (serverSearch) {
                    serverSearch.onChange(nextValue);
                    return;
                  }
                  setFilterSearch(nextValue);
                }}
                placeholder={
                  serverSearch?.placeholder ?? "Search in table"
                }
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
              className={`relative ${TOOLBAR_ICON_BUTTON_CLASS}`}
              aria-label={
                hasActiveSearch ? "Open search (active)" : "Open search"
              }
            >
              <Search size={15} />
              {hasActiveSearch && (
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-sky-500" />
              )}
            </button>
          )}

          <Popover className="relative">
            <PopoverButton className={TOOLBAR_ICON_BUTTON_CLASS}>
              <Ellipsis size={16} />
            </PopoverButton>

            <PopoverPanel
              anchor="bottom end"
              className="z-50 w-56 border border-slate-200 shadow-2xl bg-white rounded-xl p-2 backdrop-blur-md transition-colors dark:border-slate-600 dark:bg-slate-950/70 flex flex-col overflow-hidden"
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
                onClick={handleExportCsv}
                className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                <FileDown size={16} />
                <span>Export the data as CSV</span>
              </button>
            </PopoverPanel>
          </Popover>
        </div>
      </div>

      {openedGroup && (
        <div className="mb-2 flex shrink-0 items-center gap-2 px-4 text-xs text-slate-600 dark:text-slate-300">
          <span>
            Showing only{" "}
            <strong className="font-semibold text-slate-900 dark:text-slate-100">
              {openedGroup}
            </strong>
          </span>
          <button
            type="button"
            onClick={() => setFilterItems([])}
            className="cursor-pointer rounded-md border border-slate-300 px-2 py-0.5 font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Show all groups
          </button>
        </div>
      )}

      <div
        ref={scrollContainerRef}
        tabIndex={0}
        onKeyDown={handleTableScrollKeys}
        onPointerDown={focusScrollContainer}
        className="min-h-0 flex-1 overflow-auto px-4 outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 relative"
        aria-label="Scrollable table"
      >
        {/* Resize indicator line - floats above table during dragging */}
        {resizeIndicatorLeft !== null && (
          <div
            className="fixed pointer-events-none z-50"
            style={{
              left: `${resizeIndicatorLeft}px`,
              top: `${scrollContainerRef.current?.getBoundingClientRect().top ?? 0}px`,
              height: `${scrollContainerRef.current?.getBoundingClientRect().height ?? 0}px`,
              width: 0,
              borderLeft: `${RESIZE_HANDLE_LINE_WIDTH}px solid rgb(14, 165, 233)`,
              boxShadow: "0 0 8px rgba(14, 165, 233, 0.6)",
              boxSizing: "border-box",
              transform: "translateX(-1px)",
            }}
          />
        )}
        
        <table
          ref={tableElementRef}
          className={`w-full min-w-full table-fixed transition-opacity ${
            isRefreshing ? "opacity-60" : "opacity-100"
          }`}
          style={{ borderCollapse: "separate", borderSpacing: 0, tableLayout: "fixed" }}
        >
          <thead className="text-xs uppercase tracking-wide text-gray-500 transition-colors dark:text-white">
            <tr>
              {columns.map((col) => {
                const key = String(col.key);
                const isHovered = hoveredHeaderKey === key;

                return (
                  <th
                    key={key}
                    onMouseEnter={() => setHoveredHeaderKey(key)}
                    onMouseLeave={() =>
                      setHoveredHeaderKey((current) =>
                        current === key ? null : current,
                      )
                    }
                    className="sticky top-0 z-10 overflow-hidden border-b border-slate-200/80 bg-white text-left font-semibold dark:border-slate-600 dark:bg-slate-900"
                    style={{
                      width: `${resolvedColumnWidths[key] ?? Number(col.width ?? getDefaultColumnWidth(col))}px`,
                      minWidth: `${col.minWidth ?? 80}px`,
                      ...(col.maxWidth === undefined
                        ? {}
                        : { maxWidth: `${col.maxWidth}px` }),
                      position: "relative",
                    }}
                  >
                    <div className="flex items-center gap-2 px-6 py-4">
                      <span className="block truncate">{col.title}</span>
                    </div>

                    {col.resizable !== false && (
                      <div
                        onPointerDown={(event) => handleResizeStart(event, col)}
                        className="absolute inset-y-0 right-0 flex cursor-col-resize items-center justify-center transition-opacity duration-150"
                        style={{
                          right: 0,
                          top: 0,
                          bottom: 0,
                          width: `${RESIZE_HANDLE_WIDTH}px`,
                          boxSizing: "border-box",
                          opacity: isHovered && !isDragging ? 1 : 0,
                          pointerEvents: isHovered ? "auto" : "none",
                          zIndex: 2,
                        }}
                        aria-label={`Resize ${col.title} column`}
                        role="separator"
                        title={`Resize ${col.title} column`}
                      >
                        <span
                          aria-hidden="true"
                          className="absolute inset-y-0 right-0"
                          style={{
                            borderLeft: `${RESIZE_HANDLE_LINE_WIDTH}px solid rgb(14, 165, 233)`,
                          }}
                        />
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <TableBody
            groupedData={groupedData}
            paginatedData={paginatedData}
            columns={columns}
            onRowClick={onRowClick}
            collapsedGroups={collapsedGroups}
            onToggleGroup={(id) =>
              setCollapsedGroups((current) => ({
                ...current,
                [id]: !current[id],
              }))
            }
            showCounts={showCounts}
            emptyState={emptyState}
            emptyText={emptyText}
            safeCurrentPage={safeCurrentPage}
            onShowOnlyGroup={
              // Only meaningful for a server grid, where "open this group"
              // means a filter the API applies across every page.
              serverGrid && groupRules.length
                ? (group) => {
                    // One condition per level, so opening EST > Hot filters on
                    // both. `path` carries the raw value at each level.
                    const path = group.path ?? [group.value ?? ""];
                    setFilterItems(
                      path.map((value, level) => {
                        const field = groupRules[level]?.field ?? "";
                        return {
                          id: `only-${field}`,
                          type: "condition" as const,
                          condition: {
                            id: `only-${field}-c`,
                            field,
                            operator: value ? ("is" as const) : ("is_empty" as const),
                            value,
                          },
                        };
                      }),
                    );
                  }
                : undefined
            }
            columnWidths={resolvedColumnWidths}
            virtualRows={virtualRows}
          />
        </table>
      </div>

      {/* Pagination used to be hidden whenever grouping was on, which left
          the user stuck on page 1 of a grouped view on every page in the CRM. */}
      {(processedData.length > 0 || serverPagination) && (
        <div className="shrink-0">
          <TablePagination
            paginationStart={paginationStart}
            paginationEnd={paginationEnd}
            totalCount={totalCount}
            rowsPerPage={rowsPerPage}
            setRowsPerPage={setRowsPerPage}
            pageNumbers={pageNumbers}
            safeCurrentPage={safeCurrentPage}
            totalPages={totalPages}
            paginationContextKey={paginationContextKey}
            setPageState={setPageState}
          />
        </div>
      )}
    </div>
  );
}
