

import clsx from "clsx";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import React, { useEffect, useMemo, useState } from "react";
import { useGridPage } from "@/lib/use-grid-page";
import { closedContactsTabs, type ClosedContactsTabKey } from "../_lib/data";
import { useClosedContracts } from "../_lib/use-closed-contacts";
import { ClosedContactsTable } from "./ClosedContactsTable";

function isClosedContactsTabKey(
  value: string | null,
): value is ClosedContactsTabKey {
  return closedContactsTabs.some((tab) => tab.key === value);
}

export function ClosedContacts() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: ClosedContactsTabKey = isClosedContactsTabKey(tabParam)
    ? tabParam
    : "svg-current";

  const activeView = useMemo(
    () =>
      closedContactsTabs.find((tab) => tab.key === activeTab) ??
      closedContactsTabs[0],
    [activeTab],
  );

  const {
    page,
    perPage,
    setPage,
    setPerPage,
    url,
    searchInput,
    setSearchInput,
  } = useGridPage({ resetKey: activeTab });


  const { data: result, isLoading, isError, error } = useClosedContracts(
    activeView.category,
    activeView.brand,
    page,
    perPage,
    url.grid,
  );

  const updateTab = (tabKey: ClosedContactsTabKey) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabKey);
    params.delete("lead");

    const query = params.toString();
    navigate(query ? `${pathname}?${query}` : pathname, { replace: true });
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <div className="inline-flex min-w-full px-4 py-2 gap-2 border-b border-slate-200/80 bg-white/75 backdrop-blur-md transition-colors dark:border-slate-600 dark:bg-slate-950/70">
          {closedContactsTabs.map((tab) => {
            const isActive = tab.key === activeView.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => updateTab(tab.key)}
                className={clsx(
                  "whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition cursor-pointer",
                  isActive
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-200 dark:hover:text-slate-900",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="px-4 py-8 text-sm text-slate-500 dark:text-slate-400">
          Loading closed contacts...
        </div>
      ) : isError ? (
        <div className="px-4 py-8 text-sm text-rose-600 dark:text-rose-400">
          {error instanceof Error
            ? error.message
            : "Failed to load closed contacts."}
        </div>
      ) : (
        <ClosedContactsTable
          data={result?.data ?? []}
          serverPagination={
            result?.meta
              ? {
                  meta: result.meta,
                  onPageChange: setPage,
                  onPerPageChange: setPerPage,
                }
              : undefined
          }
          serverSearch={{
            value: searchInput,
            onChange: setSearchInput,
            placeholder: "Search lead, symbol, name, phone, or email",
          }}
          serverGrid={{
            filters: url.filterItems,
            rootGate: url.rootGate,
            sort: url.sortRules,
            groupBy: url.groupBy,
            onFiltersChange: url.setFilters,
            onSortChange: url.setSort,
            onGroupByChange: url.setGroupBy,
            groupCounts: result?.meta?.groups,
          }}
          tabKey={activeView.key}
          title={activeView.title}
        />
      )}
    </div>
  );
}
