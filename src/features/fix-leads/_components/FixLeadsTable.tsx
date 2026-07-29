import {
  Button,
  CompanySymbolBadge,
  Modal,
  Table,
  TimezoneBadge,
  TypeBadge,
  Wave,
} from "@/components/ui";
import {
  type Column,
  type ServerPaginationConfig,
  type ServerSearchConfig,
} from "@/components/ui/Table";
import { LEAD_TYPE_VALUES } from "@/types/lead-type.types";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users } from "lucide-react";
import { getLeadGridLabel } from "@/features/backoffice-shared/constants";
import {
  type FixQueueRow,
  getFixQueueTimezone,
  getFixQueueTimezoneLabel,
  useRelatedLeads,
} from "../_lib/data";

type FixLeadsTableProps = {
  data: FixQueueRow[];
  title: string;
  serverPagination?: ServerPaginationConfig;
  serverSearch?: ServerSearchConfig;
};

// "Fix" is a brand-scoped lead_type — covered by the existing LEAD_TYPE
// constants but added explicitly to the dropdown so the filter still includes
// it even when no row currently carries the value.
const FIX_LEAD_TYPE_OPTIONS = Array.from(
  new Set(["Fix", ...LEAD_TYPE_VALUES]),
).map((value) => ({ label: value, value }));

function formatFixEntryDate(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toISOString().split("T")[0];
}

function displaySymbol(row: FixQueueRow): string {
  return row.companySymbol ?? "";
}

