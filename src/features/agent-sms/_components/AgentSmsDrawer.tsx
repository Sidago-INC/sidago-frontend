

import {
  CheckboxInput,
  CompanySymbolBadge,
  DatePickerField,
  Drawer,
  EditableDrawerFooter,
  Select,
  Textarea,
  TextInput,
  TimezoneBadge,
} from "@/components/ui";
import { OutcomeButton } from "@/features/agent-calls/_components/OutcomeButton";
import { AdditionalContactsList } from "@/features/backoffice-shared/AdditionalContactsList";
import { printHtml } from "@/lib/print-html";
import {
  contactTypeOptions,
  leadTypeOptions,
} from "@/features/backoffice-closed-contacts/_lib/data";
import { getLeadDrawerTitle } from "@/features/backoffice-shared/constants";
import {
  Ban,
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  Link,
  MessageCircleWarning,
  MessageSquareText,
  PhoneCall,
  PhoneOff,
  Printer,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { type AgentSmsRow, smsStatusOptions } from "../_lib/data";

type AgentSmsDrawerProps = {
  row: AgentSmsRow | null;
  currentIndex: number;
  rowCount: number;
  onCancel: () => void;
  onChange: (field: keyof AgentSmsRow, value: string | boolean) => void;
  onNotWorkedChange: (checked: boolean) => void;
  onNavigate: (index: number) => void;
  onReset: () => void;
  onSave: () => void;
};

const iconClass = "h-4 w-4 stroke-[2]";
const defaultHistoryCalls = `04/17/2026 - SMS Follow Up - No Answer
04/13/2026 - SMS Follow Up - Left Voicemail
04/10/2026 - SMS Follow Up - No Answer`;

const callOutcomes = [
  {
    label: "No Answer",
    icon: PhoneOff,
    className:
      "border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 cursor-pointer",
  },
  {
    label: "Interested",
    icon: ThumbsUp,
    className:
      "bg-emerald-500 text-white shadow-sm shadow-emerald-200 hover:bg-emerald-400 dark:shadow-emerald-900/40 cursor-pointer",
  },
  {
    label: "Bad Number",
    icon: MessageCircleWarning,
    className:
      "bg-blue-500 text-white shadow-sm shadow-blue-200 hover:bg-blue-400 dark:shadow-blue-900/40 cursor-pointer",
  },
  {
    label: "Not Interested",
    icon: ThumbsDown,
    className: "bg-slate-600 text-white hover:bg-slate-500 cursor-pointer",
  },
  {
    label: "Left Message",
    icon: MessageSquareText,
    className:
      "border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 cursor-pointer",
  },
  {
    label: "Call Lead Back",
    icon: Clock3,
    className:
      "bg-rose-500 text-white shadow-sm shadow-rose-200 hover:bg-rose-400 dark:shadow-rose-900/40 cursor-pointer",
  },
  {
    label: "Interested Again",
    icon: PhoneCall,
    className:
      "bg-cyan-500 text-white shadow-sm shadow-cyan-200 hover:bg-cyan-400 dark:shadow-cyan-900/40 cursor-pointer",
  },
  {
    label: "DNC",
    icon: Ban,
    className: "bg-slate-700 text-white hover:bg-slate-600 cursor-pointer",
  },
] as const;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
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
      {typeof label === "string" && (
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          {label}
        </p>
      )}
      <div className="space-y-0">{children}</div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <p className="shrink-0 text-[10px] uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p className="truncate text-right text-xs font-semibold text-slate-600 dark:text-slate-200">
        {value}
      </p>
    </div>
  );
}

