
import { CampaignBadge, TypeBadge } from "@/components/ui";
import { Table, type Column } from "@/components/ui/Table";
import { getLeadId, getLeadIdOptions } from "@/features/backoffice-shared/constants";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import React, { useMemo } from "react";
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
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const selectedIndex = useMemo(() => {
    const selectedLead = searchParams.get("lead");

    if (!selectedLead) {
      return null;
    }

    const nextIndex = data.findIndex((row) => row.email === selectedLead);
    return nextIndex >= 0 ? nextIndex : null;
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
        getValue: (row) => getLeadId(row),
        type: "select",
        options: getLeadIdOptions(data).map((value) => ({
          label: value,
          value,
        })),
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
          updateRouteForIndex(index >= 0 ? index : null);
        }}
      />
      <RecentInterestDrawer
        data={data}
        columns={columns}
        selectedIndex={selectedIndex}
        onSelectedIndexChange={updateRouteForIndex}
        onClose={() => updateRouteForIndex(null)}
      />
    </div>
  );
}
