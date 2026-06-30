import { useEffect, useMemo, useState } from "react";
import { getRowCompanySymbol } from "@/features/backoffice-shared/constants";
import {
  findCompanyPickerRow,
  parseCompanySymbolFromLabel,
  resolveCompanyFromDirectory,
  resolveCompanyTimezone,
  useCompanyBySymbol,
  useCompanyOptions,
  useDrawerCompanyNameSelectSource,
  type CompanyRow,
} from "@/features/companies/_lib/hooks";
import { resolveLeadTimezone } from "@/types/timezone.types";

type LeadCompanyContext = {
  companyName: string;
  companySymbol?: string | null;
  timezone?: string | null;
};

function buildLeadCompanyRow(context: LeadCompanyContext): CompanyRow | null {
  const name = context.companyName?.trim();
  if (!name) return null;

  const symbol = context.companySymbol?.trim() || null;

  return {
    id: "",
    symbol,
    name,
    label: symbol ? `${symbol} - ${name}` : name,
    timezone: context.timezone ?? null,
    country: null,
    description: null,
    estimatedMarketcap: null,
    city: null,
    state: null,
    zip: null,
    website: null,
    twitter: null,
    createdAt: null,
    updatedAt: null,
  };
}

function findCompanyForLead(
  row: LeadCompanyContext,
  companies: CompanyRow[],
): CompanyRow | undefined {
  const symbol = getRowCompanySymbol(row);
  if (symbol) {
    const normalizedSymbol = symbol.trim().toUpperCase();
    const bySymbol = companies.find(
      (company) =>
        company.symbol?.trim().toUpperCase() === normalizedSymbol ||
        parseCompanySymbolFromLabel(company.label ?? company.name ?? "")
          ?.trim()
          .toUpperCase() === normalizedSymbol,
    );
    if (bySymbol) return bySymbol;
  }

  if (row.companyName?.trim()) {
    const normalizedName = row.companyName.trim().toLowerCase();
    return companies.find((company) => {
      if (company.name?.trim().toLowerCase() === normalizedName) return true;
      if (company.label?.trim().toLowerCase() === normalizedName) return true;
      return false;
    });
  }

  return undefined;
}

function getLeadCompanyTimezone(
  lead: LeadCompanyContext,
  companies: CompanyRow[],
  activeCompany?: CompanyRow | null,
): string {
  const companyTimezone =
    resolveCompanyTimezone(activeCompany, companies) ||
    findCompanyForLead(lead, companies)?.timezone?.trim() ||
    "";

  return resolveLeadTimezone(lead.timezone, companyTimezone) ?? "";
}

type UseDrawerCompanySelectOptions = {
  drawerOpen: boolean;
  rowKey: string;
  companyName: string;
  initialCompanyName: string;
  rowCompanySymbol?: string | null;
  rowCompanyName?: string | null;
  rowTimezone?: string | null;
  onCompanyNameChange: (companyName: string) => void;
};