function HistoryText({ value }: { value: string }) {
  return (
    <span className="block whitespace-pre-line text-left leading-5">
      {value}
    </span>
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

export function AgentSmsDrawer({
  row,
  currentIndex,
  rowCount,
  onCancel,
  onChange,
  onNotWorkedChange,
  onNavigate,
  onReset,
  onSave,
}: AgentSmsDrawerProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const drawerUrl = useMemo(() => {
    if (!row || typeof window === "undefined") {
      return "";
    }

    const url = new URL(window.location.href);
    url.searchParams.set("lead", row.leadId);
    return url.toString();
  }, [row]);

  const historyNotes = row?.smsLog.trim()
    ? row.smsLog
    : "No SMS notes recorded yet.";

  const handleCopyUrl = async () => {
    if (!drawerUrl) {
      return;
    }

    await navigator.clipboard.writeText(drawerUrl);
    setCopied(true);
  };

  const handlePrint = () => {
    if (!row || typeof window === "undefined") {
      return;
    }

    const rows = [
      ["Lead", row.lead],
      ["Company Name", row.companyName],
      ["Full Name", row.fullName],
      ["Phone", row.phone],
      ["Email", row.email],
      ["Time zone", row.timezone],
      ["Contact Type", row.contactType],
      ["Lead Type Benton", row.bentonLeadType],
      ["SMS Status", row.smsStatus],
      ["Call Back Date", row.callBackDate],
      ["Notes", row.notes],
      ["SMS Log", row.smsLog],
      ["Additional Contacts", row.additionalContacts],
      ["Selected Outcome", row.selectedOutcome],
    ]
      .map(
        ([label, value]) => `
          <tr>
            <td style="width:38%;border:1px solid #cbd5e1;padding:10px;font-weight:600;background:#f8fafc;">
              ${escapeHtml(String(label))}
            </td>
            <td style="border:1px solid #cbd5e1;padding:10px;">
              ${escapeHtml(String(value || "-"))}
            </td>
          </tr>
        `,
      )
      .join("");

    printHtml({
      title: `${escapeHtml(row.companyName)} | SMS Activity`,
      body: `
        <h1>${escapeHtml(row.companyName)}</h1>
        <p style="margin-bottom:20px;color:#475569;">
          ${escapeHtml(row.fullName)} | ${escapeHtml(row.email)}
        </p>
        <table style="width:100%;border-collapse:collapse;">
          ${rows}
        </table>
      `,
    });
  };

  return (
    <Drawer
      isOpen={Boolean(row)}
      onClose={onCancel}
      direction="right"
      size="560px"
      header={
        <div className="flex w-full items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate(currentIndex - 1)}
              disabled={currentIndex <= 0}
              className="group flex h-7 w-7 cursor-pointer items-center justify-center rounded border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronUp
                className={`${iconClass} transition group-hover:-translate-y-0.5`}
              />
            </button>
            <button
              type="button"
              onClick={() => onNavigate(currentIndex + 1)}
              disabled={currentIndex < 0 || currentIndex >= rowCount - 1}
              className="group flex h-7 w-7 cursor-pointer items-center justify-center rounded border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronDown
                className={`${iconClass} transition group-hover:translate-y-0.5`}
              />
            </button>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {row ? getLeadDrawerTitle(row) : "SMS activity"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              title="Print"
              className="group flex h-7 w-7 cursor-pointer items-center justify-center rounded border border-slate-200 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Printer
                className={`${iconClass} transition group-hover:scale-110`}
              />
            </button>
            <button
              type="button"
              onClick={handleCopyUrl}
              title={copied ? "Copied!" : "Copy URL"}
              className="group flex h-7 w-7 cursor-pointer items-center justify-center rounded border border-slate-200 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {copied ? (
                <Check className={`${iconClass} text-emerald-500`} />
              ) : (
                <Link
                  className={`${iconClass} transition group-hover:scale-110`}
                />
              )}
            </button>
          </div>
        </div>
      }
      footer={
        <EditableDrawerFooter
          onCancel={onCancel}
          onReset={onReset}
          onSave={onSave}
        />
      }
    >
      {row ? (
        <div className="space-y-5">
          <DetailCard>
            <div className="flex items-center justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <CompanySymbolBadge
                  symbol={row.companySymbol}
                  index={currentIndex >= 0 ? currentIndex : 0}
                  className="rounded"
                />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400">
                    Company
                  </p>
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {row.companyName}
                  </p>
                </div>
              </div>
              <TimezoneBadge timezone={row.timezone} />
            </div>
          </DetailCard>

          <DetailCard label="Personal Details">
            <EditableField label="Full Name">
              <TextInput
                value={row.fullName}
                onChange={(event) => onChange("fullName", event.target.value)}
                className="text-xs font-semibold"
              />
            </EditableField>
            <EditableField label="Phone">
              <TextInput
                value={row.phone}
                onChange={(event) => onChange("phone", event.target.value)}
                className="text-xs font-semibold"
              />
            </EditableField>
            <EditableField label="Email">
              <TextInput
                type="email"
                value={row.email}
                onChange={(event) => onChange("email", event.target.value)}
                className="text-xs font-semibold"
              />
            </EditableField>
          </DetailCard>

          <DetailCard label="Lead Details">
            <EditableField label="Contact Type">
              <Select
                value={row.contactType}
                onChange={(value) => onChange("contactType", String(value))}
                options={contactTypeOptions.map((value) => ({
                  label: value,
                  value,
                }))}
                className="text-xs font-semibold"
              />
            </EditableField>
            <EditableField label="Lead Type Benton">
              <Select
                value={row.bentonLeadType}
                onChange={(value) => onChange("bentonLeadType", String(value))}
                options={leadTypeOptions.map((value) => ({
                  label: value,
                  value,
                }))}
                className="text-xs font-semibold"
              />
            </EditableField>
            <EditableField label="SMS Status">
              <Select
                value={row.smsStatus}
                onChange={(value) => onChange("smsStatus", String(value))}
                options={smsStatusOptions}
                className="text-xs font-semibold"
              />
            </EditableField>
          </DetailCard>

          <DetailCard label="Notes">
            <EditableField label="Notes" align="stack">
              <Textarea
                value={row.notes}
                onChange={(event) => onChange("notes", event.target.value)}
                className="text-xs font-semibold leading-5"
                placeholder="Add notes"
              />
            </EditableField>
            <EditableField label="Doesn't Work Anymore In The Company">
              <CheckboxInput
                checked={row.notWorked}
                onChange={(event) =>
                  onNotWorkedChange(event.target.checked)
                }
                labelClassName="justify-end"
              />
            </EditableField>
            <EditableField label="Call Back Date">
              <DatePickerField
                value={row.callBackDate}
                onChange={(value) => onChange("callBackDate", value)}
                className="text-xs font-semibold"
              />
            </EditableField>
          </DetailCard>

          <DetailCard label="History">
            <Detail
              label="History Calls"
              value={<HistoryText value={defaultHistoryCalls} />}
            />
            <Detail
              label="History Notes"
              value={<HistoryText value={historyNotes} />}
            />
          </DetailCard>

          <DetailCard label="Additional Contacts">
            {/* Was bound to row.additionalContacts, hard-coded to "". */}
            <AdditionalContactsList companyId={row.companyId} />
          </DetailCard>

          <DetailCard label="Call Outcome">
            <div className="grid grid-cols-2 gap-2.5">
              {callOutcomes.map((outcome) => (
                <OutcomeButton
                  key={outcome.label}
                  label={outcome.label}
                  icon={outcome.icon}
                  onClick={() => onChange("selectedOutcome", outcome.label)}
                  className={outcome.className}
                />
              ))}
            </div>
          </DetailCard>
        </div>
      ) : null}
    </Drawer>
  );
}
