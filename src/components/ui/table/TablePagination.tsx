

import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import clsx from "clsx";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import React, { type Dispatch, type SetStateAction } from "react";
import type { PageState } from "./types";

const ROWS_PER_PAGE_OPTIONS = ["10", "20", "30", "50", "100", "500"] as const;

interface TablePaginationProps {
  paginationStart: number;
  paginationEnd: number;
  totalCount: number;
  rowsPerPage: number;
  setRowsPerPage: Dispatch<SetStateAction<number>>;
  pageNumbers: number[];
  safeCurrentPage: number;
  totalPages: number;
  paginationContextKey: string;
  setPageState: Dispatch<SetStateAction<PageState>>;
}

export function TablePagination({
  paginationStart,
  paginationEnd,
  totalCount,
  rowsPerPage,
  setRowsPerPage,
  pageNumbers,
  safeCurrentPage,
  totalPages,
  paginationContextKey,
  setPageState,
}: TablePaginationProps) {
  const goToPage = (page: number) =>
    setPageState({ page, contextKey: paginationContextKey });

  return (
    <div className="mt-4 px-4 pb-2">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid grid-cols-2 items-center gap-3 sm:flex sm:flex-row sm:items-center sm:gap-6">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">
            Showing {paginationStart} to {paginationEnd} of {totalCount} entries
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
                {ROWS_PER_PAGE_OPTIONS.map((value) => (
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
              onClick={() => goToPage(Math.max(1, safeCurrentPage - 1))}
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
                      onClick={() => goToPage(page)}
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
                goToPage(Math.min(totalPages, safeCurrentPage + 1))
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
  );
}
