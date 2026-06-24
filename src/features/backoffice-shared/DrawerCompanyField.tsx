import {
  CompanySymbolBadge,
  Select,
  TimezoneBadge,
} from "@/components/ui";
import type { useDrawerCompanyNameSelectSource } from "@/features/companies/_lib/hooks";

type CompanySelectSource = ReturnType<typeof useDrawerCompanyNameSelectSource>;

type DrawerCompanyFieldProps = {
  rowKey: string;
  badgeIndex: number;
  companyName: string;
  displayCompanySymbol: string;
  displayTimezone: string;
  companyOptions: Array<{ label: string; value: string | number }>;
  companySelectSource: CompanySelectSource;
  onCompanyChange: (value: string | number) => void;
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
}: DrawerCompanyFieldProps) {
  return (
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
      <TimezoneBadge timezone={displayTimezone} className="shrink-0" />
    </div>
  );
}
