

import { Drawer, Textarea, TextInput, TypeBadge } from "@/components/ui";
import type { Column } from "@/components/ui/Table";
import { openPrintFrame } from "@/lib/print-html";
import { DrawerCompanyField } from "@/features/backoffice-shared/DrawerCompanyField";
import { getLeadId, type EverBeenHotRow } from "../_lib/data";
import { Check, ChevronDown, ChevronUp, Link, Printer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { getLeadGridLabel } from "@/features/backoffice-shared/constants";
import { useDrawerCompanyIdentity } from "@/features/backoffice-shared/use-drawer-company-select";

type EverBeenHotDrawerProps = {
  data: EverBeenHotRow[];
  columns?: Column<EverBeenHotRow>[];
  selectedIndex: number | null;
  onSelectedIndexChange: (index: number) => void;
  onClose: () => void;
};

const iconClass = "w-4 h-4 stroke-[2]";

// Ever Been Hot is a report, not an editing surface. Every field below renders
// read-only and the drawer has no save path — edits belong on All Leads or the
// Fix Leads form, which are the screens the workflows are built around. The
// History fields were already presented this way; this is the same treatment
// applied to the rest.
const readOnlyFieldClass =
  "cursor-default bg-slate-100/80 text-xs font-semibold dark:bg-slate-900/50";
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

// Read-only indicator. Previously a switch that marked the lead Void — that
// action now lives only on the screens that own it.
function ToggleField({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
      </span>
      <span
        role="img"
        aria-label={`${label}: ${checked ? "yes" : "no"}`}
        className={
          checked
            ? "flex h-8 w-8 cursor-default items-center justify-center rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
            : "flex h-8 w-8 cursor-default items-center justify-center rounded bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
        }
      >
        <Check size={16} />
      </span>
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

  const row = selectedIndex === null ? null : (data[selectedIndex] ?? null);
  const drawerOpen = row !== null && selectedIndex !== null;
  // Derived straight from the row. This drawer is read-only, so there is no
  // form state to hold, nothing to diff, and no save path.
  const form = useMemo(() => (row ? getEditableState(row) : null), [row]);

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

  const handleCopyUrl = async () => {
    if (!drawerUrl) return;

    await navigator.clipboard.writeText(drawerUrl);
    setCopied(true);
  };

  const handlePrint = () => {
    if (typeof window === "undefined") return;

    const printWindow = openPrintFrame();
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
                {getLeadGridLabel({
                  companySymbol: displayCompanySymbol,
                  companyName: form.companyName,
                  fullName: form.fullName,
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
              title={copied ? "Copied!" : "Copy URL"}
              aria-label={copied ? "Link copied" : "Copy link to this lead"}
              className="group flex h-7 w-7 items-center justify-center rounded border cursor-pointer border-slate-200 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
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
    >
      <div className="space-y-5">
        <DetailCard>
          <DrawerCompanyField
            badgeIndex={data.findIndex((item) => item.email === row.email)}
            companyName={form.companyName}
            displayCompanySymbol={displayCompanySymbol}
            displayTimezone={displayTimezone}
          />
        </DetailCard>

        <DetailCard label="Personal Details">
          <EditableField label="Full Name">
            <TextInput value={form.fullName} readOnly className={readOnlyFieldClass} />
          </EditableField>
          <EditableField label="Role">
            <TextInput value={form.role} readOnly className={readOnlyFieldClass} />
          </EditableField>
          <EditableField label="Phone">
            <TextInput value={form.phone} readOnly className={readOnlyFieldClass} />
          </EditableField>
          <EditableField label="Email">
            {/* Not type="email": leads.email holds a comma-joined LIST of
                addresses, which an email input renders as invalid. */}
            <TextInput value={form.email} readOnly className={readOnlyFieldClass} />
          </EditableField>
        </DetailCard>

        <DetailCard label="Lead Details">
          <EditableField label="Contact Type">
            <TextInput
              value={form.contactType}
              readOnly
              className={readOnlyFieldClass}
            />
          </EditableField>
          <div className="py-1.5">
            <ToggleField label="Not Work Anymore" checked={form.notWorked} />
          </div>
        </DetailCard>

        <DetailCard label="Other Contacts">
          <EditableField label="Contacts" align="stack">
            <Textarea
              value={form.otherContacts}
              readOnly
              className={`${readOnlyFieldClass} resize-none leading-5`}
            />
          </EditableField>
        </DetailCard>

        <DetailCard label="SVG Details">
          <EditableField label="Lead Type">
            <TextInput
              value={form.svgLeadType}
              readOnly
              className={readOnlyFieldClass}
            />
          </EditableField>
          <EditableField label="To Be Called By">
            <TextInput
              value={form.svgToBeCalledBy}
              readOnly
              className={readOnlyFieldClass}
            />
          </EditableField>
          <EditableField label="To Be Called On">
            <TextInput
              value={form.svgToBeCalledOn}
              readOnly
              className={readOnlyFieldClass}
            />
          </EditableField>
          <EditableField label="History Calls" align="stack">
            <Textarea
              value={form.svgHistoryCalls}
              readOnly
              rows={4}
              className="cursor-default resize-none bg-slate-100/80 text-xs font-semibold leading-5 dark:bg-slate-900/50"
            />
          </EditableField>
          <EditableField label="History Notes" align="stack">
            <Textarea
              value={form.svgHistoryNotes}
              readOnly
              rows={4}
              className="cursor-default resize-none bg-slate-100/80 text-xs font-semibold leading-5 dark:bg-slate-900/50"
            />
          </EditableField>
        </DetailCard>

        <DetailCard label="Benton Details">
          <EditableField label="Lead Type">
            <TextInput
              value={form.bentonLeadType}
              readOnly
              className={readOnlyFieldClass}
            />
          </EditableField>
          <EditableField label="To Be Called By">
            <TextInput
              value={form.bentonToBeCalledBy}
              readOnly
              className={readOnlyFieldClass}
            />
          </EditableField>
          <EditableField label="To Be Called On">
            <TextInput
              value={form.bentonToBeCalledOn}
              readOnly
              className={readOnlyFieldClass}
            />
          </EditableField>
          <EditableField label="History Calls" align="stack">
            <Textarea
              value={form.bentonHistoryCalls}
              readOnly
              rows={4}
              className="cursor-default resize-none bg-slate-100/80 text-xs font-semibold leading-5 dark:bg-slate-900/50"
            />
          </EditableField>
          <EditableField label="History Notes" align="stack">
            <Textarea
              value={form.bentonHistoryNotes}
              readOnly
              rows={4}
              className="cursor-default resize-none bg-slate-100/80 text-xs font-semibold leading-5 dark:bg-slate-900/50"
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
