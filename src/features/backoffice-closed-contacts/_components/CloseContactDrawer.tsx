

import {
  CheckboxInput,
  CompanySymbolBadge,
  DatePickerField,
  Drawer,
  Select,
  Textarea,
  TextInput,
  TimezoneBadge,
} from "@/components/ui";
import type { Column } from "@/components/ui/Table";
import type { ClosedContactRow } from "../_lib/data";
import {
  type ClosedContactsTabKey,
  contactTypeOptions,
  getCompanySymbol,
  getLeadId,
  leadTypeOptions,
} from "../_lib/data";
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
import { useLocation, useSearchParams } from "react-router-dom";
import { OutcomeButton } from "@/features/agent-calls/_components/OutcomeButton";
import {
  resolveAgentSlugForClosedContacts,
  toggleMarkVoid,
} from "@/features/agent-calls/_lib/markVoid";
import { getLeadDrawerTitle } from "@/features/backoffice-shared/constants";
import {
  useUpdateLead,
  type LeadPatchBody,
} from "@/features/backoffice-shared/use-update-lead";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

type ClosedContactDrawerProps = {
  data: ClosedContactRow[];
  columns?: Column<ClosedContactRow>[];
  tabKey: ClosedContactsTabKey;
  selectedIndex: number | null;
  onSelectedIndexChange: (index: number) => void;
  onClose: () => void;
};

const iconClass = "h-4 w-4 stroke-[2]";
const defaultHistoryCalls = `04/17/2026 - LEVEL 2 TOM - No Answer
04/13/2026 - LEVEL 1 TOM - Left Voicemail
04/10/2026 - LEVEL 1 TOM - No Answer`;
const defaultHistoryNotes = `04/17/2026 - LEVEL 2 TOM - No Answer
04/13/2026 - LEVEL 1 TOM - Left Voicemail
04/10/2026 - LEVEL 1 TOM - No Answer`;
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
];

type EditableClosedContactState = {
  fullName: string;
  phone: string;
  email: string;
  contactType: string;
  bentonLeadType: string;
  notes: string;
  additionalContacts: string;
  doesNotWorkAnymore: boolean;
  callBackDate: string;
  selectedOutcome: string;
};

