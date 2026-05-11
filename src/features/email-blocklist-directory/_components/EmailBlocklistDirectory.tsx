

import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { EmailLink, Table, TypeBadge } from "@/components/ui";
import { Select } from "@/components/ui/Select";
import type { Column } from "@/components/ui/Table";
import { findDrawerRouteIndex } from "@/features/backoffice-shared/drawer-route";
import { showSuccessToast } from "@/lib/toast";
import { useSearchParams } from "react-router-dom";
import { Filter } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getLeadId } from "@/features/backoffice-shared/constants";
import { LEAD_TYPE_OPTIONS } from "@/types/lead-type.types";
import {
  emailBlocklistDirectoryRows,
  type EmailBlocklistDirectoryRow,
} from "../_lib/data";
import { EmailBlocklistDirectoryDrawer } from "./EmailBlocklistDirectoryDrawer";

function HistoryCell({ value }: { value: string }) {
  return (
    <span
      className="block max-w-72 truncate text-sm text-slate-700 dark:text-slate-200"
      title={value}
    >
      {value || "-"}
    </span>
  );
}

export function EmailBlocklistDirectory() {
  const [searchParams] = useSearchParams();
  const selectedLead = searchParams.get("lead");
  const [rows, setRows] = useState<EmailBlocklistDirectoryRow[]>(
    emailBlocklistDirectoryRows,
  );
  const [filters, setFilters] = useState({
    svgLeadType: "",
    bentonLeadType: "",
    rm95LeadType: "",
  });
  const [selectedIndex, setSelectedIndex] = useState<number | null>(() =>
    findDrawerRouteIndex(emailBlocklistDirectoryRows, selectedLead),
  );

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        if (filters.svgLeadType && row.svgLeadType !== filters.svgLeadType) {
          return false;
        }

        if (
          filters.bentonLeadType &&
          row.bentonLeadType !== filters.bentonLeadType
        ) {
          return false;
        }

        if (filters.rm95LeadType && row.rm95LeadType !== filters.rm95LeadType) {
          return false;
        }

        return true;
      }),
    [filters, rows],
  );

  useEffect(() => {
    setSelectedIndex(findDrawerRouteIndex(filteredRows, selectedLead));
  }, [filteredRows, selectedLead]);

  const removeFromBlocklist = (row: EmailBlocklistDirectoryRow) => {
    setRows((current) => current.filter((item) => item.id !== row.id));
    setSelectedIndex(null);
    showSuccessToast(`${row.email} removed from blocklist.`);
  };

  const selectedRow =
    selectedIndex === null ? null : (filteredRows[selectedIndex] ?? null);
  const currentIndex = selectedIndex ?? -1;
  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const leadTypeSelectOptions = useMemo(
    () => [{ label: "All", value: "" }, ...LEAD_TYPE_OPTIONS],
    [],
  );

  const columns = useMemo<Column<EmailBlocklistDirectoryRow>[]>(
    () => [
      {
        title: "Lead ID",
        key: "lead",
        getValue: (row) => getLeadId(row),
      },
      { title: "Company", key: "companyName" },
      { title: "Full Name", key: "fullName" },
      {
        title: "Email",
        key: "email",
        render: (row) => <EmailLink value={row.email} />,
      },
      {
        title: "Lead Type",
        key: "svgLeadType",
        render: (row) => <TypeBadge value={row.svgLeadType} kind="lead" />,
      },
      {
        title: "Lead Type Benton",
        key: "bentonLeadType",
        render: (row) => <TypeBadge value={row.bentonLeadType} kind="lead" />,
      },
      {
        title: "Lead Type 95RM",
        key: "rm95LeadType",
        render: (row) => <TypeBadge value={row.rm95LeadType} kind="lead" />,
      },
      {
        title: "History Call Notes SVG",
        key: "historyCallNotesSvg",
        render: (row) => <HistoryCell value={row.historyCallNotesSvg} />,
      },
      {
        title: "History Call Notes Benton",
        key: "historyCallNotesBenton",
        render: (row) => <HistoryCell value={row.historyCallNotesBenton} />,
      },
      { title: "Reason", key: "reason" },
      { title: "Added By", key: "addedBy" },
    ],
    [],
  );

  return (
    <div className="min-h-full">
      <Table
        data={filteredRows}
        columns={columns}
        title="Email Blocklist Directory"
        description="View and manage blocked or blacklisted emails across the system"
        emptyText={
          activeFilterCount > 0
            ? "No blocklisted emails match the current filters."
            : "No blocklisted emails found."
        }
        showTableWhenEmpty
        headerContent={
          <>
            {/* <div className="hidden items-center gap-3 xl:flex">
              <InlineFilterField label="Lead Type">
                <Select
                  value={filters.svgLeadType}
                  onChange={(value) =>
                    setFilters((current) => ({
                      ...current,
                      svgLeadType: String(value),
                    }))
                  }
                  options={leadTypeSelectOptions}
                  placeholder="All"
                  className="h-9 min-w-36 rounded px-3 py-2 text-sm"
                />
              </InlineFilterField>
              <InlineFilterField label="Lead Type Benton">
                <Select
                  value={filters.bentonLeadType}
                  onChange={(value) =>
                    setFilters((current) => ({
                      ...current,
                      bentonLeadType: String(value),
                    }))
                  }
                  options={leadTypeSelectOptions}
                  placeholder="All"
                  className="h-9 min-w-42 rounded px-3 py-2 text-sm"
                />
              </InlineFilterField>
              <InlineFilterField label="Lead Type 95RM">
                <Select
                  value={filters.rm95LeadType}
                  onChange={(value) =>
                    setFilters((current) => ({
                      ...current,
                      rm95LeadType: String(value),
                    }))
                  }
                  options={leadTypeSelectOptions}
                  placeholder="All"
                  className="h-9 min-w-36 rounded px-3 py-2 text-sm"
                />
              </InlineFilterField>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setFilters({
                      svgLeadType: "",
                      bentonLeadType: "",
                      rm95LeadType: "",
                    })
                  }
                  className="inline-flex h-9 cursor-pointer items-center rounded px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  Clear
                </button>
              )}
            </div> */}

            <Popover className="relative">
              <PopoverButton className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                <Filter size={15} />
                {activeFilterCount > 0 && (
                  <span className="inline-flex min-w-5 items-center justify-center rounded-md bg-slate-800 px-1.5 py-0.5 text-[11px] font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
                    {activeFilterCount}
                  </span>
                )}
              </PopoverButton>

              <PopoverPanel
                anchor="bottom end"
                className="z-20 mt-2 w-[min(92vw,22rem)] rounded-lg border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="space-y-3">
                  <Select
                    label="Lead Type"
                    value={filters.svgLeadType}
                    onChange={(value) =>
                      setFilters((current) => ({
                        ...current,
                        svgLeadType: String(value),
                      }))
                    }
                    options={leadTypeSelectOptions}
                    placeholder="All"
                    className="h-10 rounded px-3 py-2 text-sm"
                    labelClassName="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
                  />
                  <Select
                    label="Lead Type Benton"
                    value={filters.bentonLeadType}
                    onChange={(value) =>
                      setFilters((current) => ({
                        ...current,
                        bentonLeadType: String(value),
                      }))
                    }
                    options={leadTypeSelectOptions}
                    placeholder="All"
                    className="h-10 rounded px-3 py-2 text-sm"
                    labelClassName="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
                  />
                  <Select
                    label="Lead Type 95RM"
                    value={filters.rm95LeadType}
                    onChange={(value) =>
                      setFilters((current) => ({
                        ...current,
                        rm95LeadType: String(value),
                      }))
                    }
                    options={leadTypeSelectOptions}
                    placeholder="All"
                    className="h-10 rounded px-3 py-2 text-sm"
                    labelClassName="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
                  />
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setFilters({
                          svgLeadType: "",
                          bentonLeadType: "",
                          rm95LeadType: "",
                        })
                      }
                      className="inline-flex h-9 cursor-pointer items-center rounded px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </PopoverPanel>
            </Popover>
          </>
        }
        onRowClick={(row) => {
          const index = filteredRows.findIndex((item) => item.id === row.id);
          setSelectedIndex(index >= 0 ? index : null);
        }}
      />

      <EmailBlocklistDirectoryDrawer
        row={selectedRow}
        currentIndex={currentIndex}
        rowCount={filteredRows.length}
        onCancel={() => setSelectedIndex(null)}
        onNavigate={(index) => {
          if (!filteredRows[index]) return;
          setSelectedIndex(index);
        }}
        onRemove={removeFromBlocklist}
      />
    </div>
  );
}
