

import { CompanySymbolBadge, Table, TimezoneBadge } from "@/components/ui";
import { type Column } from "@/components/ui/Table";
import { showSuccessToast } from "@/lib/toast";
import { validateForm } from "@/lib/validation";
import { companyValidationSchema } from "@/lib/validation/company";
import { COUNTRY_OPTIONS } from "@/types/country.types";
import { COMPANY_VALUES, type COMPANY } from "@/types/company.types";
import { TIMEZONE_OPTIONS } from "@/types/timezone.types";
import { useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { CompanyDrawer } from "./CompanyDrawer";
import { getStoredCompanies, saveStoredCompanies } from "../_lib/storage";
import { getStoredLeads, saveStoredLeads } from "@/features/leads/_lib/storage";

type DrawerState = {
  isOpen: boolean;
  originalSymbol: string | null;
  initialCompany: COMPANY;
  draft: COMPANY;
  errors: Partial<Record<keyof COMPANY, string>>;
};

function normalizeSymbol(value: string) {
  return value.trim().toUpperCase();
}

function normalizeCompany(company: COMPANY): COMPANY {
  return {
    ...company,
    symbol: normalizeSymbol(company.symbol),
    name: company.name.trim(),
    website: company.website.trim(),
    twitterHandle: company.twitterHandle.trim(),
    zip: company.zip.trim(),
    description: company.description.trim(),
    estimatedMarketCap: company.estimatedMarketCap.trim(),
    primaryVenue: company.primaryVenue.trim(),
    city: company.city.trim(),
    state: company.state.trim(),
  };
}

function getFallbackCompany() {
  return COMPANY_VALUES[0];
}

export function Companies() {
  const [searchParams] = useSearchParams();
  const [companies, setCompanies] = useState<COMPANY[]>(() =>
    getStoredCompanies(),
  );
  const [drawerState, setDrawerState] = useState<DrawerState>(() => ({
    isOpen: false,
    originalSymbol: null,
    initialCompany: getFallbackCompany(),
    draft: getFallbackCompany(),
    errors: {},
  }));

  useEffect(() => {
    const companyParam = searchParams.get("company");

    if (!companyParam) {
      return;
    }

    const company = companies.find(
      (item) => item.symbol.toLowerCase() === companyParam.toLowerCase(),
    );

    if (!company) {
      return;
    }

    const timer = window.setTimeout(() => {
      setDrawerState({
        isOpen: true,
        originalSymbol: company.symbol,
        initialCompany: { ...company },
        draft: { ...company },
        errors: {},
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [companies, searchParams]);

  const columns = useMemo<Column<COMPANY>[]>(
    () => [
      {
        title: "Company Symbol",
        key: "symbol",
        render: (row) => (
          <CompanySymbolBadge
            symbol={row.symbol}
            index={companies.findIndex(
              (company) => company.symbol === row.symbol,
            )}
          />
        ),
      },
      { title: "Company Name", key: "name" },
      {
        title: "Time Zone",
        key: "timezone",
        type: "select",
        options: TIMEZONE_OPTIONS,
        render: (row) => (
          <TimezoneBadge
            timezone={row.timezone}
            index={companies.findIndex(
              (company) => company.symbol === row.symbol,
            )}
          />
        ),
      },
      {
        title: "Country",
        key: "country",
        type: "select",
        options: COUNTRY_OPTIONS,
      },
      { title: "Description", key: "description" },
      { title: "Estimated Market Cap", key: "estimatedMarketCap" },
      { title: "Primary Venue", key: "primaryVenue" },
      { title: "City", key: "city" },
      { title: "State", key: "state" },
      {
        title: "Website",
        key: "website",
        render: (row) =>
          row.website ? (
            <a
              href={row.website}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-sky-700 hover:text-sky-900 dark:text-sky-300 dark:hover:text-sky-200"
              onClick={(event) => event.stopPropagation()}
            >
              {row.website}
            </a>
          ) : (
            ""
          ),
      },
      { title: "X (Twitter handle)", key: "twitterHandle" },
      { title: "Zip", key: "zip" },
    ],
    [companies],
  );

  const openEditDrawer = (company: COMPANY) => {
    const nextCompany = { ...company };

    setDrawerState({
      isOpen: true,
      originalSymbol: company.symbol,
      initialCompany: nextCompany,
      draft: nextCompany,
      errors: {},
    });
  };

  const openEditDrawerAtIndex = (index: number) => {
    const company = companies[index];
    if (!company) return;
    openEditDrawer(company);
  };

  const closeDrawer = () => {
    setDrawerState((current) => ({ ...current, isOpen: false }));
  };

  const updateDraft = (field: keyof COMPANY, value: string) => {
    setDrawerState((current) => ({
      ...current,
      draft: {
        ...current.draft,
        [field]: value,
      },
      errors: {
        ...current.errors,
        [field]: undefined,
      },
    }));
  };

  const resetDraft = () => {
    setDrawerState((current) => ({
      ...current,
      draft: { ...current.initialCompany },
      errors: {},
    }));
  };

  const saveCompany = () => {
    const nextCompany = normalizeCompany(drawerState.draft);
    const errors = validateForm(nextCompany, companyValidationSchema);
    const duplicateSymbol = companies.some(
      (company) =>
        company.symbol === nextCompany.symbol &&
        company.symbol !== drawerState.originalSymbol,
    );

    if (duplicateSymbol) {
      errors.symbol = "A company with this symbol already exists.";
    }

    if (Object.keys(errors).length > 0) {
      setDrawerState((current) => ({ ...current, errors }));
      return;
    }

    setCompanies((current) => {
      const nextCompanies = current.map((company) =>
        company.symbol === drawerState.originalSymbol ? nextCompany : company,
      );
      saveStoredCompanies(nextCompanies);
      return nextCompanies;
    });
    if (drawerState.initialCompany.name !== nextCompany.name) {
      const nextTimezone = nextCompany.timezone.replace(/^\d+-/, "");
      const nextLeads = getStoredLeads().map((lead) =>
        lead.companyName === drawerState.initialCompany.name
          ? {
              ...lead,
              companyName: nextCompany.name,
              timezone: nextTimezone,
            }
          : lead,
      );
      saveStoredLeads(nextLeads);
    }

    showSuccessToast("Company updated successfully.");
    setDrawerState((current) => ({
      ...current,
      originalSymbol: nextCompany.symbol,
      initialCompany: nextCompany,
      draft: nextCompany,
      errors: {},
    }));
  };

  return (
    <div className="space-y-4">
      <Table
        data={companies}
        columns={columns}
        title="Companies"
        description="Company market and contact profile"
        onRowClick={openEditDrawer}
      />

      <CompanyDrawer
        company={drawerState.draft}
        initialCompany={drawerState.initialCompany}
        isOpen={drawerState.isOpen}
        mode="edit"
        currentIndex={companies.findIndex(
          (company) => company.symbol === drawerState.originalSymbol,
        )}
        rowCount={companies.length}
        errors={drawerState.errors}
        onCancel={closeDrawer}
        onChange={updateDraft}
        onNavigate={openEditDrawerAtIndex}
        onReset={resetDraft}
        onSave={saveCompany}
      />
    </div>
  );
}
