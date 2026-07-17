import { useMemo, useState, type SetStateAction } from "react";
import type { DateRange } from "react-day-picker";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import {
  Check,
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import clsx from "clsx";
import { DateRangePicker } from "@/components/ui";
import { useAdminTodayAgentCards } from "@/features/admin-dashboard/_lib/hooks";
import {
  useAgentCallReport,
  useAgentCallDetails,
  type CallDetailRow,
} from "@/features/agent-dashboard/_lib/hooks";
import { Panel } from "@/features/agent-dashboard/_components/Panel";
import { TablePagination } from "@/components/ui/table/TablePagination";
import { createPaginationMeta, getPageNumbers, getPaginationRange, DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { downloadWorkbook } from "@/lib/excel";

const DEFAULT_DETAILS_PAGE_SIZE = DEFAULT_PAGE_SIZE;

const RESULT_CODE_COLORS: Record<string, string> = {
  Interested:
    "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200",
  "Not Interested":
    "bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300",
  "No Answer":
    "bg-sky-50 border-sky-200 text-sky-800 dark:bg-sky-950/40 dark:border-sky-800 dark:text-sky-200",
  "Left Voicemail":
    "bg-violet-50 border-violet-200 text-violet-800 dark:bg-violet-950/40 dark:border-violet-800 dark:text-violet-200",
  "Left Message":
    "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-200",
  "Call Lead Back":
    "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200",
  "Interested Again":
    "bg-cyan-50 border-cyan-200 text-cyan-800 dark:bg-cyan-950/40 dark:border-cyan-800 dark:text-cyan-200",
  DNC: "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-800 dark:text-red-200",
  "Bad Number":
    "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200",
};
const DEFAULT_COLOR =
  "bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300";

function localDate(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function rangeToParams(range: DateRange | undefined): { startDate: string; endDate: string } {
  const today = new Date();
  const from = range?.from ?? today;
  const to = range?.to ?? from;
  return { startDate: localDate(from), endDate: localDate(to) };
}

function formatDateTime(ts: string): string {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ensureAbsoluteUrl(url: string): string {
  return url.startsWith("http://") || url.startsWith("https://")
    ? url
    : `https://${url}`;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

const EXPORT_COLUMNS = [
  "Date / Time",
  "Lead",
  "Company",
  "Outcome",
  "Lead Type",
  "Duration",
  "Recording",
] as const;

function rowToExportValues(row: CallDetailRow): Record<(typeof EXPORT_COLUMNS)[number], string> {
  return {
    "Date / Time": formatDateTime(row.calledAt),
    Lead: row.fullName ?? "",
    Company: row.companyName ?? "",
    Outcome: row.resultCode ?? "",
    "Lead Type": row.leadType ?? "",
    Duration: formatDuration(row.mcDurationSeconds ?? row.durationSeconds),
    Recording: row.mcRecordingLink ? ensureAbsoluteUrl(row.mcRecordingLink) : "",
  };
}

function downloadCsv(filename: string, rows: CallDetailRow[]) {
  const escape = (value: string) => {
    if (/[",\n\r]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
    return value;
  };

  const lines = [
    EXPORT_COLUMNS.join(","),
    ...rows.map((row) => {
      const values = rowToExportValues(row);
      return EXPORT_COLUMNS.map((column) => escape(values[column])).join(",");
    }),
  ];

  const blob = new Blob([`\uFEFF${lines.join("\n")}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

async function downloadXlsx(filename: string, rows: CallDetailRow[]) {
  await downloadWorkbook(filename, [
    {
      kind: "object",
      name: "Call Details",
      columns: [...EXPORT_COLUMNS],
      rows: rows.map((row) => rowToExportValues(row)),
    },
  ]);
}

export function AgentCallInspector() {
  const today = new Date();
  const { data: agentData } = useAdminTodayAgentCards(today);
  const agents = agentData?.cards ?? [];

  const [selectedSlug, setSelectedSlug] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: today,
    to: today,
  });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_DETAILS_PAGE_SIZE);
  const [resultFilters, setResultFilters] = useState<string[]>([]);

  const { startDate, endDate } = rangeToParams(dateRange);
  const isAgentSelected = selectedSlug !== "";
  const hasResultFilter = resultFilters.length > 0;

  const selectedAgent = agents.find((a) => a.id === selectedSlug);
  const agentLabel = selectedAgent
    ? `${selectedAgent.name} ${selectedAgent.surname}`
    : "";
  const rangeLabel =
    startDate === endDate ? startDate : `${startDate} to ${endDate}`;

  const { data: reportData, isLoading: reportLoading } = useAgentCallReport(
    isAgentSelected ? selectedSlug : null,
    startDate,
    endDate,
  );

  const byResult = reportData?.byResult ?? {};
  const totalCalls = reportData?.totalCalls ?? 0;
  const entries = Object.entries(byResult).sort((a, b) => b[1] - a[1]);

  const { data: detailsData, isLoading: detailsLoading } = useAgentCallDetails(
    isAgentSelected ? selectedSlug : null,
    startDate,
    endDate,
    page,
    perPage,
  );

  const rows = detailsData?.data ?? [];

  const resultOptions = useMemo(() => {
    const fromReport = Object.keys(byResult);
    const fromRows = rows
      .map((row) => row.resultCode)
      .filter((code): code is string => Boolean(code));
    return Array.from(new Set([...fromReport, ...fromRows])).sort((a, b) =>
      a.localeCompare(b),
    );
  }, [byResult, rows]);

  // Call-result filters are client-only — never sent to the API.
  const visibleRows = useMemo(() => {
    if (!hasResultFilter) return rows;
    const selected = new Set(resultFilters);
    return rows.filter(
      (row) => row.resultCode != null && selected.has(row.resultCode),
    );
  }, [hasResultFilter, resultFilters, rows]);

  const paginationMeta = useMemo(() => {
    const apiMeta = detailsData?.meta;
    if (apiMeta) {
      return createPaginationMeta(
        apiMeta.total_count,
        apiMeta.per_page || perPage,
        apiMeta.current_page || page,
      );
    }
    return createPaginationMeta(rows.length, perPage, page);
  }, [detailsData?.meta, page, perPage, rows.length]);

  const totalPages = paginationMeta.total_pages;
  const safeCurrentPage = paginationMeta.current_page;

  const pageNumbers = useMemo(
    () => getPageNumbers(safeCurrentPage, totalPages),
    [safeCurrentPage, totalPages],
  );
  const { start: paginationStart, end: paginationEnd } = getPaginationRange(
    paginationMeta,
    visibleRows.length,
  );
  const paginationContextKey = `${selectedSlug}:${startDate}:${endDate}:${perPage}`;

  const resultFilterLabel =
    resultFilters.length === 0
      ? "Call Result"
      : resultFilters.length === 1
        ? resultFilters[0]
        : `${resultFilters.length} selected`;

  const exportBasename = `call-details-${selectedSlug || "agent"}-${startDate}-${endDate}${
    resultFilters.length
      ? `-${resultFilters
          .map((code) => code.replaceAll(/\s+/g, "-").toLowerCase())
          .join("_")}`
      : ""
  }`;

  const handleRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setPage(1);
    setResultFilters([]);
  };

  const handleAgentChange = (slug: string) => {
    setSelectedSlug(slug);
    setPage(1);
    setResultFilters([]);
  };

  const toggleResultFilter = (code: string) => {
    setResultFilters((current) => {
      if (current.includes(code)) {
        return current.filter((value) => value !== code);
      }
      return [...current, code];
    });
  };

  const clearResultFilters = () => {
    setResultFilters([]);
  };

  const handlePerPageChange = (value: SetStateAction<number>) => {
    const next = typeof value === "function" ? value(perPage) : value;
    setPerPage(next);
    setPage(1);
  };

  const handleExportCsv = () => {
    downloadCsv(`${exportBasename}.csv`, visibleRows);
  };

  const handleExportXlsx = async () => {
    await downloadXlsx(`${exportBasename}.xlsx`, visibleRows);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            Agent
          </p>
          <select
            value={selectedSlug}
            onChange={(e) => handleAgentChange(e.target.value)}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 transition outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="">Select an agent…</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} {a.surname} — {a.brand}
              </option>
            ))}
          </select>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            Date range
          </p>
          <div className="w-72">
            <DateRangePicker
              value={dateRange}
              onChange={handleRangeChange}
              placeholder="Select date range"
            />
          </div>
        </div>
      </div>

      {isAgentSelected ? (
        <>
          <Panel
            title="Call Report"
            subtitle={`${agentLabel} — calls by outcome — ${rangeLabel}`}
          >
            <div className="p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Total calls:
                </span>
                <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {reportLoading ? "—" : totalCalls}
                </span>
              </div>
              {reportLoading ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-20 animate-pulse rounded-xl border bg-slate-100 dark:bg-slate-800"
                    />
                  ))}
                </div>
              ) : entries.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  No calls logged for this date range.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {entries.map(([code, count]) => (
                    <div
                      key={code}
                      className={`rounded-xl border px-4 py-3 ${RESULT_CODE_COLORS[code] ?? DEFAULT_COLOR}`}
                    >
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="mt-1 text-xs font-medium">{code}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Panel>

          <Panel
            title="Call Details"
            subtitle={`${agentLabel} — individual call records — ${rangeLabel}`}
            action={
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Popover className="relative">
                  <PopoverButton
                    className="inline-flex h-9 min-w-40 max-w-56 items-center justify-between gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 transition outline-none hover:bg-slate-50 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 data-focus:outline-none data-focus:ring-0 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                    aria-label="Filter by call result"
                  >
                    <span
                      className={clsx(
                        "truncate",
                        !hasResultFilter && "text-slate-400 dark:text-slate-500",
                      )}
                    >
                      {resultFilterLabel}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
                  </PopoverButton>
                  <PopoverPanel
                    anchor="bottom end"
                    className="z-50 mt-1 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-950"
                  >
                    <div className="max-h-64 overflow-y-auto">
                      {resultOptions.length === 0 ? (
                        <p className="px-3 py-2 text-sm text-slate-400">
                          No results available
                        </p>
                      ) : (
                        resultOptions.map((code) => {
                          const checked = resultFilters.includes(code);
                          return (
                            <button
                              key={code}
                              type="button"
                              onClick={() => toggleResultFilter(code)}
                              className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
                            >
                              <span
                                className={clsx(
                                  "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                                  checked
                                    ? "border-indigo-600 bg-indigo-600 text-white"
                                    : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900",
                                )}
                              >
                                {checked ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                              </span>
                              <span className="truncate">{code}</span>
                            </button>
                          );
                        })
                      )}
                    </div>
                    {hasResultFilter ? (
                      <button
                        type="button"
                        onClick={clearResultFilters}
                        className="mt-1 w-full cursor-pointer rounded-lg border-t border-slate-100 px-2.5 py-2 text-left text-xs font-medium text-indigo-600 transition hover:bg-slate-50 dark:border-slate-800 dark:text-indigo-400 dark:hover:bg-slate-900"
                      >
                        Clear selection
                      </button>
                    ) : null}
                  </PopoverPanel>
                </Popover>

                <Popover className="relative">
                  <PopoverButton
                    disabled={visibleRows.length === 0}
                    className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition outline-none hover:bg-slate-50 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 data-focus:outline-none data-focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                  >
                    <Download className="h-4 w-4" />
                    Export
                    <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                  </PopoverButton>
                  <PopoverPanel
                    anchor="bottom end"
                    className="z-50 mt-1 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-950"
                  >
                    <button
                      type="button"
                      onClick={handleExportCsv}
                      className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
                    >
                      <FileText className="h-4 w-4 text-slate-500" />
                      Download CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void handleExportXlsx();
                      }}
                      className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
                    >
                      <FileSpreadsheet className="h-4 w-4 text-slate-500" />
                      Download XLSX
                    </button>
                  </PopoverPanel>
                </Popover>
              </div>
            }
          >
            <div className="overflow-x-auto">
              {detailsLoading ? (
                <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  Loading…
                </div>
              ) : visibleRows.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  {rows.length === 0
                    ? "No calls logged for this date range."
                    : "No calls match the selected call results."}
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50">
                    <tr>
                      {[
                        "Date / Time",
                        "Lead",
                        "Company",
                        "Outcome",
                        "Lead Type",
                        "Duration",
                        "Recording",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {visibleRows.map((row) => (
                      <tr
                        key={row.callLogId}
                        className="hover:bg-slate-50 dark:hover:bg-slate-900/30"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                          {formatDateTime(row.calledAt)}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                          {row.fullName ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {row.companyName ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {row.resultCode ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {row.leadType ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">
                          {formatDuration(row.mcDurationSeconds ?? row.durationSeconds)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {row.mcRecordingLink ? (
                            <a
                              href={ensureAbsoluteUrl(row.mcRecordingLink)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-medium text-violet-600 hover:text-violet-500 hover:underline dark:text-violet-400 dark:hover:text-violet-300"
                            >
                              Listen
                            </a>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-600">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {(!detailsLoading && (visibleRows.length > 0 || paginationMeta.total_count > 0)) && (
              <TablePagination
                paginationStart={paginationStart}
                paginationEnd={paginationEnd}
                totalCount={paginationMeta.total_count}
                rowsPerPage={perPage}
                setRowsPerPage={handlePerPageChange}
                pageNumbers={pageNumbers}
                safeCurrentPage={safeCurrentPage}
                totalPages={totalPages}
                paginationContextKey={paginationContextKey}
                setPageState={(next) => {
                  const resolved =
                    typeof next === "function"
                      ? next({ page: safeCurrentPage, contextKey: paginationContextKey })
                      : next;
                  setPage(resolved.page);
                }}
              />
            )}
          </Panel>
        </>
      ) : (
        <div className="flex h-28 items-center justify-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Select an agent above to view their call report and call details
          </p>
        </div>
      )}
    </div>
  );
}
