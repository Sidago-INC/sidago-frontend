

import {
  CompanySymbolBadge,
  Drawer,
  DrawerActionHeader,
  EmailLink,
  TimezoneBadge,
  TypeBadge,
} from "@/components/ui";
import {
  getCompanySymbol,
  getLeadId,
} from "@/features/backoffice-shared/constants";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import type { EmailBlocklistDirectoryRow } from "../_lib/data";

type EmailBlocklistDirectoryDrawerProps = {
  row: EmailBlocklistDirectoryRow | null;
  currentIndex: number;
  rowCount: number;
  onCancel: () => void;
  onNavigate: (index: number) => void;
  onRemove: (row: EmailBlocklistDirectoryRow) => void;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function EmailBlocklistDirectoryDrawer({
  row,
  currentIndex,
  rowCount,
  onCancel,
  onNavigate,
  onRemove,
}: EmailBlocklistDirectoryDrawerProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopyLink = async () => {
    if (!row || typeof window === "undefined") return;

    const url = new URL(window.location.href);
    url.searchParams.set("lead", getLeadId(row));
    await navigator.clipboard.writeText(url.toString());
    setCopied(true);
  };

  const handlePrint = () => {
    if (!row || typeof window === "undefined") return;

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    const rows = [
      ["Lead ID", getLeadId(row)],
      ["Company", row.companyName],
      ["Full Name", row.fullName],
      ["Role", row.role ?? ""],
      ["Phone", row.phone],
      ["Email", row.email],
      ["Contact Type", row.contactType],
      ["SVG Lead Type", row.svgLeadType],
      ["SVG To Be Called By", row.svgToBeCalledBy],
      ["SVG Last Call Date", row.svgLastCallDate],
      ["SVG Note", row.historyCallNotesSvg],
      ["Benton Lead Type", row.bentonLeadType],
      ["Benton To Be Called By", row.bentonToBeCalledBy],
      ["Benton Last Call Date", row.bentonLastCallDate],
      ["Benton Note", row.historyCallNotesBenton],
      ["Not Work Anymore", row.notWorked ? "Yes" : "No"],
      ["Reason", row.reason],
      ["Added By", row.addedBy],
      ["Last Action Date", row.lastActionDate],
      ["Last Fixed Date", row.lastFixedDate ?? ""],
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

    printWindow.document.write(`
      <html>
        <head>
          <title>${escapeHtml(getLeadId(row))} | Email Blocklist Directory</title>
        </head>
        <body style="font-family:Arial,sans-serif;padding:24px;color:#0f172a;">
          <h1>Email Blocklist Directory</h1>
          <p style="margin-bottom:20px;color:#475569;">
            ${escapeHtml(getLeadId(row))} | ${escapeHtml(row.email)}
          </p>
          <table style="width:100%;border-collapse:collapse;">
            ${rows}
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
          title={row ? getLeadId(row) : "Blocklist entry"}
          copied={copied}
          canGoPrevious={currentIndex > 0}
          canGoNext={currentIndex >= 0 && currentIndex < rowCount - 1}
          onPrevious={() => onNavigate(currentIndex - 1)}
          onNext={() => onNavigate(currentIndex + 1)}
          onPrint={handlePrint}
          onCopyLink={handleCopyLink}
        />
      }
      footer={
        <div className="flex flex-col gap-2 bg-white px-5 py-4 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-end">
          {row && (
            <button
              type="button"
              onClick={() => onRemove(row)}
              className="cursor-pointer rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              Remove From Blocklist
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      }
    >
      {row && (
        <div className="space-y-5">
          <DetailCard>
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <CompanySymbolBadge
                  symbol={getCompanySymbol(row.companyName)}
                  index={currentIndex >= 0 ? currentIndex : 0}
                  className="rounded"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {row.companyName}
                  </p>
                </div>
              </div>
              <TimezoneBadge
                timezone={row.timezone}
                index={currentIndex >= 0 ? currentIndex : 0}
              />
            </div>
          </DetailCard>

          <DetailCard label="Personal Information">
            <AssociationDetail label="Full Name" value={row.fullName || "-"} />
            <AssociationDetail label="Phone" value={row.phone || "-"} />
            <AssociationDetail
              label="Email"
              value={<EmailLink value={row.email} />}
            />
          </DetailCard>

          <DetailCard label="Lead Details">
            <AssociationDetail
              label="Contact Type"
              value={<TypeBadge value={row.contactType} kind="contact" />}
            />
            <AssociationDetail
              label="Lead Type Benton"
              value={<TypeBadge value={row.bentonLeadType} kind="lead" />}
            />
            <AssociationDetail
              label="Not Work Anymore"
              value={<CheckmarkStatus checked={row.notWorked ?? false} />}
            />
          </DetailCard>

          <DetailCard label="SVG Details">
            <AssociationDetail
              label="History Calls"
              value={<NotesText value={row.historyCallNotesSvg} />}
            />
            <AssociationDetail
              label="History Notes"
              value={<NotesText value={row.historyCallNotesSvg} />}
            />
          </DetailCard>

          <DetailCard label="Benton Details">
            <AssociationDetail
              label="History Calls"
              value={<NotesText value={row.historyCallNotesBenton} />}
            />
            <AssociationDetail
              label="History Notes"
              value={<NotesText value={row.historyCallNotesBenton} />}
            />
          </DetailCard>
        </div>
      )}
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

function NotesText({ value }: { value: string }) {
  return (
    <span className="block whitespace-pre-line text-left text-xs font-semibold text-slate-600 dark:text-slate-200">
      {value || "-"}
    </span>
  );
}

function CheckmarkStatus({ checked }: { checked: boolean }) {
  return (
    <span
      className={
        checked
          ? "flex h-8 w-8 items-center justify-center rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
          : "flex h-8 w-8 items-center justify-center rounded bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
      }
    >
      <Check size={16} />
    </span>
  );
}
