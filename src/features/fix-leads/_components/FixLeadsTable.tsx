

import {
  Button,
  CompanySymbolBadge,
  Table,
  TimezoneBadge,
} from "@/components/ui";
import { type Column } from "@/components/ui/Table";
import { useMemo } from "react";
import {
  type FixLeadRow,
  getCompanySymbol,
  getCompanySymbolOptions,
  getLeadId,
  getLeadIdOptions,
  timezoneOptions,
} from "../_lib/data";

type FixLeadsTableProps = {
  data: FixLeadRow[];
  title: string;
};

export function FixLeadsTable({ data, title }: FixLeadsTableProps) {
  const columns = useMemo<Column<FixLeadRow>[]>(
    () => [
      {
        title: "Leads",
        key: "lead",
        getValue: (row) =>
          getLeadId({ companyName: row.companyName, lead: row.lead }),
        type: "select",
        options: getLeadIdOptions(data).map((value) => ({
          label: value,
          value,
        })),
      },
      { title: "Company Name", key: "companyName" },
      {
        title: "Company",
        key: "company",
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
      { title: "Name", key: "name" },
      { title: "Phone", key: "phone" },
      { title: "Fix Entry Date", key: "fixEntryDate", type: "date" },
      { title: "Email", key: "email" },
      {
        title: "Fix Lead",
        key: "fixLead",
        render: () => (
          <Button className="cursor-pointer inline-flex h-6 items-center justify-center rounded border border-blue-600 bg-blue-500 px-4 text-sm font-semibold text-white transition hover:bg-blue-600 dark:border-blue-400 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-500">
            Fix
          </Button>
        ),
      },
      { title: "Other Contacts", key: "otherContacts" },
    ],
    [data],
  );

  return (
    <Table
      data={data}
      columns={columns}
      title={title}
      showToolbarTitle={false}
      description=""
    />
  );
}
