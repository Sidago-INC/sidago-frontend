import { useCallback, useEffect, useMemo, useState } from "react";
import { Wave } from "@/components/ui";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { useGridUrlState } from "@/lib/use-grid-url-state";
import { useServerPagination } from "@/lib/use-server-pagination";
import {
  Ban,
  CheckCircle2,
  LocateOff,
  PlusCircle,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import {
  useLeadStatsSocket,
  useLeadStatsSummary,
  toYMD,
  type LeadStatsSummary,
} from "@/features/leads-stats/_lib/hooks";
import {
  contactsFilterOptions,
  fixTimezoneOptions,
  useFixQueue,
  type ContactsFilter,
} from "../_lib/data";
import { FixLeadsTable } from "./FixLeadsTable";

export function FixLeads() {
  const { page, perPage, setPage, setPerPage } = useServerPagination();
  const [contactsFilter, setContactsFilter] = useState<ContactsFilter | "">("");
  const [hasOtherContacts, setHasOtherContacts] = useState(false);
  const [timezone, setTimezone] = useState("");

  const url = useGridUrlState();
  const [searchInput, setSearchInput] = useState(url.search);
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [socketStats, setSocketStats] = useState<LeadStatsSummary | null>(null);

  useEffect(() => {
    url.setSearch(debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url.grid]);

  const today = useMemo(() => new Date(), []);
  const todayStr = toYMD(today);
  const { data: todayStats, isLoading: statsLoading } = useLeadStatsSummary(
    today,
    today,
  );
  const handleSocketUpdate = useCallback((update: LeadStatsSummary) => {
    setSocketStats(update);
  }, []);
  useLeadStatsSocket(handleSocketUpdate);
  const effectiveStats = socketStats ?? todayStats;

  const { data: result, isLoading, isError, error } = useFixQueue(
    page,
    perPage,
    contactsFilter || undefined,
    hasOtherContacts || undefined,
    timezone || undefined,
    debouncedSearch,
    url.grid,
  );
  const serverPagination = result?.meta
    ? {
        meta: result.meta,
        onPageChange: setPage,
        onPerPageChange: setPerPage,
      }
    : undefined;
  const statsPending = statsLoading && !effectiveStats;
  const showInitialLoading = isLoading && !result;
  const statsCards = [
    {
      label: "Leads fixed",
      value: effectiveStats?.leadsFixed,
      icon: CheckCircle2,
      iconClass: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Leads sent to fix",
      value: effectiveStats?.leadsSentToFix,
      icon: RefreshCcw,
      iconClass: "text-sky-600 dark:text-sky-400",
    },
    {
      label: "Leads sent to can't locate",
      value: effectiveStats?.leadsSentToCantLocate,
      icon: LocateOff,
      iconClass: "text-orange-600 dark:text-orange-400",
    },
    {
      label: "New leads created",
      value: effectiveStats?.newLeadsCreated,
      icon: PlusCircle,
      iconClass: "text-violet-600 dark:text-violet-400",
    },
    {
      label: "Leads sent to VOID",
      value: effectiveStats?.leadsSentToVoid,
      icon: Trash2,
      iconClass: "text-rose-600 dark:text-rose-400",
    },
    {
      label: "Leads sent to DNC",
      value: effectiveStats?.leadsSentToDnc,
      icon: Ban,
      iconClass: "text-slate-600 dark:text-slate-400",
    },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="shrink-0 space-y-4 px-4 pt-2">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
          <div className="min-w-0 shrink-0">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Fix Queue
            </h1>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Today ({todayStr})
            </p>
          </div>

          <div className="grid w-full grid-cols-2 items-end gap-3 lg:w-auto lg:flex lg:flex-wrap">
            <div className="min-w-0 lg:w-52">
              <label
                htmlFor="contacts-filter"
                className="mb-1 block text-[11px] font-semibold text-slate-500 dark:text-slate-400"
              >
                Contacts
              </label>
              <select
                id="contacts-filter"
                value={contactsFilter}
                onChange={(e) => {
                  setContactsFilter(e.target.value as ContactsFilter | "");
                  setPage(1);
                }}
                className="h-9 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/15 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-indigo-400 dark:focus:bg-slate-900"
              >
                <option value="">All contacts</option>
                {contactsFilterOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-0 lg:w-40">
              <label
                htmlFor="timezone-filter"
                className="mb-1 block text-[11px] font-semibold text-slate-500 dark:text-slate-400"
              >
                Timezone
              </label>
              <select
                id="timezone-filter"
                value={timezone}
                onChange={(e) => {
                  setTimezone(e.target.value);
                  setPage(1);
                }}
                className="h-9 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/15 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-indigo-400 dark:focus:bg-slate-900"
              >
                <option value="">All timezones</option>
                {fixTimezoneOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <label className="col-span-2 flex h-9 w-fit cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 lg:col-span-1 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
              <input
                type="checkbox"
                checked={hasOtherContacts}
                onChange={(e) => {
                  setHasOtherContacts(e.target.checked);
                  setPage(1);
                }}
                className="peer sr-only"
              />
              <span className="relative h-5 w-9 shrink-0 rounded-full bg-slate-300 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:bg-indigo-600 peer-checked:after:translate-x-4 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500 peer-focus-visible:ring-offset-2 dark:bg-slate-600 dark:peer-focus-visible:ring-offset-slate-900" />
              Has other contacts
            </label>
          </div>
        </div>

        <section
          aria-label="Fix lead statistics"
          className="grid grid-cols-3 gap-3 xl:grid-cols-6"
        >
          {statsCards.map(({ label, value, icon: Icon, iconClass }) => (
            <div
              key={label}
              className="min-h-20 rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-start gap-2">
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconClass}`} strokeWidth={2} />
                <p className="text-xs font-semibold leading-4 text-slate-950 dark:text-slate-50">
                  {label}
                </p>
              </div>
              <p className="mt-2 text-lg font-bold tabular-nums text-slate-950 dark:text-white">
                {statsPending ? "—" : (value ?? 0)}
              </p>
            </div>
          ))}
        </section>
      </div>

      {showInitialLoading ? (
        <div className="flex flex-1 justify-center py-12">
          <Wave />
        </div>
      ) : isError && !result ? (
        <div className="mx-4 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
          Failed to load fix queue:{" "}
          {(error as unknown as { message?: string[] })?.message?.join(", ") ??
            "Unknown error"}
        </div>
      ) : (
        <div className="min-h-0 flex-1">
          <FixLeadsTable
            data={result?.data ?? []}
            title="Fix Queue"
            serverPagination={serverPagination}
            serverSearch={{
              value: searchInput,
              onChange: setSearchInput,
              placeholder: "Search name, symbol, or lead ID",
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
          />
        </div>
      )}
    </div>
  );
}
