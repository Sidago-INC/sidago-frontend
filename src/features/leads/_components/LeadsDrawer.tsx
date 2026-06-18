

import {
  CompanySymbolBadge,
  DatePickerField,
  Drawer,
  EditableDrawerFooter,
  Select,
  Textarea,
  TextInput,
  TimezoneBadge,
  TypeBadge,
} from "@/components/ui";
import type { Column } from "@/components/ui/Table";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import Revisions from "@/features/backoffice-shared/Revisions";
import {
  useUpdateLead,
  type LeadPatchBody,
} from "@/features/backoffice-shared/use-update-lead";
import { AGENT_VALUES } from "@/types/agent.types";
import { COMPANY_VALUES } from "@/types/company.types";
import { CONTACT_TYPE_VALUES } from "@/types/contact-type.types";
import { LEAD_TYPE_VALUES } from "@/types/lead-type.types";
import { Check, ChevronDown, ChevronUp, Link, Printer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import {
  getCompanySymbol,
  getLeadId,
  type LeadDirectoryRow,
} from "../_lib/data";

type LeadsDrawerProps = {
  data: LeadDirectoryRow[];
  columns?: Column<LeadDirectoryRow>[];
  selectedIndex: number | null;
  onSelectedIndexChange: (index: number | null) => void;
  onClose: () => void;
};

const iconClass = "w-4 h-4 stroke-[2]";
const defaultHistoryCalls = `04/17/2026 - LEVEL 2 TOM - No Answer
04/13/2026 - LEVEL 1 TOM - Left Voicemail
04/10/2026 - LEVEL 1 TOM - No Answer`;
const defaultHistoryNotes = `04/17/2026 - LEVEL 2 TOM - No Answer
04/13/2026 - LEVEL 1 TOM - Left Voicemail
04/10/2026 - LEVEL 1 TOM - No Answer`;

type EditableDrawerState = {
  companyName: string;
  contactType: string;
  fullName: string;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  phone: string;
  phoneExtension: string;
  notWorked: boolean;
  otherContacts: string;
  svgLeadType: string;
  svgToBeCalledBy: string;
  svgHistoryCalls: string;
  svgHistoryNotes: string;
  svgToBeCalledOn: string;
  bentonLeadType: string;
  bentonToBeCalledBy: string;
  bentonHistoryCalls: string;
  bentonHistoryNotes: string;
  bentonToBeCalledOn: string;
  rm95LeadType: string;
  rm95ToBeCalledBy: string;
  rm95HistoryCalls: string;
  rm95HistoryNotes: string;
  rm95ToBeCalledOn: string;
};

function getEditableState(row: LeadDirectoryRow): EditableDrawerState {
  return {
    companyName: row.companyName,
    contactType: row.contactType,
    fullName: row.fullName,
    firstName: row.firstName,
    lastName: row.lastName,
    role: row.role ?? "",
    email: row.email,
    phone: row.phone,
    phoneExtension: row.phoneExtension,
    notWorked: row.notWorked ?? false,
    otherContacts: "",
    svgLeadType: row.svgLeadType,
    svgToBeCalledBy: row.svgToBeCalledBy,
    svgHistoryCalls: defaultHistoryCalls,
    svgHistoryNotes: defaultHistoryNotes,
    svgToBeCalledOn: row.svgLastCallDate,
    bentonLeadType: row.bentonLeadType,
    bentonToBeCalledBy: row.bentonToBeCalledBy,
    bentonHistoryCalls: defaultHistoryCalls,
    bentonHistoryNotes: defaultHistoryNotes,
    bentonToBeCalledOn: row.bentonLastCallDate,
    rm95LeadType: row.rm95LeadType,
    rm95ToBeCalledBy: row.rm95ToBeCalledBy,
    rm95HistoryCalls: defaultHistoryCalls,
    rm95HistoryNotes: defaultHistoryNotes,
    rm95ToBeCalledOn: row.rm95LastCallDate,
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function stripTimezonePrefix(timezone: string | undefined) {
  return (timezone ?? "").replace(/^\d+-/, "");
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

export function LeadsDrawer({
  data,
  columns,
  selectedIndex,
  onSelectedIndexChange,
  onClose,
}: LeadsDrawerProps) {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const [copied, setCopied] = useState(false);
  const [editModeKey, setEditModeKey] = useState<string | null>(null);
  const [formState, setFormState] = useState<{
    key: string;
    value: EditableDrawerState;
  } | null>(null);
  const updateLead = useUpdateLead();

  const row = selectedIndex === null ? null : (data[selectedIndex] ?? null);
  const rowKey = row?.email ?? "";
  const isEditMode = rowKey !== "" && editModeKey === rowKey;
  const initialForm = useMemo(
    () => (row ? getEditableState(row) : null),
    [row],
  );
  const form = formState?.key === rowKey ? formState.value : initialForm;

  const companyOptions = useMemo(
    () =>
      COMPANY_VALUES.map((company) => ({
        label: `${company.name} (${company.symbol})`,
        value: company.name,
      })),
    [],
  );
  const agentOptions = useMemo(
    () =>
      AGENT_VALUES.map((agent) => {
        const fullName = `${agent.name} ${agent.surname}`;
        return { label: fullName, value: fullName };
      }),
    [],
  );
  const leadTypeOptions = useMemo(
    () => LEAD_TYPE_VALUES.map((value) => ({ label: value, value })),
    [],
  );
  const contactTypeOptions = useMemo(
    () => CONTACT_TYPE_VALUES.map((value) => ({ label: value, value })),
    [],
  );
  const selectedCompany = useMemo(
    () => COMPANY_VALUES.find((company) => company.name === form?.companyName),
    [form?.companyName],
  );
  const selectedTimezone = stripTimezonePrefix(
    selectedCompany?.timezone ?? row?.timezone,
  );

  const detailItems = useMemo(() => {
    if (!row) return [];

    return (columns ?? []).map((column) => {
      const resolvedValue = column.getValue
        ? column.getValue(row)
        : row[column.key as keyof LeadDirectoryRow];

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
    params.set("lead", getLeadId(row));
    return `${window.location.origin}${pathname}?${params.toString()}`;
  }, [pathname, row, searchParams]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  if (!row || selectedIndex === null || !form) return null;

  const updateForm = <Key extends keyof EditableDrawerState>(
    key: Key,
    value: EditableDrawerState[Key],
  ) => {
    setFormState((current) => ({
      key: rowKey,
      value: {
        ...(current?.key === rowKey && current.value ? current.value : form),
        [key]: value,
      },
    }));
  };

  const handleEditStart = () => {
    if (!rowKey) return;
    setEditModeKey(rowKey);
  };

  const handleReset = () => setFormState(null);
  const handleSave = async () => {
    if (!row || !form || !initialForm) return;

    if (!row.leadId) {
      showErrorToast(new Error("Cannot save: this row has no leadId."));
      return;
    }

    const body: LeadPatchBody = {};
    const leadDiff: NonNullable<LeadPatchBody["lead"]> = {};

    if (form.fullName !== initialForm.fullName) leadDiff.full_name = form.fullName;
    if (form.email !== initialForm.email) leadDiff.email = form.email;
    if (form.phone !== initialForm.phone) leadDiff.phone = form.phone;
    if (form.role !== initialForm.role) leadDiff.role = form.role;
    if (form.contactType !== initialForm.contactType) {
      leadDiff.contact_type = form.contactType;
    }
    if (form.notWorked !== initialForm.notWorked) {
      leadDiff.not_work_anymore = form.notWorked;
    }
    if (form.companyName !== initialForm.companyName) {
      leadDiff.company_name = form.companyName;
    }

    if (Object.keys(leadDiff).length > 0) body.lead = leadDiff;

    const brandStates: NonNullable<LeadPatchBody["brandStates"]> = {};

    if (form.svgLeadType !== initialForm.svgLeadType) {
      brandStates.svg = { lead_type: form.svgLeadType };
    }
    if (form.bentonLeadType !== initialForm.bentonLeadType) {
      brandStates.benton = { lead_type: form.bentonLeadType };
    }
    if (form.rm95LeadType !== initialForm.rm95LeadType) {
      brandStates["95rm"] = { lead_type: form.rm95LeadType };
    }
    if (form.svgToBeCalledBy !== initialForm.svgToBeCalledBy) {
      brandStates.svg = {
        ...brandStates.svg,
        to_be_called_by: form.svgToBeCalledBy || null,
      };
    }
    if (form.bentonToBeCalledBy !== initialForm.bentonToBeCalledBy) {
      brandStates.benton = {
        ...brandStates.benton,
        to_be_called_by: form.bentonToBeCalledBy || null,
      };
    }
    if (form.rm95ToBeCalledBy !== initialForm.rm95ToBeCalledBy) {
      brandStates["95rm"] = {
        ...brandStates["95rm"],
        to_be_called_by: form.rm95ToBeCalledBy || null,
      };
    }

    if (Object.keys(brandStates).length > 0) body.brandStates = brandStates;

    if (!body.lead && !body.brandStates) {
      showSuccessToast("No changes to save.");
      setEditModeKey(null);
      return;
    }

    try {
      await updateLead.mutateAsync({ leadId: row.leadId, body });
      showSuccessToast("Lead changes saved successfully.");
      setEditModeKey(null);
      setFormState(null);
    } catch (error) {
      showErrorToast(error);
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

    printWindow.document.write(`
      <html>
        <head>
          <title>${escapeHtml(row.companyName)} | Lead</title>
        </head>
        <body style="font-family:Arial,sans-serif;padding:24px;color:#0f172a;">
          <h1>${escapeHtml(row.companyName)}</h1>
          <p style="margin-bottom:20px;color:#475569;">
            ${escapeHtml(row.fullName)} | ${escapeHtml(row.email)}
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
              onClick={() =>
                onSelectedIndexChange(Math.max(0, selectedIndex - 1))
              }
              disabled={selectedIndex <= 0}
              className="group flex h-7 w-7 items-center justify-center rounded border cursor-pointer border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronUp
                className={`${iconClass} group-hover:-translate-y-0.5 transition`}
              />
            </button>
            <button
              onClick={() =>
                onSelectedIndexChange(
                  Math.min(data.length - 1, selectedIndex + 1),
                )
              }
              disabled={selectedIndex >= data.length - 1}
              className="group flex h-7 w-7 items-center justify-center rounded border cursor-pointer border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
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
              className="group flex h-7 w-7 items-center justify-center rounded border cursor-pointer border-slate-200 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Printer
                className={`${iconClass} group-hover:scale-110 transition`}
              />
            </button>
            <button
              onClick={handleCopyUrl}
              className="group flex h-7 w-7 items-center justify-center rounded border cursor-pointer border-slate-200 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
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
          <Revisions leadId={row.leadId} />
        )
      }
    >
      <div className="space-y-5" onFocus={handleEditStart}>
        <DetailCard>
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <CompanySymbolBadge
                symbol={getCompanySymbol(form.companyName)}
                index={data.findIndex((item) => item.email === row.email)}
                className="rounded"
              />
              <EditableField label="Company">
                <Select
                  value={form.companyName}
                  onChange={(value) => updateForm("companyName", String(value))}
                  options={companyOptions}
                  placeholder="Select company"
                  className="py-1.5 text-xs"
                />
              </EditableField>
            </div>
            <TimezoneBadge
              timezone={selectedTimezone}
              index={data.findIndex((item) => item.email === row.email)}
            />
          </div>
        </DetailCard>

        <DetailCard label="Personal Details">
          <EditableField label="Full Name">
            <TextInput
              value={form.fullName}
              onChange={(event) => updateForm("fullName", event.target.value)}
              className="text-xs font-semibold"
            />
          </EditableField>
          <EditableField label="First Name">
            <TextInput
              value={form.firstName}
              onChange={(event) => updateForm("firstName", event.target.value)}
              className="text-xs font-semibold"
            />
          </EditableField>
          <EditableField label="Last Name">
            <TextInput
              value={form.lastName}
              onChange={(event) => updateForm("lastName", event.target.value)}
              className="text-xs font-semibold"
            />
          </EditableField>
          <EditableField label="Role">
            <TextInput
              value={form.role}
              onChange={(event) => updateForm("role", event.target.value)}
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
          <EditableField label="Phone Extension">
            <TextInput
              value={form.phoneExtension}
              onChange={(event) =>
                updateForm("phoneExtension", event.target.value)
              }
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
              options={contactTypeOptions}
              placeholder="Select contact type"
              className="py-1.5 text-xs"
            />
          </EditableField>
          <div className="py-1.5">
            <ToggleField
              label="Not Work Anymore"
              checked={form.notWorked}
              onChange={(checked) => updateForm("notWorked", checked)}
            />
          </div>
        </DetailCard>

        <DetailCard label="Other Contacts">
          <EditableField label="Contacts" align="stack">
            <Textarea
              value={form.otherContacts}
              onChange={(event) =>
                updateForm("otherContacts", event.target.value)
              }
              className="text-xs font-semibold leading-5"
            />
          </EditableField>
        </DetailCard>

        <LeadDetailsCard
          title="SVG Details"
          leadType={form.svgLeadType}
          onLeadTypeChange={(value) => updateForm("svgLeadType", String(value))}
          toBeCalledBy={form.svgToBeCalledBy}
          onToBeCalledByChange={(value) =>
            updateForm("svgToBeCalledBy", String(value))
          }
          toBeCalledOn={form.svgToBeCalledOn}
          onToBeCalledOnChange={(value) => updateForm("svgToBeCalledOn", value)}
          historyCalls={form.svgHistoryCalls}
          onHistoryCallsChange={(value) => updateForm("svgHistoryCalls", value)}
          historyNotes={form.svgHistoryNotes}
          onHistoryNotesChange={(value) => updateForm("svgHistoryNotes", value)}
          leadTypeOptions={leadTypeOptions}
          agentOptions={agentOptions}
        />

        <LeadDetailsCard
          title="Benton Details"
          leadType={form.bentonLeadType}
          onLeadTypeChange={(value) =>
            updateForm("bentonLeadType", String(value))
          }
          toBeCalledBy={form.bentonToBeCalledBy}
          onToBeCalledByChange={(value) =>
            updateForm("bentonToBeCalledBy", String(value))
          }
          toBeCalledOn={form.bentonToBeCalledOn}
          onToBeCalledOnChange={(value) =>
            updateForm("bentonToBeCalledOn", value)
          }
          historyCalls={form.bentonHistoryCalls}
          onHistoryCallsChange={(value) =>
            updateForm("bentonHistoryCalls", value)
          }
          historyNotes={form.bentonHistoryNotes}
          onHistoryNotesChange={(value) =>
            updateForm("bentonHistoryNotes", value)
          }
          leadTypeOptions={leadTypeOptions}
          agentOptions={agentOptions}
        />

        <LeadDetailsCard
          title="95RM Details"
          leadType={form.rm95LeadType}
          onLeadTypeChange={(value) =>
            updateForm("rm95LeadType", String(value))
          }
          toBeCalledBy={form.rm95ToBeCalledBy}
          onToBeCalledByChange={(value) =>
            updateForm("rm95ToBeCalledBy", String(value))
          }
          toBeCalledOn={form.rm95ToBeCalledOn}
          onToBeCalledOnChange={(value) =>
            updateForm("rm95ToBeCalledOn", value)
          }
          historyCalls={form.rm95HistoryCalls}
          onHistoryCallsChange={(value) =>
            updateForm("rm95HistoryCalls", value)
          }
          historyNotes={form.rm95HistoryNotes}
          onHistoryNotesChange={(value) =>
            updateForm("rm95HistoryNotes", value)
          }
          leadTypeOptions={leadTypeOptions}
          agentOptions={agentOptions}
        />

        <DetailCard label="Associated Contacts">
          <DetailCard label={form.companyName}>
            <AssociationDetail
              label="Contact Type"
              value={<TypeBadge value={form.contactType} kind="contact" />}
            />
            <AssociationDetail
              label="SVG Lead Type"
              value={<TypeBadge value={form.svgLeadType} kind="lead" />}
            />
            <AssociationDetail
              label="Benton Lead Type"
              value={<TypeBadge value={form.bentonLeadType} kind="lead" />}
            />
            <AssociationDetail
              label="95RM Lead Type"
              value={<TypeBadge value={form.rm95LeadType} kind="lead" />}
            />
          </DetailCard>
        </DetailCard>
      </div>
    </Drawer>
  );
}

function LeadDetailsCard({
  title,
  leadType,
  onLeadTypeChange,
  toBeCalledBy,
  onToBeCalledByChange,
  toBeCalledOn,
  onToBeCalledOnChange,
  historyCalls,
  onHistoryCallsChange,
  historyNotes,
  onHistoryNotesChange,
  leadTypeOptions,
  agentOptions,
}: {
  title: string;
  leadType: string;
  onLeadTypeChange: (value: string) => void;
  toBeCalledBy: string;
  onToBeCalledByChange: (value: string) => void;
  toBeCalledOn: string;
  onToBeCalledOnChange: (value: string) => void;
  historyCalls: string;
  onHistoryCallsChange: (value: string) => void;
  historyNotes: string;
  onHistoryNotesChange: (value: string) => void;
  leadTypeOptions: Array<{ label: string; value: string }>;
  agentOptions: Array<{ label: string; value: string }>;
}) {
  return (
    <DetailCard label={title}>
      <EditableField label="Lead Type">
        <Select
          value={leadType}
          onChange={(value) => onLeadTypeChange(String(value))}
          options={leadTypeOptions}
          placeholder="Select lead type"
          className="py-1.5 text-xs"
        />
      </EditableField>
      <EditableField label="To Be Called By">
        <Select
          value={toBeCalledBy}
          onChange={(value) => onToBeCalledByChange(String(value))}
          options={agentOptions}
          placeholder="Select assignee"
          className="py-1.5 text-xs"
        />
      </EditableField>
      <EditableField label="To Be Called On">
        <DatePickerField
          value={toBeCalledOn}
          onChange={onToBeCalledOnChange}
          className="text-xs font-semibold"
        />
      </EditableField>
      <EditableField label="History Calls" align="stack">
        <Textarea
          value={historyCalls}
          onChange={(event) => onHistoryCallsChange(event.target.value)}
          className="text-xs font-semibold leading-5"
        />
      </EditableField>
      <EditableField label="History Notes" align="stack">
        <Textarea
          value={historyNotes}
          onChange={(event) => onHistoryNotesChange(event.target.value)}
          className="text-xs font-semibold leading-5"
        />
      </EditableField>
    </DetailCard>
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

function AssociationDetail({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <p className="shrink-0 text-[10px] uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <div className="min-w-0 text-right text-xs font-semibold text-slate-600 dark:text-slate-200">
        {value}
      </div>
    </div>
  );
}
