

import { CompanySymbolBadge, TimezoneBadge, TypeBadge } from "@/components/ui";
import { Table, type Column } from "@/components/ui/Table";
import React, { useEffect, useMemo, useState } from "react";
import { CurrentlyHotDrawer } from "./CurrentlyHotDrawer";
import {
  assigneeOptions,
  contactTypeOptions,
  getCompanySymbol,
  getCompanySymbolOptions,
  getLeadId,
  getLeadIdOptions,
  LeadRow,
  leadTypeOptions,
  timezoneOptions,
} from "../_lib/data";
import { useSearchParams } from "react-router-dom";
import { findDrawerRouteIndex } from "@/features/backoffice-shared/drawer-route";

type CurrentlyHotTableProps = {
  data: LeadRow[];
  title: string;
  variant: "svg" | "95rm" | "benton";
};

export function CurrentlyHotTable({
  data,
  title,
  variant,
}: CurrentlyHotTableProps) {
  const [searchParams] = useSearchParams();
  const selectedLead = searchParams.get("lead");

  const [selectedIndex, setSelectedIndex] = useState<number | null>(() =>
    findDrawerRouteIndex(data, selectedLead),
  );

  useEffect(() => {
    setSelectedIndex(findDrawerRouteIndex(data, selectedLead));
  }, [data, selectedLead]);

  const columns = useMemo<Column<LeadRow>[]>(() => {
    const baseColumns: Column<LeadRow>[] = [
      {
        title: "Lead ID",
        key: "lead",
        getValue: (row) => getLeadId(row),
        type: "select",
        options: getLeadIdOptions(data).map((value) => ({
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
        options: timezoneOptions.map((value) => ({
          label: value,
          value,
        })),
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
    ];

    if (variant === "svg") {
      return [
        ...baseColumns,
        {
          title: "SVG-Lead Type",
          key: "svgLeadType",
          type: "select",
          options: leadTypeOptions.map((value) => ({ label: value, value })),
          render: (row) => <TypeBadge value={row.svgLeadType} kind="lead" />,
        },
        {
          title: "SVG-To be Called by",
          key: "svgToBeCalledBy",
          type: "select",
          options: assigneeOptions.map((value) => ({ label: value, value })),
        },
        {
          title: "SVG-Last Call Date",
          key: "svgLastCallDate",
          type: "date",
        },
        {
          title: "Benton-Lead Type",
          key: "bentonLeadType",
          type: "select",
          options: leadTypeOptions.map((value) => ({ label: value, value })),
          render: (row) => <TypeBadge value={row.bentonLeadType} kind="lead" />,
        },
        {
          title: "Benton-To be Called by",
          key: "bentonToBeCalledBy",
          type: "select",
          options: assigneeOptions.map((value) => ({ label: value, value })),
        },
        {
          title: "Date Become Hot",
          key: "svgDateBecomeHot",
          type: "date",
        },
        {
          title: "Last Action Date (SVG, Benton)",
          key: "lastActionDate",
        },
      ];
    }

    if (variant === "95rm") {
      return [
        ...baseColumns,
        {
          title: "95RM-Lead Type",
          key: "rm95LeadType",
          type: "select",
          options: leadTypeOptions.map((value) => ({ label: value, value })),
          render: (row) => <TypeBadge value={row.rm95LeadType} kind="lead" />,
        },
        {
          title: "95RM-To be Called by",
          key: "rm95ToBeCalledBy",
          type: "select",
          options: assigneeOptions.map((value) => ({ label: value, value })),
        },
        {
          title: "95RM-Last Call Date",
          key: "rm95LastCallDate",
          type: "date",
        },
        {
          title: "95RM-Date Become Hot",
          key: "rm95DateBecomeHot",
          type: "date",
        },
        {
          title: "Last Action Date (95RM, SVG, Benton)",
          key: "lastActionDate",
        },
      ];
    }

    return [
      ...baseColumns,
      {
        title: "Lead Type",
        key: "svgLeadType",
        type: "select",
        options: leadTypeOptions.map((value) => ({ label: value, value })),
        render: (row) => <TypeBadge value={row.svgLeadType} kind="lead" />,
      },
      {
        title: "SVG-To be Called by",
        key: "svgToBeCalledBy",
        type: "select",
        options: assigneeOptions.map((value) => ({ label: value, value })),
      },
      {
        title: "SVG-Last Call Date",
        key: "svgLastCallDate",
        type: "date",
      },
      {
        title: "Benton-Lead Type",
        key: "bentonLeadType",
        type: "select",
        options: leadTypeOptions.map((value) => ({ label: value, value })),
        render: (row) => <TypeBadge value={row.bentonLeadType} kind="lead" />,
      },
      {
        title: "Benton-To be Called by",
        key: "bentonToBeCalledBy",
        type: "select",
        options: assigneeOptions.map((value) => ({ label: value, value })),
      },
      {
        title: "Benton-Last Call Date",
        key: "bentonLastCallDate",
        type: "date",
      },
      {
        title: "Benton-Date Become Hot",
        key: "bentonDateBecomeHot",
        type: "date",
      },
      {
        title: "Last Action Date (SVG, Benton)",
        key: "lastActionDate",
      },
    ];
  }, [data, variant]);

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
      <CurrentlyHotDrawer
        data={data}
        columns={columns}
        selectedIndex={selectedIndex}
        onSelectedIndexChange={setSelectedIndex}
        onClose={() => setSelectedIndex(null)}
      />
    </div>
  );
}
