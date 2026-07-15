import { useState } from "react";
import { Wave } from "@/components/ui";
import { useServerPagination } from "@/lib/use-server-pagination";
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 px-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Fix Queue
        </h1>

        <div className="flex items-center gap-2">
          <label
            htmlFor="contacts-filter"
            className="text-sm font-medium text-slate-600 dark:text-slate-300"
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
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
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
            className="text-sm font-medium text-slate-600 dark:text-slate-300"
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
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">All timezones</option>
            {fixTimezoneOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={hasOtherContacts}
              onChange={(e) => {
                setHasOtherContacts(e.target.checked);
                setPage(1);
              }}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
            />
            Has other contacts
          </label>
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
