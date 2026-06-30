

import { CampaignBadge, CompanySymbolBadge, TypeBadge } from "@/components/ui";
import { Table, type Column, type ServerPaginationConfig } from "@/components/ui/Table";
import {
  getCompanySymbolOptions,
  getLeadGridLabel,
  getRowCompanySymbol,
} from "@/features/backoffice-shared/constants";
import { findDrawerRouteIndex } from "@/features/backoffice-shared/drawer-route";
import { useAgentSelectOptions } from "@/features/backoffice-shared/use-agent-select-options";
import { useSearchParams } from "react-router-dom";
import React, { useEffect, useMemo, useState } from "react";
import { RecentInterestDrawer } from "./RecentInterestDrawer";
import {
  RecentInterestRow,
  recentInterestCallResultOptions,
  recentInterestCampaignOptions,
  recentInterestLeadTypeOptions,
} from "../_lib/data";

type RecentInterestTableProps = {
  data: RecentInterestRow[];
  title: string;
  brand: "svg" | "95rm" | "benton";
  serverPagination?: ServerPaginationConfig;
};

function getRecentInterestLeadLabel(row: RecentInterestRow) {
  return getLeadGridLabel({
    companySymbol: getRowCompanySymbol(row),
    companyName: row.companyName,
    fullName: row.contactPerson,
  });
}

export function RecentInterestTable({
  data,
  title,
  brand,
  serverPagination,
}: RecentInterestTableProps) {
  const [searchParams] = useSearchParams();
  const selectedLead = searchParams.get("lead");
  const agentsQuery = useAgentSelectOptions(brand);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(() =>
    findDrawerRouteIndex(data, selectedLead),
  );

  useEffect(() => {
    setSelectedIndex(findDrawerRouteIndex(data, selectedLead));
  }, [data, selectedLead]);

  const columns = useMemo<Column<RecentInterestRow>[]>(
    () => [
      {
        title: "Follow-up Date (Cleaned)",
        key: "followUpDateCleaned",
        type: "date",
      },
      {
        title: "Lead ID",
        key: "lead",
        getValue: getRecentInterestLeadLabel,
        type: "select",
        options: data
          .map(getRecentInterestLeadLabel)
          .filter(Boolean)
          .map((value) => ({
            label: value,
            value,
          })),
        render: (row) => getRecentInterestLeadLabel(row) || "-",
      },
      {
        title: "Campaign Type",
        key: "campaignType",
        type: "select",
        options: recentInterestCampaignOptions.map((value) => ({
          label: value,
          value,
        })),
        render: (row) => <CampaignBadge value={row.campaignType} />,
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
      { title: "Contact Person", key: "contactPerson" },
      { title: "Email", key: "email" },
      {
        title: "Assigned To",
        key: "assignedTo",
        type: "select",
        options: agentsQuery.options,
      },
      {
        title: "Call Result",
        key: "callResult",
        type: "select",
        options: recentInterestCallResultOptions.map((value) => ({
          label: value,
          value,
        })),
      },
      {
        title: "Lead Type",
        key: "leadType",
        type: "select",
        options: recentInterestLeadTypeOptions.map((value) => ({
          label: value,
          value,
        })),
        render: (row) => <TypeBadge value={row.leadType} kind="lead" />,
      },
      { title: "Notes", key: "notes" },
      { title: "Phone", key: "phone" },
    ],
    [agentsQuery.options, data],
  );

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
      <RecentInterestDrawer
        data={data}
        columns={columns}
        brand={brand}
        selectedIndex={selectedIndex}
        onSelectedIndexChange={setSelectedIndex}
        onClose={() => setSelectedIndex(null)}
      />
    </div>
  );
}
