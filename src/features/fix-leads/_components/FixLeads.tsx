import { useState } from "react";
import { Wave } from "@/components/ui";
import { useServerPagination } from "@/lib/use-server-pagination";
import { Wrench } from "lucide-react";
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

  const { data: result, isLoading, isError, error } = useFixQueue(
    page,
    perPage,
    contactsFilter || undefined,
    hasOtherContacts || undefined,
    timezone || undefined,
  );
  const serverPagination = result?.meta
    ? {
        meta: result.meta,
        onPageChange: setPage,
        onPerPageChange: setPerPage,
      }
    : undefined;
  const totalFixLeads = result?.meta.total_count;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 px-4 pt-2 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        <div className="min-w-0 shrink-0">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Fix Queue
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2 sm:justify-end">
          <label
            htmlFor="contacts-filter"
            className="text-xs font-medium text-slate-600 dark:text-slate-300"
          >
            Contacts filter
          </label>
          <select
            id="contacts-filter"
            value={contactsFilter}
            onChange={(e) => {
              setContactsFilter(e.target.value as ContactsFilter | "");
              setPage(1);
            }}
            className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">All contacts</option>
            {contactsFilterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <label
            htmlFor="timezone-filter"
            className="text-xs font-medium text-slate-600 dark:text-slate-300"
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
            className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">All timezones</option>
            {fixTimezoneOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <label className="flex h-8 items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={hasOtherContacts}
              onChange={(e) => {
                setHasOtherContacts(e.target.checked);
                setPage(1);
              }}
              className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
            />
            Has other contacts
          </label>

          <div className="inline-flex h-8 shrink-0 items-center gap-2 rounded-lg border border-slate-200/80 bg-white px-2.5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <Wrench className="h-3.5 w-3.5" strokeWidth={2.25} />
            </span>
            <div className="flex items-baseline gap-1.5 leading-none">
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Total Fix Leads
              </p>
              <p className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-50">
                {isLoading ? "—" : (totalFixLeads ?? 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Wave />
        </div>
      ) : isError ? (
        <div className="mx-4 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
          Failed to load fix queue:{" "}
          {(error as unknown as { message?: string[] })?.message?.join(", ") ??
            "Unknown error"}
        </div>
      ) : (
        <FixLeadsTable
          data={result?.data ?? []}
          title="Fix Queue"
          serverPagination={serverPagination}
        />
      )}
    </div>
  );
}
