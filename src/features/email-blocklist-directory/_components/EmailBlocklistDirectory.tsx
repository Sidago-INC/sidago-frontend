
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { Badge, EmailLink, ErrorState, Table, TypeBadge } from "@/components/ui";
import { Select } from "@/components/ui/Select";
import type { Column } from "@/components/ui/Table";
import { getLeadGridLabel } from "@/features/backoffice-shared/constants";
import { useSearchParams } from "react-router-dom";
import { Filter } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { LEAD_TYPE_OPTIONS } from "@/types/lead-type.types";
import {
  getBrandLabel,
  getEmailBlacklistDisplayLeadId,
  type EmailBlocklistDirectoryRow,
  useEmailBlacklistDirectory,
} from "../_lib/data";
import { EmailBlocklistDirectoryDrawer } from "./EmailBlocklistDirectoryDrawer";

const DEFAULT_ROWS_PER_PAGE = 10;

function HistoryCell({ count }: { count: number }) {
  return (
    <span
      className="block max-w-72 truncate text-sm text-slate-700 dark:text-slate-200"
      title={`${count} call history entr${count === 1 ? "y" : "ies"}`}
    >
      {count > 0 ? `${count} entr${count === 1 ? "y" : "ies"}` : "-"}
    </span>
  );
}

export function EmailBlocklistDirectory() {
  const [searchParams] = useSearchParams();
  const selectedLead = searchParams.get("lead");
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const { data = [], isLoading, isError, error, refetch } =
    useEmailBlacklistDirectory(rowsPerPage);
  const [filters, setFilters] = useState({
    svgLeadType: "",
    bentonLeadType: "",
    rm95LeadType: "",
  });

  const filteredRows = useMemo(
    () =>
      data.filter((row) => {
        if (filters.svgLeadType && row.leadTypeSvg !== filters.svgLeadType) {
          return false;
        }

        if (
          filters.bentonLeadType &&
          row.leadTypeBenton !== filters.bentonLeadType
        ) {
          return false;
        }

        if (filters.rm95LeadType && row.leadType95rm !== filters.rm95LeadType) {
          return false;
        }

        return true;
      }),
    [data, filters],
  );

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const selectedRow = useMemo(
    () => filteredRows.find((row) => row.leadId === selectedLeadId) ?? null,
    [filteredRows, selectedLeadId],
  );

  useEffect(() => {
    if (!selectedLead) return;
    const row = filteredRows.find(
      (item) =>
        getEmailBlacklistDisplayLeadId(item).toLowerCase() ===
        selectedLead.toLowerCase(),
    );
    setSelectedLeadId(row?.leadId ?? null);
  }, [filteredRows, selectedLead]);

  const currentIndex = selectedRow
    ? filteredRows.findIndex((row) => row.leadId === selectedRow.leadId)
    : -1;
  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const leadTypeSelectOptions = useMemo(
    () => [{ label: "All", value: "" }, ...LEAD_TYPE_OPTIONS],
    [],
  );

  const columns = useMemo<Column<EmailBlocklistDirectoryRow>[]>(
    () => [
      {
        title: "Lead ID",
        key: "leadId",
        getValue: (row) => getLeadGridLabel(row),
      },
      { title: "Company", key: "companyName" },
      { title: "Full Name", key: "fullName" },
      {
        title: "Email",
        key: "email",
        render: (row) =>
          row.email ? <EmailLink value={row.email} /> : <span>-</span>,
      },
      {
        title: "Contact Type",
        key: "contactType",
        render: (row) =>
          row.contactType ? (
            <TypeBadge value={row.contactType} kind="contact" />
          ) : (
            <span className="text-slate-400">-</span>
          ),
      },
      {
        title: "Lead Type",
        key: "svgLeadType",
        render: (row) =>
          row.leadTypeSvg ? (
            <TypeBadge value={row.leadTypeSvg} kind="lead" />
          ) : (
            <span className="text-slate-400">-</span>
          ),
      },
      {
        title: "Lead Type Benton",
        key: "bentonLeadType",
        render: (row) =>
          row.leadTypeBenton ? (
            <TypeBadge value={row.leadTypeBenton} kind="lead" />
          ) : (
            <span className="text-slate-400">-</span>
          ),
      },
      {
        title: "Lead Type 95RM",
        key: "rm95LeadType",
        render: (row) =>
          row.leadType95rm ? (
            <TypeBadge value={row.leadType95rm} kind="lead" />
          ) : (
            <span className="text-slate-400">-</span>
          ),
      },
      {
        title: "Blacklisted Brands",
        key: "blacklistedBrands",
        getValue: (row) => row.blacklistedBrands.map(getBrandLabel).join(", "),
        render: (row) => (
          <div className="flex flex-wrap gap-1.5">
            {row.blacklistedBrands.map((brand) => (
              <Badge key={brand}>{getBrandLabel(brand)}</Badge>
            ))}
          </div>
        ),
      },
      {
        title: "SVG History",
        key: "svgHistory",
        getValue: (row) => String(row.callHistory.svg.length),
        render: (row) => <HistoryCell count={row.callHistory.svg.length} />,
      },
      {
        title: "Benton History",
        key: "bentonHistory",
        getValue: (row) => String(row.callHistory.benton.length),
        render: (row) => <HistoryCell count={row.callHistory.benton.length} />,
      },
      {
        title: "95RM History",
        key: "rm95History",
        getValue: (row) => String(row.callHistory["95rm"].length),
        render: (row) => <HistoryCell count={row.callHistory["95rm"].length} />,
      },
    ],
    [],
  );

  if (isError) {
    return (
      <ErrorState
        error={error}
        title="Failed to load email blocklist directory"
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <div className="min-h-full">
      <Table
        isLoading={isLoading}
        data={filteredRows}
        columns={columns}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={setRowsPerPage}
        title="Email Blocklist Directory"
        description="Review leads blacklisted by terminal lead type across all brands"
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
          setSelectedLeadId(row.leadId);
        }}
      />

      <EmailBlocklistDirectoryDrawer
        row={selectedRow}
        currentIndex={currentIndex}
        rowCount={filteredRows.length}
        onCancel={() => setSelectedLeadId(null)}
        onNavigate={(index) => {
          const row = filteredRows[index];
          if (!row) return;
          setSelectedLeadId(row.leadId);
        }}
      />
    </div>
  );
}
