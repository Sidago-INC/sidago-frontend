

import { CampaignBadge, TypeBadge } from "@/components/ui";
import { Table, type Column } from "@/components/ui/Table";
import {
  getLeadGridLabel,
} from "@/features/backoffice-shared/constants";
import { findDrawerRouteIndex } from "@/features/backoffice-shared/drawer-route";
import { useSearchParams } from "react-router-dom";
import React, { useEffect, useMemo, useState } from "react";
import { RecentInterestDrawer } from "./RecentInterestDrawer";
import {
  RecentInterestRow,
  recentInterestAssigneeOptions,
  recentInterestCallResultOptions,
  recentInterestCampaignOptions,
  recentInterestLeadTypeOptions,
} from "../_lib/data";

type RecentInterestTableProps = {
  data: RecentInterestRow[];
  title: string;
};

export function RecentInterestTable({ data, title }: RecentInterestTableProps) {
  const [searchParams] = useSearchParams();
  const selectedLead = searchParams.get("lead");

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
        getValue: (row) =>
          getLeadGridLabel({
            companyName: row.companyName,
            fullName: row.contactPerson,
          }),
        type: "select",
        options: data
          .map((row) =>
            getLeadGridLabel({
              companyName: row.companyName,
              fullName: row.contactPerson,
            }),
          )
          .filter(Boolean)
          .map((value) => ({
          label: value,
          value,
        })),
        render: (row) =>
          [row.companySymbol, row.contactPerson].filter(Boolean).join(" - ") ||
          "-",
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
      { title: "Company Name", key: "companyName" },
      { title: "Contact Person", key: "contactPerson" },
      { title: "Email", key: "email" },
      {
        title: "Assigned To",
        key: "assignedTo",
        type: "select",
        options: recentInterestAssigneeOptions.map((value) => ({
          label: value,
          value,
        })),
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
      <RecentInterestDrawer
        data={data}
        columns={columns}
        selectedIndex={selectedIndex}
        onSelectedIndexChange={setSelectedIndex}
        onClose={() => setSelectedIndex(null)}
      />
    </div>
  );
}
