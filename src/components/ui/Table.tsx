
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { Ellipsis, FileDown, Printer, Search, X } from "lucide-react";
import React, { useEffect } from "react";
import { FilterPanel } from "./table/FilterPanel";
import { GroupPanel } from "./table/GroupPanel";
import { SortPanel } from "./table/SortPanel";
import { TableBody } from "./table/TableBody";
import { TablePagination } from "./table/TablePagination";
import { useTableState } from "./table/useTableState";

export type { Column } from "./table/types";
export type { TableProps } from "./table/types";

type Props<T> = {
  data: T[];
  columns: import("./table/types").Column<T>[];
  isLoading?: boolean;
  rowsPerPage?: number;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
  emptyText?: string;
  emptyState?: React.ReactNode;
  showTableWhenEmpty?: boolean;
  showToolbarTitle?: boolean;
  headerContent?: React.ReactNode;
  onRowClick?: (row: T) => void;
  title: string;
  description?: string;
};

const TOOLBAR_BUTTON_CLASS =
  "flex h-9 cursor-pointer items-center justify-center rounded-xl px-3 text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900";

const TOOLBAR_ICON_BUTTON_CLASS =
  "flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900";

export function Table<T>({
  data,
  columns,
  isLoading,
  rowsPerPage: initialRowsPerPage,
  onRowsPerPageChange,
  title,
  description,
  emptyText = "No data found",
  emptyState,
  showTableWhenEmpty = false,
  showToolbarTitle = true,
  headerContent,
  onRowClick,
}: Props<T>) {
  const state = useTableState({
    data,
    columns,
    title,
    initialRowsPerPage,
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
  } = state;

  useEffect(() => {
    onRowsPerPageChange?.(rowsPerPage);
  }, [onRowsPerPageChange, rowsPerPage]);

  const handleTableScrollKeys = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    const container = scrollContainerRef.current;
    if (!container) return;

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
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white shadow p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if ((!data || data.length === 0) && !showTableWhenEmpty) {
    return (
      <div className="overflow-hidden">
        {emptyState ?? (
          <div className="p-10 text-center text-gray-500">{emptyText}</div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-center md:justify-between mb-2 border-b border-slate-200/80 bg-white/75 px-8 backdrop-blur-md transition-colors dark:border-slate-600 dark:bg-slate-950/70">
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

        <div className="flex items-center justify-end gap-2">
          {headerContent}

          <GroupPanel
            groupRules={groupRules}
            setGroupRules={setGroupRules}
            showCounts={showCounts}
            setShowCounts={setShowCounts}
            selectableColumns={selectableColumns}
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
            selectableColumns={selectableColumns}
            buttonClassName={TOOLBAR_BUTTON_CLASS}
          />

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
              className={TOOLBAR_ICON_BUTTON_CLASS}
              aria-label="Open search"
            >
              <Search size={15} />
            </button>
          )}

          <Popover className="relative">
            <PopoverButton className={TOOLBAR_ICON_BUTTON_CLASS}>
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
          />
        </table>
      </div>

      {!groupedData && processedData.length > 0 && (
        <TablePagination
          paginationStart={paginationStart}
          paginationEnd={paginationEnd}
          totalCount={processedData.length}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          pageNumbers={pageNumbers}
          safeCurrentPage={safeCurrentPage}
          totalPages={totalPages}
          paginationContextKey={paginationContextKey}
          setPageState={setPageState}
        />
      )}
    </div>
  );
}
