import {
  CompanySymbolBadge,
  TextInput,
  TimezoneBadge,
  TimezoneSelect,
} from "@/components/ui";
import { CountryPicker } from "@/features/companies/_components/CountryPicker";

// Company symbol / name / timezone are columns on `companies`, not on the lead.
// Editing them here rewrites the company record, so every lead at that company
// moves with it — which is what "correct the ticker" or "fix the timezone"
// means. Only surfaces that pass `companyEdit` get the inputs; everywhere else
// the field stays the read-only badge + picker it has always been.
type CompanyEdit = {
  symbol: string;
  name: string;
  timezone: string;
  country: string;
  /** Leads at this company, for the "this affects N leads" hint. */
  leadCount?: number;
  onSymbolChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onTimezoneChange: (value: string) => void;
  onCountryChange: (value: string) => void;
};

type DrawerCompanyFieldProps = {
  badgeIndex: number;
  companyName: string;
  displayCompanySymbol: string;
  displayTimezone: string;
  companyEdit?: CompanyEdit;
};

// The searchable company picker that used to sit here is gone. It carried its
// own pinned state, updated by four effects and three queries that could
// settle in any order, which is why it lagged a lead behind the Next button,
// mishandled arrow keys, and left the previous lead's details on screen after
// a company change. Re-linking a lead to a different company is not something
// this panel needs to do; correcting the company's own symbol / name /
// timezone still is, and that is what `companyEdit` below provides.
export function DrawerCompanyField({
  badgeIndex,
  companyName,
  displayCompanySymbol,
  displayTimezone,
  companyEdit,
}: DrawerCompanyFieldProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-end gap-3">
        <CompanySymbolBadge
          symbol={displayCompanySymbol}
          index={badgeIndex}
          className="rounded"
          maxWidth="7.5rem"
        />
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[10px] uppercase tracking-widest text-slate-400">
            Company
          </p>
          <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
            {companyName || "—"}
          </p>
        </div>
        {companyEdit ? null : (
          <TimezoneBadge timezone={displayTimezone} className="shrink-0" />
        )}
      </div>

      {companyEdit ? (
        <div className="space-y-2 rounded border border-slate-200 bg-white/60 p-3 dark:border-slate-700 dark:bg-slate-950/40">
          <p className="text-[10px] uppercase tracking-widest text-slate-400">
            Company details
          </p>

          <CompanyEditRow label="Symbol">
            <TextInput
              value={companyEdit.symbol}
              onChange={(event) => companyEdit.onSymbolChange(event.target.value)}
              className="text-xs font-semibold"
            />
          </CompanyEditRow>

          <CompanyEditRow label="Name">
            <TextInput
              value={companyEdit.name}
              onChange={(event) => companyEdit.onNameChange(event.target.value)}
              className="text-xs font-semibold"
            />
          </CompanyEditRow>

          <CompanyEditRow label="Time Zone">
            <TimezoneSelect
              value={companyEdit.timezone}
              onChange={(value) => companyEdit.onTimezoneChange(value)}
              className="py-1.5 text-xs"
            />
          </CompanyEditRow>

          <CompanyEditRow label="Country">
            {/* Lives on `companies`, like symbol / name / timezone. The stored
                values are inconsistent ("USA" vs "United States", "CANADA" vs
                "Canada"), so this is a picker rather than free text — editing a
                company now normalises it. */}
            <CountryPicker
              value={companyEdit.country}
              onChange={(value: string) => companyEdit.onCountryChange(value)}
            />
          </CompanyEditRow>

          <p className="pt-1 text-[10px] leading-relaxed text-amber-600 dark:text-amber-400">
            Saving these rewrites the company record — the change applies to
            {companyEdit.leadCount && companyEdit.leadCount > 1
              ? ` all ${companyEdit.leadCount} leads`
              : " every lead"}{" "}
            at this company, not just this one.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function CompanyEditRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <p className="shrink-0 text-[10px] uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <div className="w-64 max-w-[65%]">{children}</div>
    </div>
  );
}
