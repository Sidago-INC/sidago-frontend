

import { CompanySymbolBadge, TimezoneBadge, TypeBadge } from "@/components/ui";
import { Table, type Column } from "@/components/ui/Table";
import React, { useMemo } from "react";
import {
  assigneeOptions,
  ClosedContactRow,
  contactTypeOptions,
  getCompanySymbol,
  getCompanySymbolOptions,
  getLeadId,
  getLeadIdOptions,
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
};

export function ClosedContactsTable({
  data,
  tabKey,
  title,
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
        getValue: (row) => getLeadId(row),
        type: "select",
        options: getLeadIdOptions(data).map((value) => ({
          label: value,
          value,
        })),
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
        options: timezoneOptions.map((value) => ({ label: value, value })),
        render: (row) => (
          <TimezoneBadge
            timezone={row.timezone}
            index={data.findIndex((item) => item.email === row.email)}
          />
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
      { title: "Call Back Date", key: "callBackDate" },
      { title: "Last Action Date", key: "lastActionDate" },
    ],
    [data],
  );

  return (
    <div className="min-h-full">
      <Table
        data={data}
        columns={columns}
        title={title}
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
