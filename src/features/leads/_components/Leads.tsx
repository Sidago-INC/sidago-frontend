

import { CompanySymbolBadge, TypeBadge } from "@/components/ui";
import { Table, type Column } from "@/components/ui/Table";
import { findDrawerRouteIndex } from "@/features/backoffice-shared/drawer-route";
import {
  getCompanySymbolOptions,
  getLeadGridLabel,
  getRowCompanySymbol,
} from "@/features/backoffice-shared/constants";
import { CONTACT_TYPE_VALUES } from "@/types/contact-type.types";
import { LEAD_TYPE_VALUES } from "@/types/lead-type.types";
import { useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useServerPagination } from "@/lib/use-server-pagination";
import { LeadsDrawer } from "./LeadsDrawer";
import { assigneeOptions, type LeadDirectoryRow } from "../_lib/data";
import { useLeadsDirectory } from "../_lib/hooks";

export function Leads() {
  const [searchParams] = useSearchParams();
  const selectedLead = searchParams.get("lead");
  const { page, perPage, setPage, setPerPage } = useServerPagination();
  const { data: result, isLoading } = useLeadsDirectory(page, perPage);
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

  const columns = useMemo<Column<LeadDirectoryRow>[]>(
    () => [
      {
        title: "Lead ID",
        key: "lead",
        getValue: (row) => getLeadGridLabel(row),
        type: "select",
        options: rows.map(getLeadGridLabel).filter(Boolean).map((value) => ({
          label: value,
          value,
        })),
        render: (row) => getLeadGridLabel(row) || "-",
      },
      {
        title: "Company Symbol",
        key: "companySymbol",
        getValue: (row) => getRowCompanySymbol(row),
        type: "select",
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
      { title: "Company Name", key: "companyName" },
      { title: "Full Name", key: "fullName" },
      {
        title: "Contact Type",
        key: "contactType",
        type: "select",
        options: CONTACT_TYPE_VALUES.map((value) => ({ label: value, value })),
        render: (row) => <TypeBadge value={row.contactType} kind="contact" />,
      },
      {
        title: "SVG - Lead Type",
        key: "svgLeadType",
        type: "select",
        options: LEAD_TYPE_VALUES.map((value) => ({ label: value, value })),
        render: (row) => <TypeBadge value={row.svgLeadType} kind="lead" />,
      },
      {
        title: "SVG - To Be Called By",
        key: "svgToBeCalledBy",
        type: "select",
        options: assigneeOptions.map((value) => ({ label: value, value })),
      },
      {
        title: "BENTON - Lead Type",
        key: "bentonLeadType",
        type: "select",
        options: LEAD_TYPE_VALUES.map((value) => ({ label: value, value })),
        render: (row) => <TypeBadge value={row.bentonLeadType} kind="lead" />,
      },
      {
        title: "BENTON - To Be Called By",
        key: "bentonToBeCalledBy",
        type: "select",
        options: assigneeOptions.map((value) => ({ label: value, value })),
      },
      {
        title: "95rm - Lead Type",
        key: "rm95LeadType",
        type: "select",
        options: LEAD_TYPE_VALUES.map((value) => ({ label: value, value })),
        render: (row) => <TypeBadge value={row.rm95LeadType} kind="lead" />,
      },
      {
        title: "95rm - To Be Called By",
        key: "rm95ToBeCalledBy",
        type: "select",
        options: assigneeOptions.map((value) => ({ label: value, value })),
      },
      { title: "Phone", key: "phone" },
      {
        title: "Email",
        key: "email",
      },
    ],
    [rows],
  );

  return (
    <div className="min-h-full">
      <Table
        data={rows}
        columns={columns}
        isLoading={isLoading}
        serverPagination={serverPagination}
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
