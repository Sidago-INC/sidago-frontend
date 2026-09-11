import { CompanySymbolBadge, TimezoneBadge, TypeBadge } from "@/components/ui";
import { Table, type Column } from "@/components/ui/Table";
import { findDrawerRouteIndex } from "@/features/backoffice-shared/drawer-route";
import {
  getCompanySymbolOptions,
  getLeadGridLabel,
  getRowCompanySymbol,
} from "@/features/backoffice-shared/constants";
import { CONTACT_TYPE_VALUES } from "@/types/contact-type.types";
import { useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useGridPage } from "@/lib/use-grid-page";
import { LeadsDrawer } from "./LeadsDrawer";
import {
  leadTypeOptions,
  timezoneOptions,
  type LeadDirectoryRow,
} from "../_lib/data";
import { useLeadsDirectory } from "../_lib/hooks";
import { useAgentSelectOptions } from "@/features/backoffice-shared/use-agent-select-options";

export function Leads() {
  const [searchParams] = useSearchParams();
  const selectedLead = searchParams.get("lead");
  const {
    page,
    perPage,
    setPage,
    setPerPage,
    url,
    searchInput,
    setSearchInput,
    debouncedSearch,
  } = useGridPage();



  const { data: result, isLoading } = useLeadsDirectory(
    page,
    perPage,
    debouncedSearch,
    url.grid,
  );
  const rows = result?.data ?? [];
  const serverPagination = result?.meta
    ? {
        meta: result.meta,
        onPageChange: setPage,
        onPerPageChange: setPerPage,
      }
    : undefined;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    setSelectedIndex(findDrawerRouteIndex(rows, selectedLead));
  }, [rows, selectedLead]);

  const svgAgents = useAgentSelectOptions("svg");
  const bentonAgents = useAgentSelectOptions("benton");
  const rm95Agents = useAgentSelectOptions("95rm");

  const columns = useMemo<Column<LeadDirectoryRow>[]>(
    () => [
      {
        title: "Lead ID",
        key: "lead",
        width: 280,
        getValue: (row) => getLeadGridLabel(row),
        type: "text",
        options: rows.map(getLeadGridLabel).filter(Boolean).map((value) => ({
          label: value,
          value,
        })),
        render: (row) => getLeadGridLabel(row) || "-",
      },
      {
        title: "Company Symbol",
        key: "companySymbol",
        width: 190,
        getValue: (row) => getRowCompanySymbol(row),
        type: "text",
        options: getCompanySymbolOptions(rows).map((value) => ({
          label: value,
          value,
        })),
        render: (row) => (
          <CompanySymbolBadge
            symbol={getRowCompanySymbol(row)}
            index={rows.findIndex((item) => item.leadId === row.leadId)}
          />
        ),
      },
      { title: "Company Name", key: "companyName", width: 200 },
      { title: "Full Name", key: "fullName", width: 195 },
      { title: "Phone", key: "phone", width: 150 },
      { title: "Email", key: "email", width: 220 },
      {
        title: "Timezone",
        key: "timezone",
        width: 125,
        type: "select",
        options: timezoneOptions,
        render: (row) =>
          row.timezone ? <TimezoneBadge timezone={row.timezone} /> : "-",
      },
      {
        title: "Contact Type",
        key: "contactType",
        width: 165,
        type: "select",
        options: CONTACT_TYPE_VALUES.map((value) => ({ label: value, value })),
        render: (row) => <TypeBadge value={row.contactType} kind="contact" />,
      },
      {
        title: "SVG Lead Type",
        key: "svgLeadType",
        width: 160,
        type: "select",
        options: leadTypeOptions,
        render: (row) => <TypeBadge value={row.svgLeadType} kind="lead" />,
      },
      {
        title: "SVG To Be Called By",
        key: "svgToBeCalledBy",
        width: 190,
        type: "select",
        options: svgAgents.options,
      },
      {
        title: "SVG Last Called Date",
        key: "svgLastCallDate",
        width: 165,
        type: "date",
      },
      {
        title: "Benton Lead Type",
        key: "bentonLeadType",
        width: 175,
        type: "select",
        options: leadTypeOptions,
        render: (row) => <TypeBadge value={row.bentonLeadType} kind="lead" />,
      },
      {
        title: "Benton To Be Called By",
        key: "bentonToBeCalledBy",
        width: 205,
        type: "select",
        options: bentonAgents.options,
      },
      {
        title: "Benton Last Called Date",
        key: "bentonLastCallDate",
        width: 180,
        type: "date",
      },
      {
        title: "95RM Lead Type",
        key: "rm95LeadType",
        width: 160,
        type: "select",
        options: leadTypeOptions,
        render: (row) => <TypeBadge value={row.rm95LeadType} kind="lead" />,
      },
      {
        title: "95RM To Be Called By",
        key: "rm95ToBeCalledBy",
        width: 195,
        type: "select",
        options: rm95Agents.options,
      },
      {
        title: "95RM Last Called Date",
        key: "rm95LastCallDate",
        width: 170,
        type: "date",
      },
      {
        title: "Last Action Date",
        key: "lastActionDate",
        width: 165,
        type: "date",
      },
    ],
    [rows, svgAgents.options, bentonAgents.options, rm95Agents.options],
  );

  return (
    <div className="min-h-full">
      <Table
        data={rows}
        columns={columns}
        isLoading={isLoading}
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
        title="Leads"
        description="All lead records across SVG, Benton, and 95RM"
        onRowClick={(row) => {
          const index = rows.findIndex((item) => item.leadId === row.leadId);
          setSelectedIndex(index >= 0 ? index : null);
        }}
      />

      <LeadsDrawer
        data={rows}
        columns={columns}
        selectedIndex={selectedIndex}
        onSelectedIndexChange={setSelectedIndex}
        onClose={() => setSelectedIndex(null)}
      />
    </div>
  );
}
