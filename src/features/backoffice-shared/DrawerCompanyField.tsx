import {
  CompanySymbolBadge,
  Select,
  TextInput,
  TimezoneBadge,
  TimezoneSelect,
} from "@/components/ui";
import type { useDrawerCompanyNameSelectSource } from "@/features/companies/_lib/hooks";

type CompanySelectSource = ReturnType<typeof useDrawerCompanyNameSelectSource>;

// Company symbol / name / timezone are columns on `companies`, not on the lead.
// Editing them here rewrites the company record, so every lead at that company
// moves with it — which is what "correct the ticker" or "fix the timezone"
// means. Only surfaces that pass `companyEdit` get the inputs; everywhere else
// the field stays the read-only badge + picker it has always been.
type CompanyEdit = {
  symbol: string;
  name: string;
  timezone: string;
  /** Leads at this company, for the "this affects N leads" hint. */
  leadCount?: number;
  onSymbolChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onTimezoneChange: (value: string) => void;
};

type DrawerCompanyFieldProps = {
  rowKey: string;
  badgeIndex: number;
  companyName: string;
  displayCompanySymbol: string;
  displayTimezone: string;
  companyOptions: Array<{ label: string; value: string | number }>;
  companySelectSource: CompanySelectSource;
  onCompanyChange: (value: string | number) => void;
  companyEdit?: CompanyEdit;
};

export function DrawerCompanyField({
  rowKey,
  badgeIndex,
  companyName,
  displayCompanySymbol,
  displayTimezone,
  companyOptions,
  companySelectSource,
  onCompanyChange,
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
          <Select
            key={rowKey}
            value={companyName}
            onChange={onCompanyChange}
            options={companyOptions}
            placeholder={
              companySelectSource.isLoading &&
              companySelectSource.options.length === 0
                ? "Loading companies..."
                : "Select company"
            }
            disabled={
              companySelectSource.isLoading &&
              companySelectSource.options.length === 0
            }
            searchable
            searchPlaceholder="Search company"
            searchValue={companySelectSource.searchInput}
            onSearchChange={companySelectSource.onSearchChange}
            filterOptionsLocally={false}
            onLoadMore={companySelectSource.onLoadMore}
            hasMore={companySelectSource.hasMore}
            isLoadingMore={companySelectSource.isLoadingMore}
            isSearching={companySelectSource.isSearching}
            optionsClassName="z-[500] !w-[min(26rem,calc(100vw-2rem))] max-h-72 shadow-xl dark:border-slate-700 dark:bg-slate-950"
            className="w-full py-1.5 text-xs"
          />
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
