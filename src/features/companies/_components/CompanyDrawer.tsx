

import {
  Drawer,
  DrawerActionHeader,
  EditableDrawerFooter,
  Select,
  Textarea,
  TextInput,
} from "@/components/ui";
import { COMPANY } from "@/types/company.types";
import { TIMEZONE_OPTIONS } from "@/types/timezone.types";
import { Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CountryPicker } from "./CountryPicker";
import { getStoredLeads, saveStoredLeads } from "@/features/leads/_lib/storage";
import type { LeadDirectoryRow } from "@/features/leads/_lib/data";

type CompanyDrawerMode = "create" | "edit";

type CompanyDrawerProps = {
  company: COMPANY;
  initialCompany: COMPANY;
  isOpen: boolean;
  mode: CompanyDrawerMode;
  currentIndex?: number;
  rowCount?: number;
  errors?: Partial<Record<keyof COMPANY, string>>;
  onCancel: () => void;
  onChange: (field: keyof COMPANY, value: string) => void;
  onNavigate?: (index: number) => void;
  onReset: () => void;
  onSave: () => void;
};

const inputClassName =
  "h-10 rounded border bg-white px-3 py-2 text-sm text-slate-700 transition focus:border-indigo-500 focus:outline-none dark:bg-gray-800 dark:text-slate-200 dark:focus:border-indigo-400";
const defaultHistoryLogs = `04/28/2026 - COMPANY PROFILE REVIEWED
04/25/2026 - PRIMARY MARKET DETAILS VERIFIED
04/18/2026 - COUNTRY AND REGIONAL DATA CONFIRMED`;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function stripTimezonePrefix(timezone: string) {
  return timezone.replace(/^\d+-/, "");
}

