

import { CompanySymbolBadge, TypeBadge } from "@/components/ui";
import { Table, type Column } from "@/components/ui/Table";
import { findDrawerRouteIndex } from "@/features/backoffice-shared/drawer-route";
import { getLeadGridLabel } from "@/features/backoffice-shared/constants";
import { CONTACT_TYPE_VALUES } from "@/types/contact-type.types";
import { LEAD_TYPE_VALUES } from "@/types/lead-type.types";
import { useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { LeadsDrawer } from "./LeadsDrawer";
import {
  assigneeOptions,
  getCompanySymbol,
  getCompanySymbolOptions,
  getLeadId,
  getLeadIdOptions,
  type LeadDirectoryRow,
} from "../_lib/data";
import { useLeadsDirectory } from "../_lib/hooks";

export function Leads() {
  const [searchParams] = useSearchParams();
  const selectedLead = searchParams.get("lead");
  const { data: rows = [], isLoading } = useLeadsDirectory();
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
      },
      {
        title: "Company Symbol",
        key: "companySymbol",
        getValue: (row) => getCompanySymbol(row.companyName),
        type: "select",
        options: getCompanySymbolOptions(rows).map((value) => ({
          label: value,
          value,
        })),
        render: (row) => (
          <CompanySymbolBadge
            symbol={getCompanySymbol(row.companyName)}
            index={rows.findIndex((item) => item.email === row.email)}
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
        title="Leads"
        description="All lead records across SVG, Benton, and 95RM"
        onRowClick={(row) => {
          const index = rows.findIndex((item) => item.email === row.email);
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
