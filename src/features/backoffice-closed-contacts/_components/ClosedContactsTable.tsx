
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
} from "../_lib/data";
import { ClosedContactDrawer } from "./CloseContactDrawer";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

type ClosedContactsTableProps = {
  data: ClosedContactRow[];
  title: string;
};

export function ClosedContactsTable({ data, title }: ClosedContactsTableProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const selectedIndex = useMemo(() => {
    const selectedLead = searchParams.get("lead");
    if (!selectedLead) return null;
    const idx = data.findIndex((row) => row.email === selectedLead);
    return idx >= 0 ? idx : null;
  }, [data, searchParams]);

  const updateRouteForIndex = (index: number | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (index === null) {
      params.delete("lead");
    } else {
      params.set("lead", data[index].email);
    }
    const query = params.toString();
    navigate(query ? `${pathname}?${query}` : pathname, { replace: true });
  };

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
          updateRouteForIndex(index >= 0 ? index : null);
        }}
      />
      <ClosedContactDrawer
        data={data}
        columns={columns}
        selectedIndex={selectedIndex}
        onSelectedIndexChange={updateRouteForIndex}
        onClose={() => updateRouteForIndex(null)}
      />
    </div>
  );
}
