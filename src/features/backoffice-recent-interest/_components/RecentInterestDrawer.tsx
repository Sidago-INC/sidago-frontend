

import {
  CompanySymbolBadge,
  DatePickerField,
  Drawer,
  EditableDrawerFooter,
  Select,
  TimezoneBadge,
  Textarea,
  TextInput,
} from "@/components/ui";
import type { Column } from "@/components/ui/Table";
import {
  recentInterestAssigneeOptions,
  recentInterestCallResultOptions,
  recentInterestLeadTypeOptions,
  type RecentInterestRow,
} from "../_lib/data";
import { ChevronDown, ChevronUp, Link, Printer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import {
  getCompanySymbol,
  getLeadId,
} from "@/features/backoffice-shared/constants";
import { showSuccessToast } from "@/lib/toast";
import Revisions from "@/features/backoffice-shared/Revisions";

type RecentInterestDrawerProps = {
  data: RecentInterestRow[];
  columns?: Column<RecentInterestRow>[];
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

const assigneeSelectOptions = recentInterestAssigneeOptions.map((value) => ({
  label: value,
  value,
}));
const callResultSelectOptions = recentInterestCallResultOptions.map(
  (value) => ({
    label: value,
    value,
  }),
);
const leadTypeSelectOptions = recentInterestLeadTypeOptions.map((value) => ({
  label: value,
  value,
}));

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
  selectedIndex,
  onSelectedIndexChange,
  onClose,
}: RecentInterestDrawerProps) {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const [copied, setCopied] = useState(false);
  const [editModeKey, setEditModeKey] = useState<string | null>(null);
  const [formState, setFormState] = useState<{
    key: string;
    value: EditableRecentInterestState;
  } | null>(null);

  const row = selectedIndex === null ? null : (data[selectedIndex] ?? null);
  const rowKey = row?.email ?? "";
  const isEditMode = rowKey !== "" && editModeKey === rowKey;
  const initialForm = useMemo(
    () => (row ? getEditableState(row) : null),
    [row],
  );
  const form = formState?.key === rowKey ? formState.value : initialForm;

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

  if (!row || selectedIndex === null || !form) {
    return null;
  }

  const currentIndex = selectedIndex;

  const updateForm = <Key extends keyof EditableRecentInterestState>(
    key: Key,
    value: EditableRecentInterestState[Key],
  ) => {
    setFormState((current) => ({
      key: rowKey,
      value: {
        ...(current?.key === rowKey && current.value ? current.value : form),
        [key]: value,
      },
    }));
  };

  const handleReset = () => {
    setFormState(null);
  };

  const handleEditStart = () => {
    if (!rowKey) return;
    setEditModeKey(rowKey);
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

    const printWindow = window.open("", "_blank", "width=900,height=700");
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
                {row.lead}
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
              title="Copy URL"
              className="group flex h-7 w-7 cursor-pointer items-center justify-center rounded border border-slate-200 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Link
                className={`${iconClass} group-hover:scale-110 transition`}
              />
            </button>
          </div>
        </div>
      }
      footer={
        isEditMode ? (
          <EditableDrawerFooter
            onCancel={() => {
              setEditModeKey(null);
              onClose();
            }}
            onReset={handleReset}
            onSave={handleSave}
          />
        ) : (
          <Revisions />
        )
      }
    >
      <div className="space-y-5" onFocus={handleEditStart}>
        <DetailCard>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <CompanySymbolBadge
                symbol={getCompanySymbol(form.companyName)}
                index={data.findIndex((item) => item.email === row.email)}
                className="rounded"
              />
              <div className="min-w-0">
                <EditableField label="Company">
                  <TextInput
                    value={form.companyName}
                    onChange={(event) =>
                      updateForm("companyName", event.target.value)
                    }
                    className="h-8 text-sm font-semibold"
                  />
                </EditableField>
              </div>
            </div>
            <TimezoneBadge
              timezone={row.timezone}
              index={data.findIndex((item) => item.email === row.email)}
            />
          </div>
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
            <TextInput
              value={form.created}
              onChange={(event) => updateForm("created", event.target.value)}
              className="text-xs font-semibold"
            />
          </EditableField>
          <EditableField label="Assigned To">
            <Select
              value={form.assignedTo}
              onChange={(value) => updateForm("assignedTo", String(value))}
              options={assigneeSelectOptions}
              className="py-1.5 text-xs font-semibold"
            />
          </EditableField>
          <EditableField label="Followup Date">
            <DatePickerField
              value={form.followUpDateCleaned}
              onChange={(value) => updateForm("followUpDateCleaned", value)}
              className="text-xs font-semibold"
            />
          </EditableField>
          <EditableField label="Followup Date(Cleaned)">
            <DatePickerField
              value={form.followUpDateCleaned}
              onChange={(value) => updateForm("followUpDateCleaned", value)}
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
      </div>
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
