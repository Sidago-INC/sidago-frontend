

import {
  CompanySymbolBadge,
  DatePickerField,
  Drawer,
  Select,
  Textarea,
  TextInput,
  TimezoneBadge,
  TypeBadge,
} from "@/components/ui";
import type { Column } from "@/components/ui/Table";
import { getCompanySymbol, getLeadId, type EverBeenHotRow } from "../_lib/data";
import { Check, ChevronDown, ChevronUp, Link, Printer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { getLeadDrawerTitle } from "@/features/backoffice-shared/constants";
import { AGENT_VALUES } from "@/types/agent.types";
import { COMPANY_VALUES } from "@/types/company.types";
import { CONTACT_TYPE_VALUES } from "@/types/contact-type.types";
import { LEAD_TYPE_VALUES } from "@/types/lead-type.types";
import {
  useUpdateLead,
  type LeadPatchBody,
} from "@/features/backoffice-shared/use-update-lead";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

type EverBeenHotDrawerProps = {
  data: EverBeenHotRow[];
  columns?: Column<EverBeenHotRow>[];
  selectedIndex: number | null;
  onSelectedIndexChange: (index: number) => void;
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
  role: string;
  email: string;
  phone: string;
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
};

function getEditableState(row: EverBeenHotRow): EditableDrawerState {
  return {
    companyName: row.companyName,
    contactType: row.contactType,
    fullName: row.fullName,
    role: row.role ?? "",
    email: row.email,
    phone: row.phone,
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

export function EverBeenHotDrawer({
  data,
  columns,
  selectedIndex,
  onSelectedIndexChange,
  onClose,
}: EverBeenHotDrawerProps) {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const [copied, setCopied] = useState(false);
  const [formState, setFormState] = useState<{
    key: string;
    value: EditableDrawerState;
  } | null>(null);

  const row = selectedIndex === null ? null : (data[selectedIndex] ?? null);
  const rowKey = row?.email ?? "";
  const initialForm = useMemo(
    () => (row ? getEditableState(row) : null),
    [row],
  );
  const form = formState?.key === rowKey ? formState.value : initialForm;
  const updateLead = useUpdateLead();
  const isDirty = useMemo(() => {
    if (!form || !initialForm) return false;
    return JSON.stringify(form) !== JSON.stringify(initialForm);
  }, [form, initialForm]);

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
        : row[column.key as keyof EverBeenHotRow];

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

  const currentIndex = selectedIndex;

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

  const handleReset = () => {
    setFormState(null);
  };

  const handleSave = async () => {
    if (!row || !form || !initialForm) return;

    if (!row.leadId) {
      showErrorToast(
        new Error("Cannot save: this row has no leadId (mock data?)"),
      );
      return;
    }

    const body: LeadPatchBody = {};
    const leadDiff: NonNullable<LeadPatchBody["lead"]> = {};

    if (form.fullName !== initialForm.fullName) leadDiff.full_name = form.fullName;
    if (form.phone !== initialForm.phone) leadDiff.phone = form.phone;
    if (form.email !== initialForm.email) leadDiff.email = form.email;
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

    const svgDiff: NonNullable<NonNullable<LeadPatchBody["brandStates"]>["svg"]> =
      {};
    if (form.svgLeadType !== initialForm.svgLeadType) {
      svgDiff.lead_type = form.svgLeadType;
    }
    if (form.svgToBeCalledBy !== initialForm.svgToBeCalledBy) {
      svgDiff.to_be_called_by = form.svgToBeCalledBy || null;
    }
    if (form.svgToBeCalledOn !== initialForm.svgToBeCalledOn) {
      svgDiff.last_called_date = form.svgToBeCalledOn || null;
    }
    if (Object.keys(svgDiff).length > 0) brandStates.svg = svgDiff;

    const bentonDiff: NonNullable<
      NonNullable<LeadPatchBody["brandStates"]>["benton"]
    > = {};
    if (form.bentonLeadType !== initialForm.bentonLeadType) {
      bentonDiff.lead_type = form.bentonLeadType;
    }
    if (form.bentonToBeCalledBy !== initialForm.bentonToBeCalledBy) {
      bentonDiff.to_be_called_by = form.bentonToBeCalledBy || null;
    }
    if (form.bentonToBeCalledOn !== initialForm.bentonToBeCalledOn) {
      bentonDiff.last_called_date = form.bentonToBeCalledOn || null;
    }
    if (Object.keys(bentonDiff).length > 0) brandStates.benton = bentonDiff;

    if (Object.keys(brandStates).length > 0) body.brandStates = brandStates;

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
              onClick={() => onSelectedIndexChange(currentIndex - 1)}
              disabled={currentIndex <= 0}
              className="group flex h-7 w-7 items-center justify-center rounded border cursor-pointer border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronUp
                className={`${iconClass} group-hover:-translate-y-0.5 transition`}
              />
            </button>

            <button
              onClick={() => onSelectedIndexChange(currentIndex + 1)}
              disabled={currentIndex >= data.length - 1}
              className="group flex h-7 w-7 items-center justify-center rounded border cursor-pointer border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronDown
                className={`${iconClass} group-hover:translate-y-0.5 transition`}
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
              onClick={handlePrint}
              title="Print"
              className="group flex h-7 w-7 items-center justify-center rounded border cursor-pointer border-slate-200 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Printer
                className={`${iconClass} group-hover:scale-110 transition`}
              />
            </button>
            <button
              onClick={handleCopyUrl}
              title="Copy URL"
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

        <DetailCard label="SVG Details">
          <EditableField label="Lead Type">
            <Select
              value={form.svgLeadType}
              onChange={(value) => updateForm("svgLeadType", String(value))}
              options={leadTypeOptions}
              placeholder="Select lead type"
              className="py-1.5 text-xs"
            />
          </EditableField>
          <EditableField label="To Be Called By">
            <Select
              value={form.svgToBeCalledBy}
              onChange={(value) => updateForm("svgToBeCalledBy", String(value))}
              options={agentOptions}
              placeholder="Select assignee"
              className="py-1.5 text-xs"
            />
          </EditableField>
          <EditableField label="To Be Called On">
            <DatePickerField
              value={form.svgToBeCalledOn}
              onChange={(value) => updateForm("svgToBeCalledOn", value)}
              className="text-xs font-semibold"
            />
          </EditableField>
          <EditableField label="History Calls" align="stack">
            <Textarea
              value={form.svgHistoryCalls}
              onChange={(event) =>
                updateForm("svgHistoryCalls", event.target.value)
              }
              className="text-xs font-semibold leading-5"
            />
          </EditableField>
          <EditableField label="History Notes" align="stack">
            <Textarea
              value={form.svgHistoryNotes}
              onChange={(event) =>
                updateForm("svgHistoryNotes", event.target.value)
              }
              className="text-xs font-semibold leading-5"
            />
          </EditableField>
        </DetailCard>

        <DetailCard label="Benton Details">
          <EditableField label="Lead Type">
            <Select
              value={form.bentonLeadType}
              onChange={(value) => updateForm("bentonLeadType", String(value))}
              options={leadTypeOptions}
              placeholder="Select lead type"
              className="py-1.5 text-xs"
            />
          </EditableField>
          <EditableField label="To Be Called By">
            <Select
              value={form.bentonToBeCalledBy}
              onChange={(value) =>
                updateForm("bentonToBeCalledBy", String(value))
              }
              options={agentOptions}
              placeholder="Select assignee"
              className="py-1.5 text-xs"
            />
          </EditableField>
          <EditableField label="To Be Called On">
            <DatePickerField
              value={form.bentonToBeCalledOn}
              onChange={(value) => updateForm("bentonToBeCalledOn", value)}
              className="text-xs font-semibold"
            />
          </EditableField>
          <EditableField label="History Calls" align="stack">
            <Textarea
              value={form.bentonHistoryCalls}
              onChange={(event) =>
                updateForm("bentonHistoryCalls", event.target.value)
              }
              className="text-xs font-semibold leading-5"
            />
          </EditableField>
          <EditableField label="History Notes" align="stack">
            <Textarea
              value={form.bentonHistoryNotes}
              onChange={(event) =>
                updateForm("bentonHistoryNotes", event.target.value)
              }
              className="text-xs font-semibold leading-5"
            />
          </EditableField>
        </DetailCard>

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
          </DetailCard>
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
