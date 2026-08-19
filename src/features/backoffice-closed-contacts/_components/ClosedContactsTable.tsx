

import { CompanySymbolBadge, TimezoneBadge, TypeBadge } from "@/components/ui";
import {
  Table,
  type Column,
  type ServerGridConfig,
  type ServerPaginationConfig,
  type ServerSearchConfig,
} from "@/components/ui/Table";
import React, { useMemo } from "react";
import { getLeadGridLabel } from "@/features/backoffice-shared/constants";
import {
  assigneeOptions,
  ClosedContactRow,
  contactTypeOptions,
  getCompanySymbol,
  getCompanySymbolOptions,
  leadTypeOptions,
  timezoneOptions,
  type ClosedContactsTabKey,
} from "../_lib/data";
import { ClosedContactDrawer } from "./CloseContactDrawer";
import { useSearchParams } from "react-router-dom";
import { findDrawerRouteIndex } from "@/features/backoffice-shared/drawer-route";

type ClosedContactsTableProps = {
  data: ClosedContactRow[];
  tabKey: ClosedContactsTabKey;
  title: string;
  serverPagination?: ServerPaginationConfig;
  serverSearch?: ServerSearchConfig;
  serverGrid?: ServerGridConfig;
};

export function ClosedContactsTable({
  data,
  tabKey,
  title,
  serverPagination,
  serverSearch,
  serverGrid,
}: ClosedContactsTableProps) {
  const [searchParams] = useSearchParams();
  const selectedLead = searchParams.get("lead");

  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(() =>
    findDrawerRouteIndex(data, selectedLead),
  );

  React.useEffect(() => {
    setSelectedIndex(findDrawerRouteIndex(data, selectedLead));
  }, [data, selectedLead]);

  const columns = useMemo<Column<ClosedContactRow>[]>(
    () => [
      {
        title: "Lead ID",
        key: "lead",
        getValue: (row) => getLeadGridLabel(row),
        type: "select",
        options: data.map(getLeadGridLabel).filter(Boolean).map((value) => ({
          label: value,
          value,
        })),
        render: (row) =>
          [row.companySymbol, row.fullName].filter(Boolean).join(" - ") || "-",
      },
      {
        title: "Company Symbol",
        key: "companySymbol",
        getValue: (row) => getCompanySymbol(row.companyName),
        type: "select",
        options: getCompanySymbolOptions(data).map((value) => ({
          label: value,
          value,
        })),
        render: (row) => (
          <CompanySymbolBadge
            symbol={getCompanySymbol(row.companyName)}
            index={data.findIndex((item) => item.email === row.email)}
          />
        ),
      },
      { title: "Company Name", key: "companyName" },
      { title: "Full Name", key: "fullName" },
      { title: "Phone", key: "phone" },
      { title: "Email", key: "email" },
      {
        title: "Timezone",
        key: "timezone",
        type: "select",
        options: timezoneOptions,
        render: (row) => (
          <TimezoneBadge timezone={row.timezone} />
        ),
      },
      {
        title: "Contact Type",
        key: "contactType",
        type: "select",
        options: contactTypeOptions.map((value) => ({ label: value, value })),
        render: (row) => <TypeBadge value={row.contactType} kind="contact" />,
      },
      {
        title: "Lead Type",
        key: "leadType",
        type: "select",
        options: leadTypeOptions.map((value) => ({ label: value, value })),
        render: (row) => <TypeBadge value={row.leadType} kind="lead" />,
      },
      {
        title: "Lead Type Benton",
        key: "bentonLeadType",
        type: "select",
        options: leadTypeOptions.map((value) => ({ label: value, value })),
        render: (row) => <TypeBadge value={row.bentonLeadType} kind="lead" />,
      },
      {
        title: "SVG - To Be Called By",
        key: "svgToBeCalledBy",
        type: "select",
        options: assigneeOptions.map((value) => ({ label: value, value })),
      },
      {
        title: "Benton - To Be Called By",
        key: "bentonToBeCalledBy",
        type: "select",
        options: assigneeOptions.map((value) => ({ label: value, value })),
      },
      {
        // Not a backend grid field for this report — display only.
        title: "Call Back Date",
        key: "callBackDate",
        filterable: false,
        sortable: false,
        groupable: false,
      },
      { title: "Last Action Date", key: "lastActionDate", type: "date" },
    ],
    [data],
  );

  return (
    <div className="min-h-full">
      <Table
        data={data}
        columns={columns}
        title={title}
        serverPagination={serverPagination}
        serverSearch={serverSearch}
        serverGrid={serverGrid}
        onRowClick={(row) => {
          const index = data.findIndex((item) => item.email === row.email);
          setSelectedIndex(index >= 0 ? index : null);
        }}
      />
      <ClosedContactDrawer
        data={data}
        columns={columns}
        tabKey={tabKey}
        selectedIndex={selectedIndex}
        onSelectedIndexChange={setSelectedIndex}
        onClose={() => setSelectedIndex(null)}
      />
    </div>
  );
}
