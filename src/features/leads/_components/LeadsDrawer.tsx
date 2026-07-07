

import {
  DatePickerField,
  Drawer,
  EditableDrawerFooter,
  Select,
  Textarea,
  TextInput,
  TypeBadge,
} from "@/components/ui";
import type { Column } from "@/components/ui/Table";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import Revisions from "@/features/backoffice-shared/Revisions";
import { DrawerCompanyField } from "@/features/backoffice-shared/DrawerCompanyField";
import { getLeadGridLabel } from "@/features/backoffice-shared/constants";
import { useAgentSelectOptions } from "@/features/backoffice-shared/use-agent-select-options";
import { useDrawerCompanySelect } from "@/features/backoffice-shared/use-drawer-company-select";
import {
  useUpdateLead,
  type LeadPatchBody,
} from "@/features/backoffice-shared/use-update-lead";
import {
  getCallBackDateError,
  getMinCallBackDate,
} from "@/features/agent-calls/_lib/utils";
import {
  isBrandAgentSlug,
  toggleMarkVoid,
} from "@/features/agent-calls/_lib/markVoid";
import { CONTACT_TYPE_VALUES } from "@/types/contact-type.types";
import { LEAD_TYPE_VALUES } from "@/types/lead-type.types";
import { useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, ChevronUp, Link, Printer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useRelatedLeads } from "@/features/fix-leads/_lib/data";
import { AssociatedContactsSection } from "./AssociatedContacts";
import {
  directoryRowToFormState,
  relatedLeadToDirectoryRow,
  type LeadDrawerFormState,
} from "../_lib/lead-detail";
import { type LeadDirectoryRow } from "../_lib/data";
import type { RelatedLead } from "@/features/fix-leads/_lib/data";

const NESTED_DRAWER_Z = 210;

type LeadsDrawerProps = {
  data: LeadDirectoryRow[];
  columns?: Column<LeadDirectoryRow>[];
  selectedIndex: number | null;
  onSelectedIndexChange: (index: number | null) => void;
  onClose: () => void;
  nested?: boolean;
  zIndex?: number;
  onAssociatedContactSelect?: (contact: RelatedLead) => void;
  activeAssociatedContactId?: string | null;
};

