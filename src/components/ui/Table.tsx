
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import {
  Ellipsis,
  FileDown,
  Loader2,
  Printer,
  Search,
  X,
} from "lucide-react";
import React, { useEffect } from "react";
import { FilterPanel } from "./table/FilterPanel";
import { GroupPanel } from "./table/GroupPanel";
import { SortPanel } from "./table/SortPanel";
import { TableBody } from "./table/TableBody";
import { TablePagination } from "./table/TablePagination";
import { useTableState } from "./table/useTableState";

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

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;

  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;

  return Boolean(
    target.closest("input, textarea, select, [contenteditable='true']"),
  );
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

  useEffect(() => {
    onRowsPerPageChange?.(rowsPerPage);
  }, [onRowsPerPageChange, rowsPerPage]);

  // A grouped grid is paginated, so a group of 18,383 rows can never be
  // "expanded" on a 100-row page. Clicking one therefore OPENS it: the grid
  // filters to that group and you page inside it. That is why the other groups
  // disappear — they have no rows once the filter is on. This finds that
  // filter so the grid can offer a way back out.
  const groupField = groupRules[0]?.field;
  const openedGroup =
    groupField && filterItems.length === 1 && filterItems[0].type === "condition"
      ? filterItems[0].condition.field === groupField
        ? filterItems[0].condition.value || "(blank)"
        : null
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
        className="min-h-0 flex-1 overflow-auto px-4 outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60"
        aria-label="Scrollable table"
      >
        <table
          ref={tableElementRef}
          className={`min-w-240 w-full transition-opacity ${
            isRefreshing ? "opacity-60" : "opacity-100"
          }`}
        >
          <thead className="text-xs uppercase tracking-wide text-gray-500 transition-colors dark:text-white">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.title}
                  className="sticky top-0 z-10 whitespace-nowrap border-b border-slate-200/80 bg-white px-6 py-4 text-left font-semibold dark:border-slate-600 dark:bg-slate-900"
                >
                  {col.title}
                </th>
              ))}
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
              // Only meaningful for a server grid, where "show only this group"
              // means adding a filter the API can apply across every page.
              serverGrid && groupRules[0]?.field
                ? (group) => {
                    const field = groupRules[0].field;
                    const value = group.value ?? "";
                    // Keep the grouping. Scoping to a group used to clear it,
                    // which made clicking EST look like grouping had switched
                    // itself off. With the filter applied AND groupBy still on,
                    // the server returns one group — EST with its real total —
                    // and the pages you now page through are all EST.
                    setFilterItems([
                      {
                        id: `only-${field}`,
                        type: "condition",
                        condition: {
                          id: `only-${field}-c`,
                          field,
                          operator: value ? "is" : "is_empty",
                          value,
                        },
                      },
                    ]);
                  }
                : undefined
            }
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
