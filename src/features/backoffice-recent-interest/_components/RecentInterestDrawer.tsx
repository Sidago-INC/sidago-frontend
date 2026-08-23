

import {
  DatePickerField,
  Drawer,
  EditableDrawerFooter,
  Select,
  Textarea,
  TextInput,
} from "@/components/ui";
import type { Column } from "@/components/ui/Table";
import { openPrintFrame } from "@/lib/print-html";
import { DrawerCompanyField } from "@/features/backoffice-shared/DrawerCompanyField";
import {
  getLeadGridLabel,
  getLeadId,
} from "@/features/backoffice-shared/constants";
import { useAgentSelectOptions } from "@/features/backoffice-shared/use-agent-select-options";
import { useDrawerCompanyIdentity } from "@/features/backoffice-shared/use-drawer-company-select";
import {
  getCallBackDateError,
  getMinCallBackDate,
} from "@/features/agent-calls/_lib/utils";
import {
  type RecentInterestRow,
} from "../_lib/data";
import { Check, ChevronDown, ChevronUp, Link, Printer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { showSuccessToast } from "@/lib/toast";
import Revisions from "@/features/backoffice-shared/Revisions";
import { CALL_RESULT_OPTIONS } from "@/types/call-result.types";
import { LEAD_TYPE_OPTIONS } from "@/types/lead-type.types";

type RecentInterestDrawerProps = {
  data: RecentInterestRow[];
  columns?: Column<RecentInterestRow>[];
  brand: "svg" | "95rm" | "benton";
  selectedIndex: number | null;
  onSelectedIndexChange: (index: number) => void;
  onClose: () => void;
};

const iconClass = "h-4 w-4 stroke-[2]";

type EditableRecentInterestState = {
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  leadType: string;
  created: string;
  assignedTo: string;
  followUpDateCleaned: string;
  callResult: string;
  notes: string;
};

function getEditableState(row: RecentInterestRow): EditableRecentInterestState {
  return {
    companyName: row.companyName,
    contactPerson: row.contactPerson,
    phone: row.phone,
    email: row.email,
    leadType: row.leadType,
    created: row.created ?? "",
    assignedTo: row.assignedTo,
    followUpDateCleaned: row.followUpDateCleaned,
    callResult: row.callResult,
    notes: row.notes,
  };
}

const callResultSelectOptions = CALL_RESULT_OPTIONS;
const leadTypeSelectOptions = LEAD_TYPE_OPTIONS;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function RecentInterestDrawer({
  data,
  columns,
  brand,
  selectedIndex,
  onSelectedIndexChange,
  onClose,
}: RecentInterestDrawerProps) {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const [copied, setCopied] = useState(false);
  const [followUpDateError, setFollowUpDateError] = useState<string>();
  const [editModeKey, setEditModeKey] = useState<string | null>(null);
  const [formState, setFormState] = useState<{
    key: string;
    value: EditableRecentInterestState;
  } | null>(null);
  const agentsQuery = useAgentSelectOptions(brand);

  const row = selectedIndex === null ? null : (data[selectedIndex] ?? null);
  const rowKey = row?.email ?? "";
  const drawerOpen = row !== null && selectedIndex !== null;
  const isEditMode = rowKey !== "" && editModeKey === rowKey;
  const initialForm = useMemo(
    () => (row ? getEditableState(row) : null),
    [row],
  );
  const form = formState?.key === rowKey ? formState.value : initialForm;

  const updateForm = <Key extends keyof EditableRecentInterestState>(
    key: Key,
    value: EditableRecentInterestState[Key],
  ) => {
    if (!form) return;

    setFormState({
      key: rowKey,
      value: {
        ...(formState?.key === rowKey && formState.value ? formState.value : form),
        [key]: value,
      },
    });
  };

  const {
    displayCompanySymbol,
    displayTimezone,
  } = useDrawerCompanyIdentity({
    drawerOpen,
    rowCompanySymbol: row?.companySymbol,
    rowCompanyName: row?.companyName,
    rowTimezone: row?.timezone,
  });

  const detailItems = useMemo(() => {
    if (!row) {
      return [];
    }

    return (columns ?? []).map((column) => {
      const resolvedValue = column.getValue
        ? column.getValue(row)
        : row[column.key as keyof RecentInterestRow];

      return {
        label: column.title,
        value:
          typeof resolvedValue === "string" || typeof resolvedValue === "number"
            ? String(resolvedValue)
            : resolvedValue == null
              ? "-"
              : String(resolvedValue),
      };
    });
  }, [columns, row]);

  const drawerUrl = useMemo(() => {
    if (!row || typeof window === "undefined") {
      return "";
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("lead", getLeadId(row));
    return `${window.location.origin}${pathname}?${params.toString()}`;
  }, [pathname, row, searchParams]);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  useEffect(() => {
    setFollowUpDateError(undefined);
  }, [rowKey]);

  if (!row || selectedIndex === null || !form) {
    return null;
  }

  const currentIndex = selectedIndex;

  const handleReset = () => {
    setFormState(null);
    setFollowUpDateError(undefined);
  };

  const handleEditStart = () => {
    if (!rowKey) return;
    setEditModeKey(rowKey);
  };

  const handleFollowUpDateChange = (value: string) => {
    const error = getCallBackDateError(value, "");
    setFollowUpDateError(error);
    if (error) return;
    updateForm("followUpDateCleaned", value);
  };

  const handleSave = () => {
    setFormState({
      key: rowKey,
      value: {
        ...form,
        companyName: form.companyName.trim(),
        contactPerson: form.contactPerson.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        notes: form.notes.trim(),
      },
    });
    showSuccessToast("Recent interest changes saved successfully.");
    setEditModeKey(null);
  };

  const handlePrint = () => {
    if (typeof window === "undefined") {
      return;
    }

    const printWindow = openPrintFrame();
    if (!printWindow) {
      return;
    }

    const rowsMarkup = detailItems
      .map(
        (item) => `
          <tr>
            <td style="width:38%;border:1px solid #cbd5e1;padding:10px;font-weight:600;background:#f8fafc;">
              ${escapeHtml(item.label)}
            </td>
            <td style="border:1px solid #cbd5e1;padding:10px;">
              ${escapeHtml(item.value || "-")}
            </td>
          </tr>
        `,
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>${escapeHtml(row.companyName)} | Recent Interest</title>
        </head>
        <body style="font-family:Arial,sans-serif;padding:24px;color:#0f172a;">
          <h1>${escapeHtml(row.companyName)}</h1>
          <p style="margin-bottom:20px;color:#475569;">
            ${escapeHtml(row.contactPerson)} | ${escapeHtml(row.email)}
          </p>
          <table style="width:100%;border-collapse:collapse;">
            ${rowsMarkup}
          </table>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleCopyUrl = async () => {
    if (!drawerUrl) {
      return;
    }

    await navigator.clipboard.writeText(drawerUrl);
    setCopied(true);
  };

  return (
    <Drawer
      isOpen={selectedIndex !== null}
      onClose={onClose}
      direction="right"
      size="560px"
      header={
        <div className="flex w-full items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectedIndexChange(currentIndex - 1)}
              disabled={currentIndex <= 0}
              className="group flex h-7 w-7 cursor-pointer items-center justify-center rounded border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronUp
                className={`${iconClass} group-hover:-translate-y-0.5 transition`}
              />
            </button>
            <button
              onClick={() => onSelectedIndexChange(currentIndex + 1)}
              disabled={currentIndex >= data.length - 1}
              className="group flex h-7 w-7 cursor-pointer items-center justify-center rounded border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronDown
                className={`${iconClass} group-hover:translate-y-0.5 transition`}
              />
            </button>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {getLeadGridLabel({
                  companySymbol: displayCompanySymbol,
                  companyName: form.companyName,
                  fullName: form.contactPerson,
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              title="Print"
              className="group flex h-7 w-7 cursor-pointer items-center justify-center rounded border border-slate-200 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Printer
                className={`${iconClass} group-hover:scale-110 transition`}
              />
            </button>
            <button
              onClick={handleCopyUrl}
              title={copied ? "Copied!" : "Copy URL"}
              aria-label={copied ? "Link copied" : "Copy link to this lead"}
              className="group flex h-7 w-7 cursor-pointer items-center justify-center rounded border border-slate-200 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {copied ? (
                <Check className={`${iconClass} text-emerald-500`} />
              ) : (
                <Link className={`${iconClass} group-hover:scale-110 transition`} />
              )}
            </button>
          </div>
        </div>
      }
      footer={<Revisions leadId={row?.leadId} />}
    >
      {/* Recent Interest is a reporting view. The Save / Cancel / Reset footer
          used to appear the moment a field took focus; the customer asked for
          it to go. The fields are disabled to match, so nothing can be typed
          here and then silently lost with no way to save it. */}
      <fieldset disabled className="space-y-5 border-0 p-0 m-0">
        <DetailCard>
          <DrawerCompanyField
            badgeIndex={data.findIndex((item) => item.email === row.email)}
            companyName={form.companyName}
            displayCompanySymbol={displayCompanySymbol}
            displayTimezone={displayTimezone}
          />
        </DetailCard>

        <DetailCard label="Contact Details">
          <EditableField label="Contact Person">
            <TextInput
              value={form.contactPerson}
              onChange={(event) =>
                updateForm("contactPerson", event.target.value)
              }
              className="text-xs font-semibold"
            />
          </EditableField>
          <EditableField label="Phone">
            <TextInput
              value={form.phone}
              onChange={(event) => updateForm("phone", event.target.value)}
              className="text-xs font-semibold"
            />
          </EditableField>
          <EditableField label="Email">
            <TextInput
              type="email"
              value={form.email}
              onChange={(event) => updateForm("email", event.target.value)}
              className="text-xs font-semibold"
            />
          </EditableField>
        </DetailCard>

        <DetailCard label="Recent Interest">
          <EditableField label="Lead Type">
            <Select
              value={form.leadType}
              onChange={(value) => updateForm("leadType", String(value))}
              options={leadTypeSelectOptions}
              className="py-1.5 text-xs font-semibold"
            />
          </EditableField>
          <EditableField label="Created">
            <DatePickerField
              value={form.created}
              onChange={(value) => updateForm("created", value)}
              className="text-xs font-semibold"
            />
          </EditableField>
          <EditableField label="Assigned To">
            <Select
              value={form.assignedTo}
              onChange={(value) => updateForm("assignedTo", String(value))}
              options={agentsQuery.options}
              placeholder={
                agentsQuery.isLoading ? "Loading agents..." : "Select assignee"
              }
              disabled={agentsQuery.isLoading}
              searchable
              searchPlaceholder="Search agent"
              className="py-1.5 text-xs font-semibold"
            />
          </EditableField>
          <EditableField label="Followup Date">
            <DatePickerField
              value={form.followUpDateCleaned}
              onChange={handleFollowUpDateChange}
              minDate={getMinCallBackDate("")}
              error={followUpDateError}
              className="text-xs font-semibold"
            />
          </EditableField>
          <EditableField label="Call Result">
            <Select
              value={form.callResult}
              onChange={(value) => updateForm("callResult", String(value))}
              options={callResultSelectOptions}
              className="py-1.5 text-xs font-semibold"
            />
          </EditableField>
          <EditableField label="Notes" align="stack">
            <Textarea
              value={form.notes}
              onChange={(event) => updateForm("notes", event.target.value)}
              rows={4}
              className="text-xs font-semibold leading-5"
            />
          </EditableField>
        </DetailCard>
      </fieldset>
    </Drawer>
  );
}

function DetailCard({
  label,
  children,
}: {
  label?: string | React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-700 dark:bg-gray-800">
      {typeof label === "string" ? (
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          {label}
        </p>
      ) : (
        <>{label}</>
      )}
      <div className="space-y-0">{children}</div>
    </div>
  );
}

function EditableField({
  label,
  children,
  align = "row",
}: {
  label: string;
  children: React.ReactNode;
  align?: "row" | "stack";
}) {
  return (
    <div
      className={
        align === "stack"
          ? "space-y-1 py-2"
          : "flex items-center justify-between gap-4 py-1.5"
      }
    >
      <p className="shrink-0 text-[10px] uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <div className={align === "stack" ? "w-full" : "w-64 max-w-[65%]"}>
        {children}
      </div>
    </div>
  );
}
