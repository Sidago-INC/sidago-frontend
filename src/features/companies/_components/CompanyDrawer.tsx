

import {
  Drawer,
  DrawerActionHeader,
  EditableDrawerFooter,
  Textarea,
  TextInput,
  TimezoneSelect,
} from "@/components/ui";
import { COMPANY } from "@/types/company.types";
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
        isEditMode ? (
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
        ) : (
          <Revisions companyId={companyId ?? undefined} />
        )
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
      </div>
    </Drawer>
  );
}
