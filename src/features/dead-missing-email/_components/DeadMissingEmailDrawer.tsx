
import {
  Badge,
  BooleanCheckBadge,
  Drawer,
  DrawerActionHeader,
  EmailLink,
  TypeBadge,
} from "@/components/ui";
import { useLocation, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  getDeadEmailBrandLabel,
  getDeadEmailDisplayLeadId,
  type DeadMissingEmailRow,
} from "../_lib/data";

type DeadMissingEmailDrawerProps = {
  row: DeadMissingEmailRow | null;
  currentIndex: number;
  rowCount: number;
  onCancel: () => void;
  isClearing: boolean;
  onNavigate: (index: number) => void;
  onClear: (row: DeadMissingEmailRow) => void;
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
  isClearing,
  onNavigate,
  onClear,
}: DeadMissingEmailDrawerProps) {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const [copied, setCopied] = useState(false);

  const drawerUrl = useMemo(() => {
    if (!row || typeof window === "undefined") return "";

    const params = new URLSearchParams(searchParams.toString());
    params.set("lead", getDeadEmailDisplayLeadId(row));

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
      ["Lead ID", getDeadEmailDisplayLeadId(row)],
      ["Company", row.companyName ?? ""],
      ["Contact", row.fullName ?? ""],
      ["Email", row.email || "Missing"],
      ["Contact Type", row.contactType ?? ""],
      ["Lead Type", row.leadTypeSvg ?? ""],
      ["Lead Type Benton", row.leadTypeBenton ?? ""],
      ["Lead Type 95RM", row.leadType95rm ?? ""],
      [
        "Flagged Brands",
        row.missingDeadBrands.map(getDeadEmailBrandLabel).join(", "),
      ],
      ["Missing/Dead Email", row.missingDeadBrands.length > 0 ? "Yes" : "No"],
    ];

    printWindow.document.write(`
      <html>
        <head><title>${escapeHtml(getDeadEmailDisplayLeadId(row))} | Dead/Missing Email</title></head>
        <body style="font-family:Arial,sans-serif;padding:24px;color:#0f172a;">
          <h1>${escapeHtml(getDeadEmailDisplayLeadId(row))}</h1>
          <p style="margin-bottom:20px;color:#475569;">${escapeHtml(row.fullName ?? "-")} | ${escapeHtml(row.companyName ?? "-")}</p>
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
          title={row ? getDeadEmailDisplayLeadId(row) : ""}
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
            onClick={onCancel}
            className="cursor-pointer rounded border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          {row && (
            <button
              type="button"
              onClick={() => onClear(row)}
              disabled={isClearing}
              className="cursor-pointer rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              {isClearing ? "Clearing..." : "Clear Flag"}
            </button>
          )}
        </div>
      }
    >
      {row && (
        <div className="space-y-5">
          <DetailCard label="Lead">
            <DetailRow
              label="Lead ID"
              value={getDeadEmailDisplayLeadId(row)}
            />
            <DetailRow label="Company" value={row.companyName || "-"} />
            <DetailRow label="Contact" value={row.fullName || "-"} />
            <DetailRow
              label="Flagged"
              value={
                <BooleanCheckBadge checked={row.missingDeadBrands.length > 0} />
              }
            />
          </DetailCard>

          <DetailCard label="Email Review">
            <DetailRow
              label="Email"
              value={row.email ? <EmailLink value={row.email} /> : "Missing"}
            />
            <DetailRow
              label="Contact Type"
              value={
                row.contactType ? (
                  <TypeBadge value={row.contactType} kind="contact" />
                ) : (
                  "-"
                )
              }
            />
            <DetailRow
              label="Flagged Brands"
              value={
                <div className="flex flex-wrap justify-end gap-1.5">
                  {row.missingDeadBrands.map((brand) => (
                    <Badge key={brand}>{getDeadEmailBrandLabel(brand)}</Badge>
                  ))}
                </div>
              }
            />
          </DetailCard>

          <DetailCard label="Lead Types">
            <DetailRow
              label="Lead Type"
              value={
                row.leadTypeSvg ? (
                  <TypeBadge value={row.leadTypeSvg} kind="lead" />
                ) : (
                  "-"
                )
              }
            />
            <DetailRow
              label="Benton"
              value={
                row.leadTypeBenton ? (
                  <TypeBadge value={row.leadTypeBenton} kind="lead" />
                ) : (
                  "-"
                )
              }
            />
            <DetailRow
              label="95RM"
              value={
                row.leadType95rm ? (
                  <TypeBadge value={row.leadType95rm} kind="lead" />
                ) : (
                  "-"
                )
              }
            />
          </DetailCard>
        </div>
      )}
    </Drawer>
  );
}