const iconClass = "w-4 h-4 stroke-[2]";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
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
  nested = false,
  zIndex,
  onAssociatedContactSelect,
  activeAssociatedContactId,
}: LeadsDrawerProps) {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const brandParam = searchParams.get("brand");
  const agentSlug = isBrandAgentSlug(brandParam) ? brandParam : "svg";
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [svgToBeCalledOnError, setSvgToBeCalledOnError] = useState<string>();
  const [bentonToBeCalledOnError, setBentonToBeCalledOnError] =
    useState<string>();
  const [rm95ToBeCalledOnError, setRm95ToBeCalledOnError] = useState<string>();
  const [nestedContact, setNestedContact] = useState<RelatedLead | null>(null);
  const [editModeKey, setEditModeKey] = useState<string | null>(null);
  const [formState, setFormState] = useState<{
    key: string;
    value: LeadDrawerFormState;
  } | null>(null);
  const updateLead = useUpdateLead();
  const svgAgentsQuery = useAgentSelectOptions("svg");
  const bentonAgentsQuery = useAgentSelectOptions("benton");
  const rm95AgentsQuery = useAgentSelectOptions("95rm");

  const row = selectedIndex === null ? null : (data[selectedIndex] ?? null);
  const rowKey = row?.leadId ?? row?.email ?? "";
  const drawerOpen = row !== null && selectedIndex !== null;
  const displayRow = row;
  const relatedQuery = useRelatedLeads(drawerOpen ? row?.leadId : null);
  const isEditMode = rowKey !== "" && editModeKey === rowKey;
  const initialForm = useMemo(
    () => (row ? directoryRowToFormState(row) : null),
    [row],
  );
  const form = formState?.key === rowKey ? formState.value : initialForm;

  const updateForm = <Key extends keyof LeadDrawerFormState>(
    key: Key,
    value: LeadDrawerFormState[Key],
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

  const handleNotWorkedChange = async (checked: boolean) => {
    if (!row?.leadId) {
      showErrorToast(new Error("Cannot update: this row has no leadId."));
      return;
    }

    updateForm("notWorked", checked);
    if (!checked) return;

    const ok = await toggleMarkVoid(agentSlug, row.leadId, checked, {
      successMessage: "Lead marked as no longer working at the company.",
    });
    if (!ok) {
      updateForm("notWorked", false);
    }
  };

  const {
    companyOptions,
    companySelectSource,
    displayCompanySymbol,
    displayTimezone,
    handleCompanyChange,
  } = useDrawerCompanySelect({
    drawerOpen,
    rowKey,
    companyName: form?.companyName ?? "",
    initialCompanyName: initialForm?.companyName ?? "",
    rowCompanySymbol: displayRow?.companySymbol,
    rowCompanyName: displayRow?.companyName,
    rowTimezone: displayRow?.timezone,
    onCompanyNameChange: (companyName) => updateForm("companyName", companyName),
  });

  const leadTypeOptions = useMemo(
    () => LEAD_TYPE_VALUES.map((value) => ({ label: value, value })),
    [],
  );
  const contactTypeOptions = useMemo(
    () => CONTACT_TYPE_VALUES.map((value) => ({ label: value, value })),
    [],
  );

  const detailItems = useMemo(() => {
    if (!displayRow) return [];

    return (columns ?? []).map((column) => {
      const resolvedValue = column.getValue
        ? column.getValue(displayRow)
        : displayRow[column.key as keyof LeadDirectoryRow];

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
  }, [columns, displayRow]);

  const drawerUrl = useMemo(() => {
    if (!displayRow || typeof window === "undefined") return "";
    const params = new URLSearchParams(searchParams.toString());
    params.set("lead", getLeadGridLabel(displayRow));
    return `${window.location.origin}${pathname}?${params.toString()}`;
  }, [displayRow, pathname, searchParams]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  useEffect(() => {
    setFormState(null);
    setEditModeKey(null);
    setSvgToBeCalledOnError(undefined);
    setBentonToBeCalledOnError(undefined);
    setRm95ToBeCalledOnError(undefined);
    setNestedContact(null);
  }, [rowKey]);

  if (!row || selectedIndex === null || !form || !displayRow) return null;

  const handleCopyUrl = async () => {
    if (!drawerUrl) return;
    await navigator.clipboard.writeText(drawerUrl);
    setCopied(true);
  };

  const renderDrawerHeader = (
    title: {
      companySymbol?: string | null;
      companyName?: string | null;
      fullName?: string | null;
    },
    actionsEnabled = true,
  ) => (
    <div className="flex w-full items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        {!nested ? (
          <>
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
          </>
        ) : null}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {getLeadGridLabel(title)}
          </p>
        </div>
      </div>
      {actionsEnabled && !nested ? (
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
            <Link className={`${iconClass} group-hover:scale-110 transition`} />
          </button>
        </div>
      ) : null}
    </div>
  );

  const handleSvgToBeCalledOnChange = (value: string) => {
    const error = getCallBackDateError(value, displayRow.svgLastCallDate ?? "");
    setSvgToBeCalledOnError(error);
    if (error) return;
    updateForm("svgToBeCalledOn", value);
  };

  const handleBentonToBeCalledOnChange = (value: string) => {
    const error = getCallBackDateError(value, displayRow.bentonLastCallDate ?? "");
    setBentonToBeCalledOnError(error);
    if (error) return;
    updateForm("bentonToBeCalledOn", value);
  };

  const handleRm95ToBeCalledOnChange = (value: string) => {
    const error = getCallBackDateError(value, displayRow.rm95LastCallDate ?? "");
    setRm95ToBeCalledOnError(error);
    if (error) return;
    updateForm("rm95ToBeCalledOn", value);
  };

  const handleEditStart = () => {
    if (!rowKey) return;
    setEditModeKey(rowKey);
  };

  const handleReset = () => {
    setFormState(null);
    setSvgToBeCalledOnError(undefined);
    setBentonToBeCalledOnError(undefined);
    setRm95ToBeCalledOnError(undefined);
  };

  const handleAssociatedContactClick = (contact: RelatedLead) => {
    if (nested) {
      onAssociatedContactSelect?.(contact);
      return;
    }
    setNestedContact(contact);
  };

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
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["leads", "directory"] }),
      ]);
      showSuccessToast("Lead changes saved successfully.");
      setEditModeKey(null);
      setFormState(null);
    } catch (error) {
      showErrorToast(error);
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
          <title>${escapeHtml(displayRow.companyName)} | Lead</title>
        </head>
        <body style="font-family:Arial,sans-serif;padding:24px;color:#0f172a;">
          <h1>${escapeHtml(displayRow.companyName)}</h1>
          <p style="margin-bottom:20px;color:#475569;">
            ${escapeHtml(displayRow.fullName)} | ${escapeHtml(displayRow.email)}
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
    <>
    <Drawer
      isOpen={selectedIndex !== null}
      onClose={onClose}
      direction="right"
      size="560px"
      zIndex={zIndex}
      header={renderDrawerHeader({
        companySymbol: displayCompanySymbol,
        companyName: form.companyName,
        fullName: form.fullName,
      })}
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
          <DrawerCompanyField
            rowKey={rowKey}
            badgeIndex={data.findIndex((item) => item.leadId === row.leadId)}
            companyName={form.companyName}
            displayCompanySymbol={displayCompanySymbol}
            displayTimezone={displayTimezone}
            companyOptions={companyOptions}
            companySelectSource={companySelectSource}
            onCompanyChange={handleCompanyChange}
          />
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
              onChange={handleNotWorkedChange}
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
          onToBeCalledOnChange={handleSvgToBeCalledOnChange}
          toBeCalledOnError={svgToBeCalledOnError}
          minCallBackDate={getMinCallBackDate(displayRow.svgLastCallDate ?? "")}
          historyCalls={form.svgHistoryCalls}
          historyNotes={form.svgHistoryNotes}
          leadTypeOptions={leadTypeOptions}
          agentOptions={svgAgentsQuery.options}
          agentsLoading={svgAgentsQuery.isLoading}
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
          onToBeCalledOnChange={handleBentonToBeCalledOnChange}
          toBeCalledOnError={bentonToBeCalledOnError}
          minCallBackDate={getMinCallBackDate(displayRow.bentonLastCallDate ?? "")}
          historyCalls={form.bentonHistoryCalls}
          historyNotes={form.bentonHistoryNotes}
          leadTypeOptions={leadTypeOptions}
          agentOptions={bentonAgentsQuery.options}
          agentsLoading={bentonAgentsQuery.isLoading}
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
          onToBeCalledOnChange={handleRm95ToBeCalledOnChange}
          toBeCalledOnError={rm95ToBeCalledOnError}
          minCallBackDate={getMinCallBackDate(displayRow.rm95LastCallDate ?? "")}
          historyCalls={form.rm95HistoryCalls}
          historyNotes={form.rm95HistoryNotes}
          leadTypeOptions={leadTypeOptions}
          agentOptions={rm95AgentsQuery.options}
          agentsLoading={rm95AgentsQuery.isLoading}
        />

        <AssociatedContactsSection
          key={rowKey}
          isLoading={relatedQuery.isLoading}
          isError={relatedQuery.isError}
          contacts={relatedQuery.data ?? []}
          onContactClick={handleAssociatedContactClick}
          activeContactId={activeAssociatedContactId ?? (nested ? row.leadId : null)}
        />
      </div>
    </Drawer>

    {!nested && nestedContact ? (
      <LeadsDrawer
        key={nestedContact.id}
        nested
        zIndex={NESTED_DRAWER_Z}
        data={[relatedLeadToDirectoryRow(nestedContact)]}
        selectedIndex={0}
        onSelectedIndexChange={() => {}}
        onClose={() => setNestedContact(null)}
        onAssociatedContactSelect={(contact) => setNestedContact(contact)}
        activeAssociatedContactId={nestedContact.id}
      />
    ) : null}
    </>
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
  toBeCalledOnError,
  minCallBackDate,
  historyCalls,
  historyNotes,
  leadTypeOptions,
  agentOptions,
  agentsLoading,
}: {
  title: string;
  leadType: string;
  onLeadTypeChange: (value: string) => void;
  toBeCalledBy: string;
  onToBeCalledByChange: (value: string) => void;
  toBeCalledOn: string;
  onToBeCalledOnChange: (value: string) => void;
  toBeCalledOnError?: string;
  minCallBackDate: Date;
  historyCalls: string;
  historyNotes: string;
  leadTypeOptions: Array<{ label: string; value: string }>;
  agentOptions: Array<{ label: string; value: string }>;
  agentsLoading: boolean;
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
          placeholder={agentsLoading ? "Loading agents..." : "Select assignee"}
          disabled={agentsLoading}
          searchable
          searchPlaceholder="Search agent"
          className="py-1.5 text-xs"
        />
      </EditableField>
      <EditableField label="To Be Called On">
        <DatePickerField
          value={toBeCalledOn}
          onChange={onToBeCalledOnChange}
          minDate={minCallBackDate}
          error={toBeCalledOnError}
          className="text-xs font-semibold"
        />
      </EditableField>
      <EditableField label="History Calls" align="stack">
        <Textarea
          value={historyCalls}
          readOnly
          rows={4}
          className="cursor-default resize-none bg-slate-100/80 text-xs font-semibold leading-5 dark:bg-slate-900/50"
        />
      </EditableField>
      <EditableField label="History Notes" align="stack">
        <Textarea
          value={historyNotes}
          readOnly
          rows={4}
          className="cursor-default resize-none bg-slate-100/80 text-xs font-semibold leading-5 dark:bg-slate-900/50"
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