export function useDrawerCompanySelect({
  drawerOpen,
  rowKey,
  companyName,
  initialCompanyName,
  rowCompanySymbol,
  rowCompanyName,
  rowTimezone,
  onCompanyNameChange,
}: UseDrawerCompanySelectOptions) {
  const [pinnedCompanyOption, setPinnedCompanyOption] = useState<{
    label: string;
    value: string;
  } | null>(null);
  const [pinnedCompanyRow, setPinnedCompanyRow] = useState<CompanyRow | null>(
    null,
  );

  const companyChanged = companyName !== initialCompanyName;

  const extraCompanyOptions = useMemo(() => {
    const currentName = companyName?.trim();
    if (!currentName) return [];

    if (
      pinnedCompanyOption &&
      String(pinnedCompanyOption.value) === currentName
    ) {
      return [pinnedCompanyOption];
    }

    return [
      {
        value: currentName,
        label: rowCompanySymbol
          ? `${rowCompanySymbol} - ${currentName}`
          : currentName,
      },
    ];
  }, [companyName, pinnedCompanyOption, rowCompanySymbol]);

  const companySelectSource = useDrawerCompanyNameSelectSource(
    extraCompanyOptions,
    drawerOpen,
  );
  const { data: companyResult } = useCompanyOptions(1);
  const allCompanies = companyResult?.data ?? [];

  const companyOptions = useMemo(() => {
    const currentName = companyName?.trim();
    if (!currentName || !pinnedCompanyOption) {
      return companySelectSource.options;
    }

    if (String(pinnedCompanyOption.value) !== currentName) {
      return companySelectSource.options;
    }

    const exists = companySelectSource.options.some(
      (option) => String(option.value) === currentName,
    );

    if (exists) {
      return companySelectSource.options;
    }

    return [pinnedCompanyOption, ...companySelectSource.options];
  }, [companySelectSource.options, companyName, pinnedCompanyOption]);

  const loadedCompanyRows = useMemo(
    () => [
      ...companySelectSource.browseItems,
      ...companySelectSource.remoteItems,
    ],
    [companySelectSource.browseItems, companySelectSource.remoteItems],
  );

  const companyRows = useMemo(() => {
    let rows = [...loadedCompanyRows];

    if (!companyChanged) {
      const leadCompany = buildLeadCompanyRow({
        companyName: rowCompanyName ?? companyName,
        companySymbol: rowCompanySymbol,
        timezone: rowTimezone,
      });
      if (
        leadCompany &&
        !findCompanyPickerRow(leadCompany.name, leadCompany.symbol, rows)
      ) {
        rows = [leadCompany, ...rows];
      }
    }

    if (
      pinnedCompanyRow &&
      !findCompanyPickerRow(
        pinnedCompanyRow.name,
        pinnedCompanyRow.symbol,
        rows,
      )
    ) {
      rows = [pinnedCompanyRow, ...rows];
    }

    return rows;
  }, [
    companyChanged,
    companyName,
    loadedCompanyRows,
    pinnedCompanyRow,
    rowCompanyName,
    rowCompanySymbol,
    rowTimezone,
  ]);

  const selectedCompany = useMemo(() => {
    if (pinnedCompanyRow) {
      return pinnedCompanyRow;
    }

    return findCompanyPickerRow(
      companyName,
      getRowCompanySymbol({
        companySymbol: rowCompanySymbol,
        companyName: companyName || rowCompanyName,
      }),
      companyRows,
    );
  }, [
    companyName,
    companyRows,
    pinnedCompanyRow,
    rowCompanyName,
    rowCompanySymbol,
  ]);

  const activeCompanySymbol = useMemo(
    () =>
      getRowCompanySymbol({
        companySymbol:
          pinnedCompanyRow?.symbol ||
          selectedCompany?.symbol ||
          rowCompanySymbol,
        companyName: companyName || rowCompanyName || "",
      }),
    [
      companyName,
      pinnedCompanyRow?.symbol,
      rowCompanyName,
      rowCompanySymbol,
      selectedCompany?.symbol,
    ],
  );

  const { data: companyBySymbol } = useCompanyBySymbol(
    activeCompanySymbol,
    drawerOpen && Boolean(activeCompanySymbol.trim()),
  );

  const displayCompanySymbol = useMemo(() => {
    if (companyChanged) {
      return (
        selectedCompany?.symbol ||
        getRowCompanySymbol({
          companyName,
          companySymbol: "",
        })
      );
    }

    return getRowCompanySymbol({
      companySymbol: rowCompanySymbol,
      companyName: companyName || rowCompanyName,
    });
  }, [
    companyChanged,
    companyName,
    rowCompanyName,
    rowCompanySymbol,
    selectedCompany?.symbol,
  ]);

  const displayTimezone = useMemo(() => {
    const leadContext = {
      companyName: companyName || rowCompanyName || "",
      companySymbol: activeCompanySymbol,
      timezone: rowTimezone || "",
    };
    const lookupCompanies = [...companyRows, ...allCompanies];
    const activeCompany = pinnedCompanyRow ?? selectedCompany;

    return (
      companyBySymbol?.timezone?.trim() ||
      getLeadCompanyTimezone(leadContext, lookupCompanies, activeCompany)
    );
  }, [
    activeCompanySymbol,
    allCompanies,
    companyBySymbol?.timezone,
    companyName,
    companyRows,
    pinnedCompanyRow,
    rowCompanyName,
    rowTimezone,
    selectedCompany,
  ]);

  useEffect(() => {
    setPinnedCompanyOption(null);
    setPinnedCompanyRow(null);
    companySelectSource.onSearchChange("");
  }, [rowKey, companySelectSource.onSearchChange]);

  useEffect(() => {
    if (!pinnedCompanyOption || allCompanies.length === 0) return;

    const resolved = resolveCompanyFromDirectory(
      pinnedCompanyOption,
      pinnedCompanyRow ?? undefined,
      allCompanies,
    );

    if (!resolved?.timezone?.trim()) return;

    setPinnedCompanyRow((current) => {
      if (
        current?.id &&
        resolved.id &&
        current.id !== resolved.id &&
        current.timezone?.trim()
      ) {
        return current;
      }

      if (current?.timezone?.trim() === resolved.timezone?.trim()) {
        return current;
      }

      return resolved;
    });
  }, [allCompanies, pinnedCompanyOption, pinnedCompanyRow]);

  useEffect(() => {
    if (!companyBySymbol?.timezone?.trim()) return;

    setPinnedCompanyRow((current) => {
      if (
        current?.symbol &&
        companyBySymbol.symbol &&
        current.symbol.trim().toUpperCase() !==
          companyBySymbol.symbol.trim().toUpperCase()
      ) {
        return current;
      }

      if (current?.timezone?.trim() === companyBySymbol.timezone?.trim()) {
        return current;
      }

      return {
        ...(current ?? companyBySymbol),
        ...companyBySymbol,
      };
    });
  }, [companyBySymbol]);

  const handleCompanyChange = (value: string | number) => {
    const stringValue = String(value);
    const selectedOption = companyOptions.find(
      (option) => String(option.value) === stringValue,
    );
    const selectedSymbol =
      parseCompanySymbolFromLabel(selectedOption?.label ?? "") ??
      parseCompanySymbolFromLabel(stringValue) ??
      undefined;
    const selectedRow = findCompanyPickerRow(
      stringValue,
      selectedSymbol,
      loadedCompanyRows,
    );
    const resolvedRow =
      resolveCompanyFromDirectory(
        selectedOption,
        selectedRow,
        allCompanies,
      ) ?? selectedRow;

    if (selectedOption) {
      setPinnedCompanyOption(selectedOption);
    }
    if (resolvedRow) {
      setPinnedCompanyRow(resolvedRow);
    }

    onCompanyNameChange(stringValue);
  };

  return {
    companyOptions,
    companySelectSource,
    displayCompanySymbol,
    displayTimezone,
    handleCompanyChange,
  };
}