export function CompanyDrawer({
  company,
  initialCompany,
  isOpen,
  mode,
  currentIndex = -1,
  rowCount = 0,
  errors = {},
  onCancel,
  onChange,
  onNavigate,
  onReset,
  onSave,
}: CompanyDrawerProps) {
  const [copied, setCopied] = useState(false);
  const [selectedLeadEmail, setSelectedLeadEmail] = useState("");
  const [leadSnapshot, setLeadSnapshot] = useState<LeadDirectoryRow[]>(() =>
    getStoredLeads(),
  );
  const title = mode === "create" ? "Create Company" : "Edit Company";
  const subtitle =
    mode === "create"
      ? "Add a company record"
      : `${initialCompany.name} (${initialCompany.symbol})`;
  const canNavigate = mode === "edit" && currentIndex >= 0 && rowCount > 0;
  const persistedCompanyName = initialCompany.name;
  const historyLogs = useMemo(() => {
    const pendingCountryLog =
      company.country !== initialCompany.country
        ? `PENDING UPDATE - Country will change from ${initialCompany.country} to ${company.country} on save`
        : "";

    return [defaultHistoryLogs, pendingCountryLog].filter(Boolean).join("\n");
  }, [company.country, initialCompany.country]);
  const relatedLeads = useMemo<LeadDirectoryRow[]>(() => {
    if (!isOpen || mode !== "edit") {
      return [];
    }

    return leadSnapshot.filter(
      (lead) => lead.companyName === persistedCompanyName,
    );
  }, [isOpen, mode, persistedCompanyName, leadSnapshot]);
  const bindableLeadOptions = useMemo(() => {
    return leadSnapshot
      .filter((lead) => lead.companyName !== persistedCompanyName)
      .map((lead) => ({
        label: `${lead.fullName} · ${lead.email}`,
        value: lead.email,
      }));
  }, [persistedCompanyName, leadSnapshot]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopyLink = async () => {
    if (typeof window === "undefined" || mode !== "edit") return;

    const url = new URL(window.location.href);
    url.searchParams.set("company", initialCompany.symbol);
    await navigator.clipboard.writeText(url.toString());
    setCopied(true);
  };

  const handlePrint = () => {
    if (typeof window === "undefined") return;

    const printWindow = window.open("", "_blank", "width=900,height=700");
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

  const handleRemoveLead = (leadEmail: string) => {
    const nextLeads = getStoredLeads().map((lead) =>
      lead.email === leadEmail
        ? {
            ...lead,
            companyName: "Pending Assignment",
            timezone: "",
          }
        : lead,
    );
    saveStoredLeads(nextLeads);
    setLeadSnapshot(nextLeads);
  };

  const handleBindLead = () => {
    if (!selectedLeadEmail) {
      return;
    }

    const nextLeads = getStoredLeads().map((lead) =>
      lead.email === selectedLeadEmail
        ? {
            ...lead,
            companyName: persistedCompanyName,
            timezone: stripTimezonePrefix(company.timezone),
          }
        : lead,
    );

    saveStoredLeads(nextLeads);
    setLeadSnapshot(nextLeads);
    setSelectedLeadEmail("");
  };

  return (
    <>
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
          <EditableDrawerFooter
            onCancel={onCancel}
            onReset={onReset}
            onSave={onSave}
          />
        }
      >
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="Company Symbol"
              value={company.symbol}
              onChange={(event) => onChange("symbol", event.target.value)}
              error={errors.symbol}
              className={inputClassName}
            />
            <TextInput
              label="Company Name"
              value={company.name}
              onChange={(event) => onChange("name", event.target.value)}
              error={errors.name}
              className={inputClassName}
            />
            <Select
              label="Time Zone"
              value={company.timezone}
              onChange={(value) => onChange("timezone", String(value))}
              options={TIMEZONE_OPTIONS}
              error={errors.timezone}
              className="h-10 rounded text-sm"
            />
            <CountryPicker
              value={company.country}
              onChange={(value) => onChange("country", value)}
              error={errors.country}
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
              label="Primary Venue"
              value={company.primaryVenue}
              onChange={(event) => onChange("primaryVenue", event.target.value)}
              error={errors.primaryVenue}
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
              onChange={(event) =>
                onChange("twitterHandle", event.target.value)
              }
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

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/40">
            <div className="mb-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                history_logs
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Read-only log history for this company profile.
              </p>
            </div>
            <Textarea
              value={historyLogs}
              onChange={() => {}}
              rows={5}
              readOnly
              className="rounded border bg-slate-100 px-3 py-2 font-mono text-xs text-slate-600 focus:border-slate-300 focus:outline-none dark:bg-slate-900 dark:text-slate-300 dark:focus:border-slate-700"
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950/40">
            <div className="mb-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Related Leads
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Leads currently bound to {persistedCompanyName}.
                </p>
              </div>
            </div>

            <div className="mb-4 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <Select
                label="Bind Other Leads"
                value={selectedLeadEmail}
                onChange={(value) => setSelectedLeadEmail(String(value))}
                options={bindableLeadOptions}
                placeholder="Search and select a lead"
                searchable
                searchPlaceholder="Search leads"
              />
              <button
                type="button"
                onClick={handleBindLead}
                disabled={!selectedLeadEmail}
                className="inline-flex h-10 items-center justify-center rounded bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
              >
                Bind Lead
              </button>
            </div>

            {relatedLeads.length === 0 ? (
              <div className="rounded border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No leads are currently bound to this company.
              </div>
            ) : (
              <div className="space-y-3">
                {relatedLeads.map((lead) => (
                  <div
                    key={lead.email}
                    className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 dark:border-slate-700 md:flex-row md:items-start md:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {lead.fullName}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {lead.role || "No role"} · {lead.email}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {lead.phone || "No phone"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveLead(lead.email)}
                      className="inline-flex h-9 items-center gap-2 rounded border border-rose-200 px-3 text-sm font-medium text-rose-700 transition hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-300 dark:hover:bg-rose-950/30"
                    >
                      <Trash2 size={14} />
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Drawer>
    </>
  );
}
