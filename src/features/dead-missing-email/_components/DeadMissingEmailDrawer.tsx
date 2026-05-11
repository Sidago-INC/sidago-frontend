

import {
  Drawer,
  DrawerActionHeader,
  EditableField,
  Select,
  TextInput,
  Textarea,
  TypeBadge,
} from "@/components/ui";
import { LEAD_TYPE_OPTIONS } from "@/types/lead-type.types";
import { Check } from "lucide-react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import type { DeadMissingEmailRow } from "../_lib/data";

type DeadMissingEmailDrawerProps = {
  row: DeadMissingEmailRow | null;
  currentIndex: number;
  rowCount: number;
  onCancel: () => void;
  onChange: <Key extends keyof DeadMissingEmailRow>(
    field: Key,
    value: DeadMissingEmailRow[Key],
  ) => void;
  onNavigate: (index: number) => void;
  onReset: () => void;
  onSave: () => void;
};

function DetailCard({
  label,
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-700 dark:bg-gray-800">
      {label && (
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          {label}
        </p>
      )}
      <div className="space-y-0">{children}</div>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <p className="shrink-0 text-[10px] uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <div className="w-64 max-w-[65%] rounded border border-gray-300 bg-white px-3 py-1.5 text-left text-xs font-semibold text-slate-600 dark:border-gray-600 dark:bg-gray-800 dark:text-slate-200">
        {value}
      </div>
    </div>
  );
}

function ToggleField({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={
          checked
            ? "flex h-8 w-8 cursor-pointer items-center justify-center rounded bg-emerald-100 text-emerald-700 transition hover:bg-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/70"
            : "flex h-8 w-8 cursor-pointer items-center justify-center rounded bg-slate-100 text-slate-400 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:hover:bg-slate-700"
        }
      >
        <Check size={16} />
      </button>
    </div>
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function DeadMissingEmailDrawer({
  row,
  currentIndex,
  rowCount,
  onCancel,
  onChange,
  onNavigate,
  onReset,
  onSave,
}: DeadMissingEmailDrawerProps) {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const [copied, setCopied] = useState(false);

  const drawerUrl = useMemo(() => {
    if (!row || typeof window === "undefined") return "";

    const params = new URLSearchParams(searchParams.toString());
    params.set("lead", row.leadId);

    return `${window.location.origin}${pathname}?${params.toString()}`;
  }, [pathname, row, searchParams]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopyLink = async () => {
    if (!drawerUrl) return;
    await navigator.clipboard.writeText(drawerUrl);
    setCopied(true);
  };

  const handlePrint = () => {
    if (!row || typeof window === "undefined") return;

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    const rows = [
      ["Lead ID", row.leadId],
      ["Email", row.email || "Missing"],
      ["Additional Contact Emails", row.additionalContactEmails || "-"],
      ["Lead Type", row.leadType],
      ["Lead Type Benton", row.bentonLeadType],
      ["Lead Type 95RM", row.rm95LeadType],
      ["Missing/Dead Email", row.missingDeadEmail ? "Yes" : "No"],
      ["Status", row.status],
    ];

    printWindow.document.write(`
      <html>
        <head><title>${escapeHtml(row.leadId)} | Dead/Missing Email</title></head>
        <body style="font-family:Arial,sans-serif;padding:24px;color:#0f172a;">
          <h1>${escapeHtml(row.leadId)}</h1>
          <p style="margin-bottom:20px;color:#475569;">${escapeHtml(row.fullName)} | ${escapeHtml(row.companyName)}</p>
          <table style="width:100%;border-collapse:collapse;">
            ${rows
              .map(
                ([label, value]) => `
                  <tr>
                    <td style="width:34%;border:1px solid #cbd5e1;padding:10px;font-weight:600;background:#f8fafc;">${escapeHtml(label)}</td>
                    <td style="border:1px solid #cbd5e1;padding:10px;">${escapeHtml(value)}</td>
                  </tr>
                `,
              )
              .join("")}
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <Drawer
      isOpen={Boolean(row)}
      onClose={onCancel}
      direction="right"
      size="560px"
      header={
        <DrawerActionHeader
          title={row?.leadId || ""}
          canGoPrevious={currentIndex > 0}
          canGoNext={currentIndex < rowCount - 1}
          copied={copied}
          onPrevious={() => onNavigate(currentIndex - 1)}
          onNext={() => onNavigate(currentIndex + 1)}
          onPrint={handlePrint}
          onCopyLink={handleCopyLink}
        />
      }
      footer={
        <div className="flex flex-col gap-2 bg-white px-5 py-4 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onReset}
            className="cursor-pointer rounded border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            className="cursor-pointer rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
          >
            Save
          </button>
        </div>
      }
    >
      {row && (
        <div className="space-y-5">
          <DetailCard label="Lead">
            <DetailRow label="Lead ID" value={row.leadId} />
            <DetailRow label="Company" value={row.companyName} />
            <DetailRow label="Contact" value={row.fullName} />
            <DetailRow label="Status" value={row.status} />
          </DetailCard>

          <DetailCard label="Email Review">
            <EditableField label="Email">
              <TextInput
                type="email"
                value={row.email}
                onChange={(event) => onChange("email", event.target.value)}
                className="text-xs font-semibold"
              />
            </EditableField>
            <EditableField label="Additional Contact Emails" align="stack">
              <Textarea
                value={row.additionalContactEmails}
                readOnly
                className="text-xs font-semibold leading-5"
              />
            </EditableField>
            <div className="py-1.5">
              <ToggleField
                label="Missing/Dead Email"
                checked={row.missingDeadEmail}
                onChange={(checked) => onChange("missingDeadEmail", checked)}
              />
            </div>
          </DetailCard>

          <DetailCard label="Lead Types">
            <EditableField label="Lead Type">
              <Select
                value={row.leadType}
                onChange={(value) => onChange("leadType", String(value))}
                options={LEAD_TYPE_OPTIONS}
                placeholder="Select lead type"
                className="py-1.5 text-xs"
                searchable
              />
            </EditableField>
            <EditableField label="Lead Type Benton">
              <Select
                value={row.bentonLeadType}
                onChange={(value) => onChange("bentonLeadType", String(value))}
                options={LEAD_TYPE_OPTIONS}
                placeholder="Select Benton lead type"
                className="py-1.5 text-xs"
                searchable
              />
            </EditableField>
            <EditableField label="Lead Type 95RM">
              <Select
                value={row.rm95LeadType}
                onChange={(value) => onChange("rm95LeadType", String(value))}
                options={LEAD_TYPE_OPTIONS}
                placeholder="Select 95RM lead type"
                className="py-1.5 text-xs"
                searchable
              />
            </EditableField>
          </DetailCard>

          <DetailCard label="Associated Types">
            <DetailRow
              label="Lead Type"
              value={<TypeBadge value={row.leadType} kind="lead" />}
            />
            <DetailRow
              label="Benton"
              value={<TypeBadge value={row.bentonLeadType} kind="lead" />}
            />
            <DetailRow
              label="95RM"
              value={<TypeBadge value={row.rm95LeadType} kind="lead" />}
            />
          </DetailCard>
        </div>
      )}
    </Drawer>
  );
}
