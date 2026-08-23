
import {
  Badge,
  CompanySymbolBadge,
  Drawer,
  DrawerActionHeader,
  EmailLink,
  TypeBadge,
} from "@/components/ui";
import { useEffect, useState } from "react";
import { openPrintFrame } from "@/lib/print-html";
import {
  formatCallHistoryCallsText,
  formatCallHistoryDate,
  formatCallHistoryNotesText,
  getBrandLabel,
  getCallHistoryLineDetail,
  getCallHistoryNoteDetail,
  getEmailBlacklistDisplayLeadId,
  type CallHistoryEntry,
  type EmailBlocklistDirectoryRow,
} from "../_lib/data";

type EmailBlocklistDirectoryDrawerProps = {
  row: EmailBlocklistDirectoryRow | null;
  currentIndex: number;
  rowCount: number;
  onCancel: () => void;
  onNavigate: (index: number) => void;
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
    url.searchParams.set("lead", getEmailBlacklistDisplayLeadId(row));
    await navigator.clipboard.writeText(url.toString());
    setCopied(true);
  };

  const handlePrint = () => {
    if (!row || typeof window === "undefined") return;

    const printWindow = openPrintFrame();
    if (!printWindow) return;

    const rows = [
      ["Lead ID", getEmailBlacklistDisplayLeadId(row)],
      ["Company", row.companyName ?? ""],
      ["Full Name", row.fullName ?? ""],
      ["Phone", row.phone ?? ""],
      ["Email", row.email ?? ""],
      ["Contact Type", row.contactType ?? ""],
      ["SVG Lead Type", row.leadTypeSvg ?? ""],
      ["Benton Lead Type", row.leadTypeBenton ?? ""],
      ["95RM Lead Type", row.leadType95rm ?? ""],
      [
        "Blacklisted Brands",
        row.blacklistedBrands.map(getBrandLabel).join(", "),
      ],
      ["SVG History Calls", formatCallHistoryCallsText(row.callHistory.svg)],
      ["SVG History Notes", formatCallHistoryNotesText(row.callHistory.svg)],
      [
        "Benton History Calls",
        formatCallHistoryCallsText(row.callHistory.benton),
      ],
      [
        "Benton History Notes",
        formatCallHistoryNotesText(row.callHistory.benton),
      ],
      ["95RM History Calls", formatCallHistoryCallsText(row.callHistory["95rm"])],
      ["95RM History Notes", formatCallHistoryNotesText(row.callHistory["95rm"])],
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
          <title>${escapeHtml(getEmailBlacklistDisplayLeadId(row))} | Email Blocklist Directory</title>
        </head>
        <body style="font-family:Arial,sans-serif;padding:24px;color:#0f172a;">
          <h1>Email Blocklist Directory</h1>
          <p style="margin-bottom:20px;color:#475569;">
            ${escapeHtml(getEmailBlacklistDisplayLeadId(row))} | ${escapeHtml(row.email ?? "-")}
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
          title={row ? getEmailBlacklistDisplayLeadId(row) : "Blocklist entry"}
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
                  symbol={row.companySymbol ?? "-"}
                  index={currentIndex >= 0 ? currentIndex : 0}
                  className="rounded"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {row.companyName}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-1.5">
                {row.blacklistedBrands.map((brand) => (
                  <Badge key={brand}>{getBrandLabel(brand)}</Badge>
                ))}
              </div>
            </div>
          </DetailCard>

          <DetailCard label="Personal Information">
            <AssociationDetail label="Full Name" value={row.fullName || "-"} />
            <AssociationDetail
              label="Phone"
              value={
                row.phone ? (
                  <a
                    href={`tel:${row.phone}`}
                    onClick={(event) => event.stopPropagation()}
                    className="font-medium text-sky-600 underline-offset-2 hover:underline dark:text-sky-300"
                  >
                    {row.phone}
                  </a>
                ) : (
                  "-"
                )
              }
            />
            <AssociationDetail
              label="Email"
              value={row.email ? <EmailLink value={row.email} /> : "-"}
            />
          </DetailCard>

          <DetailCard label="Lead Details">
            <AssociationDetail
              label="Contact Type"
              value={
                row.contactType ? (
                  <TypeBadge value={row.contactType} kind="contact" />
                ) : (
                  "-"
                )
              }
            />
            <AssociationDetail
              label="SVG Lead Type"
              value={
                row.leadTypeSvg ? (
                  <TypeBadge value={row.leadTypeSvg} kind="lead" />
                ) : (
                  "-"
                )
              }
            />
            <AssociationDetail
              label="Lead Type Benton"
              value={
                row.leadTypeBenton ? (
                  <TypeBadge value={row.leadTypeBenton} kind="lead" />
                ) : (
                  "-"
                )
              }
            />
            <AssociationDetail
              label="Lead Type 95RM"
              value={
                row.leadType95rm ? (
                  <TypeBadge value={row.leadType95rm} kind="lead" />
                ) : (
                  "-"
                )
              }
            />
          </DetailCard>

          <DetailCard label="SVG Details">
            <HistoryCallsField entries={row.callHistory.svg} />
            <HistoryNotesField entries={row.callHistory.svg} />
          </DetailCard>

          <DetailCard label="Benton Details">
            <HistoryCallsField entries={row.callHistory.benton} />
            <HistoryNotesField entries={row.callHistory.benton} />
          </DetailCard>

          <DetailCard label="95RM Details">
            <HistoryCallsField entries={row.callHistory["95rm"]} />
            <HistoryNotesField entries={row.callHistory["95rm"]} />
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

function HistoryField({
  label,
  entries,
  getDetail,
}: {
  label: string;
  entries: CallHistoryEntry[];
  getDetail: (entry: CallHistoryEntry) => string;
}) {
  const lines = entries
    .map((entry) => ({
      id: entry.id,
      date: formatCallHistoryDate(entry.calledAt),
      detail: getDetail(entry),
    }))
    .filter((line) => line.date || line.detail);

  return (
    <div className="space-y-1 py-2">
      <p className="text-[10px] uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <div className="rounded border border-gray-300 bg-white px-3 py-2 text-xs leading-5 text-slate-600 dark:border-gray-600 dark:bg-gray-800 dark:text-slate-200">
        {lines.length === 0 ? (
          <span className="text-slate-400">-</span>
        ) : (
          lines.map((line) => (
            <div key={line.id}>
              <span className="font-semibold text-slate-700 dark:text-slate-100">
                {line.date}
              </span>
              {line.detail ? ` - ${line.detail}` : ""}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function HistoryCallsField({ entries }: { entries: CallHistoryEntry[] }) {
  return (
    <HistoryField
      label="History Calls"
      entries={entries}
      getDetail={getCallHistoryLineDetail}
    />
  );
}

function HistoryNotesField({ entries }: { entries: CallHistoryEntry[] }) {
  const noteEntries = entries.filter((entry) => entry.notes?.trim());

  return (
    <HistoryField
      label="History Notes"
      entries={noteEntries}
      getDetail={getCallHistoryNoteDetail}
    />
  );
}
