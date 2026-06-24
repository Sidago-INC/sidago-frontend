

import {
  CompanySymbolBadge,
  GridEmptyState,
  TimezoneBadge,
  TypeBadge,
} from "@/components/ui";
import { Table, type Column } from "@/components/ui/Table";
import { useSearchParams } from "react-router-dom";
import { findDrawerRouteIndex } from "@/features/backoffice-shared/drawer-route";
import {
  getCompanySymbolOptions,
  getLeadGridLabel,
  getRowCompanySymbol,
} from "@/features/backoffice-shared/constants";
import { useAgentSelectOptions } from "@/features/backoffice-shared/use-agent-select-options";
import React, { useEffect, useMemo, useState } from "react";
import { UnassignedHotDrawer } from "./UnassignedHotDrawer";
import {
  contactTypeOptions,
  leadTypeOptions,
  timezoneOptions,
  UnassignedHotLeadRow,
} from "../_lib/data";

type UnassignedHotLeadsTableProps = {
  data: UnassignedHotLeadRow[];
  title: string;
  variant: "svg" | "95rm" | "benton";
};

export function UnassignedHotTable({
  data,
  title,
  variant,
}: UnassignedHotLeadsTableProps) {
  const [searchParams] = useSearchParams();
  const selectedLead = searchParams.get("lead");

  const [selectedIndex, setSelectedIndex] = useState<number | null>(() =>
    findDrawerRouteIndex(data, selectedLead),
  );

  useEffect(() => {
    setSelectedIndex(findDrawerRouteIndex(data, selectedLead));
  }, [data, selectedLead]);

  const svgAgentsQuery = useAgentSelectOptions("svg");
  const bentonAgentsQuery = useAgentSelectOptions("benton");
  const rm95AgentsQuery = useAgentSelectOptions("95rm");

  const columns = useMemo<Column<UnassignedHotLeadRow>[]>(() => {
    const baseColumns: Column<UnassignedHotLeadRow>[] = [
      {
        title: "Lead ID",
        key: "lead",
        getValue: (row) => getLeadGridLabel(row),
        type: "select",
        options: data.map(getLeadGridLabel).filter(Boolean).map((value) => ({
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
        title: "Time zone",
        key: "timezone",
        type: "select",
        options: timezoneOptions.map((value) => ({ label: value, value })),
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
    ];

    if (variant === "svg") {
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
          title: "To be called by Sidago",
          key: "svgToBeCalledBy",
          type: "select",
          options: svgAgentsQuery.options,
        },
        {
          title: "Last called date Sidago",
          key: "svgLastCallDate",
          type: "date",
        },
        {
          title: "Lead Type Benton",
          key: "bentonLeadType",
          type: "select",
          options: leadTypeOptions.map((value) => ({ label: value, value })),
          render: (row) => <TypeBadge value={row.bentonLeadType} kind="lead" />,
        },
        {
          title: "To be called by Benton",
          key: "bentonToBeCalledBy",
          type: "select",
          options: bentonAgentsQuery.options,
        },
        {
          title: "Last called date Benton",
          key: "bentonLastCallDate",
          type: "date",
        },
        {
          title: "Lead Type 95RM",
          key: "rm95LeadType",
          type: "select",
          options: leadTypeOptions.map((value) => ({ label: value, value })),
          render: (row) => <TypeBadge value={row.rm95LeadType} kind="lead" />,
        },
        {
          title: "To be called by 95RM",
          key: "rm95ToBeCalledBy",
          type: "select",
          options: rm95AgentsQuery.options,
        },
        {
          title: "Last called date 95RM",
          key: "rm95LastCallDate",
          type: "date",
        },
        {
          title: "Date Become Hot",
          key: "svgDateBecomeHot",
          type: "date",
        },
        {
          title: "Last Action Date (SVG, Benton, 95RM)",
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
          options: rm95AgentsQuery.options,
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
        options: svgAgentsQuery.options,
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
        options: bentonAgentsQuery.options,
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
        title: "Last Action Date (SVG, Benton, 95RM)",
        key: "lastActionDate",
      },
    ];
  }, [
    bentonAgentsQuery.options,
    data,
    rm95AgentsQuery.options,
    svgAgentsQuery.options,
    variant,
  ]);

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
        emptyState={
          <GridEmptyState
            title="No leads yet"
            message="Your team has already picked up every hot lead in this queue. When new unassigned leads arrive, they will appear here automatically."
          />
        }
      />
      <UnassignedHotDrawer
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