function getEditableState(row: ClosedContactRow): EditableClosedContactState {
  return {
    fullName: row.fullName,
    phone: row.phone,
    email: row.email,
    contactType: row.contactType,
    bentonLeadType: row.bentonLeadType,
    notes: "",
    additionalContacts: "",
    doesNotWorkAnymore: false,
    callBackDate: row.callBackDate ?? "",
    selectedOutcome: "",
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function ClosedContactDrawer({
  data,
  columns,
  tabKey,
  selectedIndex,
  onSelectedIndexChange,
  onClose,
}: ClosedContactDrawerProps) {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const [copied, setCopied] = useState(false);
  const [formState, setFormState] = useState<{
    key: string;
    value: EditableClosedContactState;
  } | null>(null);

  const row = selectedIndex === null ? null : (data[selectedIndex] ?? null);
  const rowKey = row?.email ?? "";
  const initialForm = useMemo(() => (row ? getEditableState(row) : null), [row]);
  const form =
    formState?.key === rowKey
      ? formState.value
      : initialForm;
  const updateLead = useUpdateLead();
  const isDirty = useMemo(() => {
    if (!form || !initialForm) return false;

    return (
      form.fullName !== initialForm.fullName ||
      form.phone !== initialForm.phone ||
      form.email !== initialForm.email ||
      form.contactType !== initialForm.contactType ||
      form.bentonLeadType !== initialForm.bentonLeadType
    );
  }, [form, initialForm]);

  const detailItems = useMemo(() => {
    if (!row) return [];

    return (columns ?? []).map((column) => {
      const resolvedValue = column.getValue
        ? column.getValue(row)
        : row[column.key as keyof ClosedContactRow];

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
    if (!row || typeof window === "undefined") return "";

    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabKey);
    params.set("lead", getLeadId(row));
    return `${window.location.origin}${pathname}?${params.toString()}`;
  }, [pathname, row, searchParams, tabKey]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  if (!row || selectedIndex === null || !form) return null;

  const currentIndex = selectedIndex;

  const updateForm = <Key extends keyof EditableClosedContactState>(
    key: Key,
    value: EditableClosedContactState[Key],
  ) => {
    setFormState((current) => ({
      key: rowKey,
      value: {
        ...(current?.key === rowKey && current.value ? current.value : form),
        [key]: value,
      },
    }));
  };

  const handleDoesNotWorkChange = async (checked: boolean) => {
    if (!row?.leadId) {
      showErrorToast(new Error("Cannot update: this row has no leadId."));
      return;
    }

    const agentSlug = resolveAgentSlugForClosedContacts(tabKey, row.brand);
    if (!agentSlug) {
      showErrorToast(
        new Error(
          "Cannot mark void: no brand context. Switch to a brand tab or ensure the row has a brand.",
        ),
      );
      return;
    }

    updateForm("doesNotWorkAnymore", checked);
    if (!checked) return;

    const ok = await toggleMarkVoid(agentSlug, row.leadId, checked, {
      successMessage: "Lead marked as no longer working at the company.",
    });
    if (!ok) {
      updateForm("doesNotWorkAnymore", false);
    }
  };

  const handleReset = () => {
    setFormState(null);
  };

  const handleSave = async () => {
    if (!row || !form || !initialForm) return;

    if (!row.leadId) {
      showErrorToast(new Error("Cannot save: this row has no leadId (mock data?)"));
      return;
    }

    const body: LeadPatchBody = {};
    const leadDiff: NonNullable<LeadPatchBody["lead"]> = {};

    if (form.fullName !== initialForm.fullName) {
      leadDiff.full_name = form.fullName;
    }
    if (form.phone !== initialForm.phone) {
      leadDiff.phone = form.phone;
    }
    if (form.email !== initialForm.email) leadDiff.email = form.email;
    if (form.contactType !== initialForm.contactType) {
      leadDiff.contact_type = form.contactType;
    }

    if (Object.keys(leadDiff).length > 0) body.lead = leadDiff;

    if (form.bentonLeadType !== initialForm.bentonLeadType) {
      body.brandStates = {
        benton: { lead_type: form.bentonLeadType },
      };
    }

    if (!body.lead && !body.brandStates) {
      showErrorToast(new Error("No changes to save"));
      return;
    }

    try {
      await updateLead.mutateAsync({ leadId: row.leadId, body });
      showSuccessToast("Lead updated");
      setFormState(null);
    } catch (err) {
      showErrorToast(err);
    }
  };

  const handleCopyUrl = async () => {
    if (!drawerUrl) return;
    await navigator.clipboard.writeText(drawerUrl);
    setCopied(true);
  };

  const handlePrint = () => {
    if (typeof window === "undefined") return;

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

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

    printWindow.document.title = `${escapeHtml(row.companyName)} | Closed Contact`;
    printWindow.document.body.style.cssText =
      "font-family:Arial,sans-serif;padding:24px;color:#0f172a;";
    printWindow.document.body.innerHTML = `
      <h1>${escapeHtml(row.companyName)}</h1>
      <p style="margin-bottom:20px;color:#475569;">
        ${escapeHtml(row.fullName)} | ${escapeHtml(row.email)}
      </p>
      <table style="width:100%;border-collapse:collapse;">
        ${rowsMarkup}
      </table>
    `;

    printWindow.focus();
    printWindow.print();
  };

  const rowIndex = data.findIndex((item) => item.email === row.email);

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
              type="button"
              onClick={() => onSelectedIndexChange(currentIndex - 1)}
              disabled={currentIndex <= 0}
              className="group flex h-7 w-7 cursor-pointer items-center justify-center rounded border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronUp
                className={`${iconClass} transition group-hover:-translate-y-0.5`}
              />
            </button>
            <button
              type="button"
              onClick={() => onSelectedIndexChange(currentIndex + 1)}
              disabled={currentIndex >= data.length - 1}
              className="group flex h-7 w-7 cursor-pointer items-center justify-center rounded border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronDown
                className={`${iconClass} transition group-hover:translate-y-0.5`}
              />
            </button>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {getLeadDrawerTitle({
                  companyName: row.companyName,
                  fullName: row.fullName,
                })}
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
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={!isDirty || updateLead.isPending}
            className="cursor-pointer rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || updateLead.isPending || !row?.leadId}
            className="cursor-pointer rounded bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {updateLead.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Company identity */}
        <DetailCard>
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <CompanySymbolBadge
                symbol={getCompanySymbol(row.companyName)}
                index={rowIndex}
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

        {/* Contact info */}
        <DetailCard label="Personal Details">
          <EditableField label="Full Name">
            <TextInput
              value={form.fullName}
              onChange={(event) => updateForm("fullName", event.target.value)}
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

        <DetailCard label="Lead Details">
          <EditableField label="Contact Type">
            <Select
              value={form.contactType}
              onChange={(value) => updateForm("contactType", String(value))}
              options={contactTypeOptions.map((value) => ({
                label: value,
                value,
              }))}
              className="text-xs font-semibold"
            />
          </EditableField>
          <EditableField label="Lead Type Benton">
            <Select
              value={form.bentonLeadType}
              onChange={(value) => updateForm("bentonLeadType", String(value))}
              options={leadTypeOptions.map((value) => ({
                label: value,
                value,
              }))}
              className="text-xs font-semibold"
            />
          </EditableField>
        </DetailCard>

        <DetailCard label="Notes">
          <EditableField label="Notes" align="stack">
            <Textarea
              value={form.notes}
              onChange={(event) => updateForm("notes", event.target.value)}
              className="text-xs font-semibold leading-5"
              placeholder="Add notes"
            />
          </EditableField>
          <EditableField label="Doesn't Work Anymore In The Company">
            <CheckboxInput
              checked={form.doesNotWorkAnymore}
              onChange={(event) =>
                handleDoesNotWorkChange(event.target.checked)
              }
              labelClassName="justify-end"
            />
          </EditableField>
          <EditableField label="Call Back Date">
            <DatePickerField
              value={form.callBackDate ?? ""}
              onChange={(value) => updateForm("callBackDate", value)}
              className="text-xs font-semibold"
            />
          </EditableField>
        </DetailCard>

        {/* History */}
        <DetailCard label="History">
          <Detail
            label="History Calls"
            value={<HistoryText value={defaultHistoryCalls} />}
          />
          <Detail
            label="History Notes"
            value={<HistoryText value={defaultHistoryNotes} />}
          />
        </DetailCard>

        <DetailCard label="Additional Contacts">
          <EditableField label="Contacts" align="stack">
            <Textarea
              value={form.additionalContacts}
              onChange={(event) =>
                updateForm("additionalContacts", event.target.value)
              }
              className="text-xs font-semibold leading-5"
              placeholder="Add contacts"
            />
          </EditableField>
        </DetailCard>

        <DetailCard label="Call Outcome">
          <div className="grid grid-cols-2 gap-2.5">
            {callOutcomes.map((outcome) => (
              <OutcomeButton
                key={outcome.label}
                label={outcome.label}
                icon={outcome.icon}
                onClick={() => updateForm("selectedOutcome", outcome.label)}
                className={outcome.className}
              />
            ))}
          </div>
        </DetailCard>
      </div>
    </Drawer>
  );
}

// ─── shared sub-components ────────────────────────────────────────────────

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

function HistoryText({ value }: { value: string }) {
  return (
    <span className="block whitespace-pre-line text-left leading-5">
      {value}
    </span>
  );
}
