

import {
  Drawer,
  DrawerActionHeader,
  EditableDrawerFooter,
  Textarea,
  TextInput,
  TimezoneSelect,
} from "@/components/ui";
import { COMPANY } from "@/types/company.types";
import { AdditionalContactsList } from "@/features/backoffice-shared/AdditionalContactsList";
import { useLeadsByCompany } from "@/features/leads/_lib/hooks";
import { openPrintFrame } from "@/lib/print-html";
import type { TIMEZONE } from "@/types/timezone.types";
import { useEffect, useState } from "react";
import { CountryPicker } from "./CountryPicker";
import Revisions from "@/features/backoffice-shared/Revisions";

type CompanyDrawerMode = "create" | "edit";

type CompanyDrawerProps = {
  company: COMPANY;
  companyId: string | null;
  initialCompany: COMPANY;
  isOpen: boolean;
  mode: CompanyDrawerMode;
  currentIndex?: number;
  rowCount?: number;
  errors?: Partial<Record<keyof COMPANY, string>>;
  isSaving?: boolean;
  onCancel: () => void;
  onChange: (field: keyof COMPANY, value: string) => void;
  onNavigate?: (index: number) => void;
  onReset: () => void;
  onSave: () => void;
};

const inputClassName =
  "h-10 rounded border bg-white px-3 py-2 text-sm text-slate-700 transition focus:border-indigo-500 focus:outline-none dark:bg-gray-800 dark:text-slate-200 dark:focus:border-indigo-400";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function CompanyDrawer({
  company,
  companyId,
  initialCompany,
  isOpen,
  mode,
  currentIndex = -1,
  rowCount = 0,
  errors = {},
  isSaving = false,
  onCancel,
  onChange,
  onNavigate,
  onReset,
  onSave,
}: CompanyDrawerProps) {
  const [copied, setCopied] = useState(false);
  const [isEditMode, setIsEditMode] = useState(mode === "create");
  const title = mode === "create" ? "Create Company" : "Edit Company";
  const subtitle =
    mode === "create"
      ? "Add a company record"
      : `${initialCompany.name} (${initialCompany.symbol})`;
  const canNavigate = mode === "edit" && currentIndex >= 0 && rowCount > 0;

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  useEffect(() => {
    setIsEditMode(mode === "create");
  }, [companyId, isOpen, mode]);

  // Who is on file at this company: the leads themselves, and the extra
  // contacts from the additional_contacts table.
  const { data: companyLeadsData, isLoading: leadsLoading } = useLeadsByCompany(
    mode === "edit" && isOpen ? companyId : null,
  );
  const companyLeads = companyLeadsData ?? [];

  const handleCopyLink = async () => {
    if (typeof window === "undefined" || mode !== "edit") return;

    const url = new URL(window.location.href);
    url.searchParams.set("company", initialCompany.symbol);
    await navigator.clipboard.writeText(url.toString());
    setCopied(true);
  };

  const handlePrint = () => {
    if (typeof window === "undefined") return;

    const printWindow = openPrintFrame();
    if (!printWindow) return;

    const rows = Object.entries(company)
      .map(
        ([label, value]) => `
          <tr>
            <td style="width:38%;border:1px solid #cbd5e1;padding:10px;font-weight:600;background:#f8fafc;">
              ${escapeHtml(label)}
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
          <title>${escapeHtml(company.name || "Company")}</title>
        </head>
        <body style="font-family:Arial,sans-serif;padding:24px;color:#0f172a;">
          <h1>${escapeHtml(company.name || "Company")}</h1>
          <p style="margin-bottom:20px;color:#475569;">
            ${escapeHtml(company.symbol || "No symbol")}
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
      isOpen={isOpen}
      onClose={onCancel}
      direction="right"
      size="min(720px, 100vw)"
      header={
        <DrawerActionHeader
          title={title}
          subtitle={subtitle}
          copied={copied}
          canGoPrevious={canNavigate && currentIndex > 0}
          canGoNext={canNavigate && currentIndex < rowCount - 1}
          onPrevious={
            canNavigate && onNavigate
              ? () => onNavigate(currentIndex - 1)
              : undefined
          }
          onNext={
            canNavigate && onNavigate
              ? () => onNavigate(currentIndex + 1)
              : undefined
          }
          onPrint={handlePrint}
          onCopyLink={mode === "edit" ? handleCopyLink : undefined}
        />
      }
      footer={
        <div className="flex flex-col">
          {isEditMode ? (
            <EditableDrawerFooter
              onCancel={() => {
                setIsEditMode(mode === "create");
                onCancel();
              }}
              onReset={onReset}
              onSave={() => {
                onSave();
                if (mode === "edit") {
                  setIsEditMode(false);
                }
              }}
              saveLabel={isSaving ? "Saving..." : undefined}
              saveDisabled={isSaving}
            />
          ) : null}
          {mode === "edit" && companyId ? (
            <Revisions companyId={companyId} />
          ) : null}
        </div>
      }
    >
      <div className="space-y-6" onFocus={() => setIsEditMode(true)}>
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Company Symbol"
            value={company.symbol}
            onChange={(event) => onChange("symbol", event.target.value)}
            error={errors.symbol}
            required
            className={inputClassName}
          />
          <TextInput
            label="Company Name"
            value={company.name}
            onChange={(event) => onChange("name", event.target.value)}
            error={errors.name}
            required
            className={inputClassName}
          />
          <TimezoneSelect
            label="Time Zone"
            value={company.timezone}
            onChange={(value) => onChange("timezone", value as TIMEZONE)}
            error={errors.timezone}
            required
            className="h-10 rounded text-sm"
          />
          <CountryPicker
            value={company.country}
            onChange={(value) => onChange("country", value)}
            error={errors.country}
            required
          />
          <Textarea
            label="Description"
            value={company.description}
            onChange={(event) => onChange("description", event.target.value)}
            rows={4}
            error={errors.description}
            wrapperClassName="md:col-span-2"
            className="rounded border bg-white px-3 py-2 text-sm text-slate-700 transition focus:border-indigo-500 focus:outline-none dark:bg-gray-800 dark:text-slate-200 dark:focus:border-indigo-400"
          />
          <TextInput
            label="Estimated Market Cap"
            value={company.estimatedMarketCap}
            onChange={(event) =>
              onChange("estimatedMarketCap", event.target.value)
            }
            error={errors.estimatedMarketCap}
            className={inputClassName}
          />
          <TextInput
            label="City"
            value={company.city}
            onChange={(event) => onChange("city", event.target.value)}
            error={errors.city}
            className={inputClassName}
          />
          <TextInput
            label="State"
            value={company.state}
            onChange={(event) => onChange("state", event.target.value)}
            error={errors.state}
            className={inputClassName}
          />
          <TextInput
            label="Website"
            value={company.website}
            onChange={(event) => onChange("website", event.target.value)}
            error={errors.website}
            className={inputClassName}
          />
          <TextInput
            label="X (Twitter handle)"
            value={company.twitterHandle}
            onChange={(event) => onChange("twitterHandle", event.target.value)}
            error={errors.twitterHandle}
            className={inputClassName}
          />
          <TextInput
            label="Zip"
            value={company.zip}
            onChange={(event) => onChange("zip", event.target.value)}
            error={errors.zip}
            className={inputClassName}
          />
        </div>

        {mode === "edit" && companyId ? (
          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                Associated leads
                {companyLeads.length > 0 ? ` (${companyLeads.length})` : ""}
              </h3>

              {leadsLoading ? (
                <p className="text-xs text-slate-400">Loading leads…</p>
              ) : companyLeads.length === 0 ? (
                <p className="text-xs text-slate-400">
                  No leads are linked to this company.
                </p>
              ) : (
                <ul className="max-h-56 space-y-1.5 overflow-y-auto">
                  {companyLeads.map((lead) => (
                    <li
                      key={lead.id}
                      className="rounded border border-slate-200 px-2.5 py-1.5 dark:border-slate-700"
                    >
                      <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
                        {lead.fullName?.trim() || "Unnamed lead"}
                        {lead.notWorkAnymore ? (
                          <span className="ml-1 text-[10px] font-normal text-amber-600 dark:text-amber-400">
                            no longer there
                          </span>
                        ) : null}
                      </p>
                      {lead.role?.trim() ? (
                        <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                          {lead.role}
                        </p>
                      ) : null}
                      {lead.phone?.trim() ? (
                        <a
                          href={`tel:${lead.phone.replace(/\s+/g, "")}`}
                          onClick={(event) => event.stopPropagation()}
                          className="block truncate text-[11px] tabular-nums text-slate-600 hover:underline dark:text-slate-300"
                        >
                          {lead.phone}
                        </a>
                      ) : null}
                      {lead.email?.trim() ? (
                        <p className="truncate text-[11px] text-sky-600 dark:text-sky-400">
                          {lead.email}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                Additional contacts
              </h3>
              <AdditionalContactsList companyId={companyId} />
            </section>
          </div>
        ) : null}
      </div>
    </Drawer>
  );
}
