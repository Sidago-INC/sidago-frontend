

import { CompanySymbolBadge, TimezoneBadge, TypeBadge } from "@/components/ui";
import { Table, type Column, type ServerPaginationConfig } from "@/components/ui/Table";
import { useCompanyOptions } from "@/features/companies/_lib/hooks";
import React, { useEffect, useMemo, useState } from "react";
import { getLeadGridLabel } from "@/features/backoffice-shared/constants";
import { CurrentlyHotDrawer } from "./CurrentlyHotDrawer";
import {
  assigneeOptions,
  contactTypeOptions,
  getCompanySymbolOptions,
  getHotLeadTimezone,
  getRowCompanySymbol,
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
  serverPagination?: ServerPaginationConfig;
};

export function CurrentlyHotTable({
  data,
  title,
  variant,
  serverPagination,
}: CurrentlyHotTableProps) {
  const [searchParams] = useSearchParams();
  const selectedLead = searchParams.get("lead");

  const [selectedIndex, setSelectedIndex] = useState<number | null>(() =>
    findDrawerRouteIndex(data, selectedLead),
  );

  useEffect(() => {
    setSelectedIndex(findDrawerRouteIndex(data, selectedLead));
  }, [data, selectedLead]);

  const { data: companyResult } = useCompanyOptions(1);
  const companies = companyResult?.data ?? [];

  const columns = useMemo<Column<LeadRow>[]>(() => {
    const baseColumns: Column<LeadRow>[] = [
      {
        title: "Lead ID",
        key: "lead",
        getValue: (row) => getLeadGridLabel(row),
        type: "select",
        options: data.map(getLeadGridLabel).filter(Boolean).map((value) => ({
          label: value,
          value,
        })),
        render: (row) => getLeadGridLabel(row),
      },
      {
        title: "Company Symbol",
        key: "companySymbol",
        getValue: (row) => getRowCompanySymbol(row),
        type: "select",
        options: getCompanySymbolOptions(data).map((value) => ({
          label: value,
          value,
        })),
        render: (row) => (
          <CompanySymbolBadge
            symbol={getRowCompanySymbol(row)}
            index={data.findIndex((item) => item.email === row.email)}
            className="rounded"
            maxWidth="6.5rem"
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
          <TimezoneBadge timezone={getHotLeadTimezone(row, companies)} />
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
  }, [companies, data, variant]);

  return (
    <div className="min-h-full">
      <Table
        data={data}
        columns={columns}
        title={title}
        serverPagination={serverPagination}
        onRowClick={(row) => {
          const index = data.findIndex((item) => item.email === row.email);
          setSelectedIndex(index >= 0 ? index : null);
        }}
      />
      <CurrentlyHotDrawer
        data={data}
        columns={columns}
        variant={variant}
        selectedIndex={selectedIndex}
        onSelectedIndexChange={setSelectedIndex}
        onClose={() => setSelectedIndex(null)}
      />
    </div>
  );
}