export function FixLeadsTable({
  data,
  title,
  serverPagination,
  serverSearch,
}: FixLeadsTableProps) {
  const navigate = useNavigate();
  const [contactsModalRow, setContactsModalRow] = useState<FixQueueRow | null>(
    null,
  );

  const columns = useMemo<Column<FixQueueRow>[]>(
    () => [
      {
        title: "Lead ID",
        key: "leadId",
        getValue: (row) => getLeadGridLabel(row),
      },
      { title: "Company Name", key: "companyName" },
      {
        title: "Company",
        key: "companySymbol",
        getValue: (row) => displaySymbol(row),
        type: "select",
        options: Array.from(new Set(data.map(displaySymbol)))
          .filter(Boolean)
          .map((value) => ({ label: value, value })),
        render: (row) => (
          <CompanySymbolBadge
            symbol={displaySymbol(row)}
            index={data.findIndex((item) => item.leadId === row.leadId)}
          />
        ),
      },
      {
        title: "Timezone",
        key: "timezone",
        getValue: (row) => getFixQueueTimezoneLabel(row),
        type: "select",
        options: Array.from(
          new Set(data.map(getFixQueueTimezoneLabel).filter(Boolean)),
        ).map((value) => ({ label: value, value })),
        render: (row) => {
          const timezone = getFixQueueTimezone(row);
          return timezone ? (
            <TimezoneBadge timezone={timezone} />
          ) : (
            <span className="text-xs text-slate-400">—</span>
          );
        },
      },
      { title: "Name", key: "fullName" },
      { title: "Phone", key: "phone" },
      {
        title: "Fix Entry Date",
        key: "fixEntryDate",
        getValue: (row) => formatFixEntryDate(row.fixEntryDate),
        type: "date",
      },
      { title: "Email", key: "email" },
      {
        title: "SVG - Lead Type",
        key: "svgLeadType",
        getValue: (row) => row.svgLeadType ?? "",
        type: "select",
        options: FIX_LEAD_TYPE_OPTIONS,
        render: (row) =>
          row.svgLeadType ? (
            <TypeBadge value={row.svgLeadType} kind="lead" />
          ) : (
            <span className="text-xs text-slate-400">—</span>
          ),
      },
      {
        title: "Benton - Lead Type",
        key: "bentonLeadType",
        getValue: (row) => row.bentonLeadType ?? "",
        type: "select",
        options: FIX_LEAD_TYPE_OPTIONS,
        render: (row) =>
          row.bentonLeadType ? (
            <TypeBadge value={row.bentonLeadType} kind="lead" />
          ) : (
            <span className="text-xs text-slate-400">—</span>
          ),
      },
      {
        title: "95rm - Lead Type",
        key: "rm95LeadType",
        getValue: (row) => row.rm95LeadType ?? "",
        type: "select",
        options: FIX_LEAD_TYPE_OPTIONS,
        render: (row) =>
          row.rm95LeadType ? (
            <TypeBadge value={row.rm95LeadType} kind="lead" />
          ) : (
            <span className="text-xs text-slate-400">—</span>
          ),
      },
      {
        title: "Fix Lead",
        key: "fixLead",
        render: (row) => (
          <Button
            onClick={() => navigate(`/fix-leads/${row.leadId}`)}
            className="cursor-pointer inline-flex h-6 items-center justify-center rounded border border-blue-600 bg-blue-500 px-4 text-sm font-semibold text-white transition hover:bg-blue-600 dark:border-blue-400 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-500"
          >
            Fix
          </Button>
        ),
      },
      {
        // The lead's own other_contacts free-text field (extra phone numbers,
        // addresses, etc.) — the Airtable "other contacts" concept.
        title: "Other Contacts",
        key: "otherContacts",
        getValue: (row) => row.otherContacts ?? "",
        render: (row) =>
          row.otherContacts ? (
            <span
              title={row.otherContacts}
              className="block max-w-[220px] truncate text-sm text-slate-700 dark:text-slate-200"
            >
              {row.otherContacts}
            </span>
          ) : (
            <span className="text-xs text-slate-400">—</span>
          ),
      },
      {
        // Count of OTHER leads in the same company (distinct from the field
        // above) — opens the related-contacts modal.
        title: "Related Leads",
        key: "otherContactsCount",
        getValue: (row) => row.otherContactsCount,
        render: (row) => (
          <Button
            onClick={() => setContactsModalRow(row)}
            disabled={row.otherContactsCount === 0}
            className="cursor-pointer inline-flex h-6 items-center justify-center gap-1.5 rounded border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Users size={12} />
            {row.otherContactsCount}{" "}
            {row.otherContactsCount === 1 ? "lead" : "leads"}
          </Button>
        ),
      },
    ],
    [data, navigate],
  );

  return (
    <>
      <div className="h-full min-h-0">
        <Table
          data={data}
          columns={columns}
          serverPagination={serverPagination}
          serverSearch={serverSearch}
          title={title}
          showToolbarTitle={false}
          description=""
          emptyText="No leads are currently flagged for fix."
        />
      </div>

      <Modal
        isOpen={contactsModalRow !== null}
        onClose={() => setContactsModalRow(null)}
        title={
          contactsModalRow
            ? `Related Contacts — ${contactsModalRow.companyName ?? "Company"}`
            : undefined
        }
        description={
          contactsModalRow
            ? `${contactsModalRow.otherContactsCount} contact${
                contactsModalRow.otherContactsCount === 1 ? "" : "s"
              } in the same company`
            : undefined
        }
      >
        {contactsModalRow ? (
          <RelatedContactsList leadId={contactsModalRow.leadId} />
        ) : null}
      </Modal>
    </>
  );
}

function RelatedContactsList({ leadId }: { leadId: string }) {
  const { data, isLoading, isError } = useRelatedLeads(leadId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Wave />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="py-4 text-center text-sm text-red-600 dark:text-red-400">
        Failed to load related contacts.
      </p>
    );
  }

  if (!data || data.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-slate-500 dark:text-slate-400">
        No related contacts available.
      </p>
    );
  }

  return (
    <ul className="max-h-80 divide-y divide-slate-200 overflow-y-auto dark:divide-slate-800">
      {data.map((contact) => (
        <li key={contact.id} className="py-3">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {contact.fullName ?? "Unnamed"}
          </p>
          {contact.role ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {contact.role}
            </p>
          ) : null}
          <div className="mt-1 space-y-0.5 text-xs text-slate-600 dark:text-slate-300">
            {contact.email ? <p>{contact.email}</p> : null}
            {contact.phone ? <p>{contact.phone}</p> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
