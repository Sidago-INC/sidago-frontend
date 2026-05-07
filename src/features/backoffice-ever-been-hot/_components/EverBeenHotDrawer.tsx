
import {
  CheckboxInput,
  CompanySymbolBadge,
  DateInput,
  Drawer,
  EmailLink,
  Select,
  Textarea,
  TextInput,
  TimezoneBadge,
  TypeBadge,
} from "@/components/ui";
import type { Column } from "@/components/ui/Table";
import { getCompanySymbol, type EverBeenHotRow } from "../_lib/data";
import { ChevronDown, ChevronUp, Link, Printer } from "lucide-react";
import { isValidElement, useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import Revisions from "@/features/backoffice-shared/Revisions";
import {
  useUpdateLead,
  type LeadPatchBody,
} from "@/features/backoffice-shared/use-update-lead";
import { useUsers } from "@/features/backoffice-shared/use-users";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { COMPANY_VALUES } from "@/types/company.types";
import { CONTACT_TYPE_VALUES } from "@/types/contact-type.types";
import { LEAD_TYPE_VALUES } from "@/types/lead-type.types";

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
  rm95LeadType: string;
  rm95ToBeCalledBy: string;
  rm95HistoryCalls: string;
  rm95HistoryNotes: string;
  rm95ToBeCalledOn: string;
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
  const initialForm = useMemo(() => (row ? getEditableState(row) : null), [row]);
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

  // Brand-filtered agent rosters from the DB.
  const { data: svgAgents } = useUsers("svg");
  const { data: bentonAgents } = useUsers("benton");
  const { data: rm95Agents } = useUsers("95rm");

  const toAgentOptions = (list: { name: string }[] | undefined) =>
    (list ?? []).map((u) => ({ label: u.name, value: u.name }));

  const svgAgentOptions = useMemo(() => toAgentOptions(svgAgents), [svgAgents]);
  const bentonAgentOptions = useMemo(
    () => toAgentOptions(bentonAgents),
    [bentonAgents],
  );
  const rm95AgentOptions = useMemo(
    () => toAgentOptions(rm95Agents),
    [rm95Agents],
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
    params.set("lead", row.email);

    return `${window.location.origin}${pathname}?${params.toString()}`;
  }, [pathname, row, searchParams]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  if (!row || selectedIndex === null || !form) return null;

  const currentIndex = selectedIndex;

  const goToIndex = (index: number) => {
    onSelectedIndexChange(index);
  };

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

  const handleCopyUrl = async () => {
    if (!drawerUrl) return;

    await navigator.clipboard.writeText(drawerUrl);
    setCopied(true);
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
    if (form.contactType !== initialForm.contactType)
      leadDiff.contact_type = form.contactType;
    if (form.notWorked !== initialForm.notWorked)
      leadDiff.not_work_anymore = form.notWorked;
    if (form.companyName !== initialForm.companyName)
      leadDiff.company_name = form.companyName;

    if (Object.keys(leadDiff).length > 0) body.lead = leadDiff;

    const brandStates: NonNullable<LeadPatchBody["brandStates"]> = {};

    const svgDiff: NonNullable<NonNullable<LeadPatchBody["brandStates"]>["svg"]> = {};
    if (form.svgLeadType !== initialForm.svgLeadType)
      svgDiff.lead_type = form.svgLeadType;
    if (form.svgToBeCalledBy !== initialForm.svgToBeCalledBy)
      svgDiff.to_be_called_by = form.svgToBeCalledBy || null;
    if (form.svgToBeCalledOn !== initialForm.svgToBeCalledOn)
      svgDiff.last_called_date = form.svgToBeCalledOn || null;
    if (Object.keys(svgDiff).length > 0) brandStates.svg = svgDiff;

    const bentonDiff: NonNullable<
      NonNullable<LeadPatchBody["brandStates"]>["benton"]
    > = {};
    if (form.bentonLeadType !== initialForm.bentonLeadType)
      bentonDiff.lead_type = form.bentonLeadType;
    if (form.bentonToBeCalledBy !== initialForm.bentonToBeCalledBy)
      bentonDiff.to_be_called_by = form.bentonToBeCalledBy || null;
    if (form.bentonToBeCalledOn !== initialForm.bentonToBeCalledOn)
      bentonDiff.last_called_date = form.bentonToBeCalledOn || null;
    if (Object.keys(bentonDiff).length > 0) brandStates.benton = bentonDiff;

    const rm95Diff: NonNullable<
      NonNullable<LeadPatchBody["brandStates"]>["95rm"]
    > = {};
    if (form.rm95LeadType !== initialForm.rm95LeadType)
      rm95Diff.lead_type = form.rm95LeadType;
    if (form.rm95ToBeCalledBy !== initialForm.rm95ToBeCalledBy)
      rm95Diff.to_be_called_by = form.rm95ToBeCalledBy || null;
    if (form.rm95ToBeCalledOn !== initialForm.rm95ToBeCalledOn)
      rm95Diff.last_called_date = form.rm95ToBeCalledOn || null;
    if (Object.keys(rm95Diff).length > 0) brandStates["95rm"] = rm95Diff;

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
              onClick={() => goToIndex(currentIndex - 1)}
              disabled={currentIndex <= 0}
              className="group flex h-7 w-7 items-center justify-center rounded border cursor-pointer border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronUp
                className={`${iconClass} group-hover:-translate-y-0.5 transition`}
              />
            </button>

            <button
              onClick={() => goToIndex(currentIndex + 1)}
              disabled={currentIndex >= data.length - 1}
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
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setFormState(null)}
              disabled={!isDirty || updateLead.isPending}
              className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!isDirty || updateLead.isPending || !row?.leadId}
              className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {updateLead.isPending ? "Saving…" : "Save"}
            </button>
          </div>
          <Revisions />
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
          <EditableField label="Not Work Anymore">
            <CheckboxInput
              checked={form.notWorked}
              onChange={(event) =>
                updateForm("notWorked", event.target.checked)
              }
              labelClassName="justify-end"
            />
          </EditableField>
        </DetailCard>

        <DetailCard label="Other Contacts">
          <EditableField label="Contacts" align="stack" readOnly>
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
              options={svgAgentOptions}
              placeholder="Select assignee"
              className="py-1.5 text-xs"
            />
          </EditableField>
          <EditableField label="To Be Called On">
            <DateInput
              value={form.svgToBeCalledOn}
              onChange={(event) =>
                updateForm("svgToBeCalledOn", event.target.value)
              }
              className="text-xs font-semibold"
            />
          </EditableField>
          <EditableField label="History Calls" align="stack" readOnly>
            <Textarea
              value={form.svgHistoryCalls}
              onChange={(event) =>
                updateForm("svgHistoryCalls", event.target.value)
              }
              className="text-xs font-semibold leading-5"
            />
          </EditableField>
          <EditableField label="History Notes" align="stack" readOnly>
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
              options={bentonAgentOptions}
              placeholder="Select assignee"
              className="py-1.5 text-xs"
            />
          </EditableField>
          <EditableField label="To Be Called On">
            <DateInput
              value={form.bentonToBeCalledOn}
              onChange={(event) =>
                updateForm("bentonToBeCalledOn", event.target.value)
              }
              className="text-xs font-semibold"
            />
          </EditableField>
          <EditableField label="History Calls" align="stack" readOnly>
            <Textarea
              value={form.bentonHistoryCalls}
              onChange={(event) =>
                updateForm("bentonHistoryCalls", event.target.value)
              }
              className="text-xs font-semibold leading-5"
            />
          </EditableField>
          <EditableField label="History Notes" align="stack" readOnly>
            <Textarea
              value={form.bentonHistoryNotes}
              onChange={(event) =>
                updateForm("bentonHistoryNotes", event.target.value)
              }
              className="text-xs font-semibold leading-5"
            />
          </EditableField>
        </DetailCard>

        <DetailCard label="95RM Details">
          <EditableField label="Lead Type">
            <Select
              value={form.rm95LeadType}
              onChange={(value) => updateForm("rm95LeadType", String(value))}
              options={leadTypeOptions}
              placeholder="Select lead type"
              className="py-1.5 text-xs"
            />
          </EditableField>
          <EditableField label="To Be Called By">
            <Select
              value={form.rm95ToBeCalledBy}
              onChange={(value) =>
                updateForm("rm95ToBeCalledBy", String(value))
              }
              options={rm95AgentOptions}
              placeholder="Select assignee"
              className="py-1.5 text-xs"
            />
          </EditableField>
          <EditableField label="To Be Called On">
            <DateInput
              value={form.rm95ToBeCalledOn}
              onChange={(event) =>
                updateForm("rm95ToBeCalledOn", event.target.value)
              }
              className="text-xs font-semibold"
            />
          </EditableField>
          <EditableField label="History Calls" align="stack" readOnly>
            <Textarea
              value={form.rm95HistoryCalls}
              onChange={(event) =>
                updateForm("rm95HistoryCalls", event.target.value)
              }
              className="text-xs font-semibold leading-5"
            />
          </EditableField>
          <EditableField label="History Notes" align="stack" readOnly>
            <Textarea
              value={form.rm95HistoryNotes}
              onChange={(event) =>
                updateForm("rm95HistoryNotes", event.target.value)
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
  readOnly = false,
}: {
  label: string;
  children: React.ReactNode;
  align?: "row" | "stack";
  readOnly?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const preview = getEditablePreview(label, children);

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
        {readOnly ? (
          <div
            aria-readonly
            className={`w-full rounded border border-slate-200 bg-slate-100 text-xs font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400 ${
              align === "stack"
                ? "min-h-[98px] px-3 py-2 text-left whitespace-pre-line"
                : "min-h-[30px] px-3 py-1.5 text-left truncate"
            }`}
          >
            {preview}
          </div>
        ) : isEditing ? (
          children
        ) : (
          <div
            role="button"
            tabIndex={0}
            onClick={() => setIsEditing(true)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setIsEditing(true);
              }
            }}
            className={`w-full cursor-text rounded border border-gray-300 bg-white text-xs font-semibold text-slate-600 transition focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-slate-200 ${
              align === "stack"
                ? "min-h-[98px] px-3 py-2 text-left whitespace-pre-line"
                : "min-h-[30px] px-3 py-1.5 text-left truncate"
            }`}
          >
            {preview}
          </div>
        )}
      </div>
    </div>
  );
}

function getEditablePreview(
  label: string,
  children: React.ReactNode,
): React.ReactNode {
  if (!isValidElement(children)) return <EmptyPreview label={label} />;

  const props = children.props as {
    value?: unknown;
    checked?: boolean;
    options?: Array<{ label: string; value: string | number }>;
  };

  if (typeof props.checked === "boolean") {
    return props.checked ? "Yes" : "No";
  }

  const value = props.value == null ? "" : String(props.value);
  if (!value) return <EmptyPreview label={label} />;

  if (label.toLowerCase() === "email") {
    return <EmailLink value={value} />;
  }

  const option = props.options?.find((item) => String(item.value) === value);
  return option?.label ?? value;
}

function EmptyPreview({
  label,
}: {
  label: string;
}) {
  return (
    <span
      aria-label={`Empty ${label}`}
      className="block"
    />
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
