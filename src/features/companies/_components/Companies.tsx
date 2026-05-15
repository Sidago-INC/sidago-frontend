

import { CompanySymbolBadge, Table, TimezoneBadge } from "@/components/ui";
import { type Column } from "@/components/ui/Table";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { validateForm } from "@/lib/validation";
import { companyValidationSchema } from "@/lib/validation/company";
import { COUNTRY_OPTIONS, type COUNTRY } from "@/types/country.types";
import { type COMPANY } from "@/types/company.types";
import { TIMEZONE_OPTIONS, type TIMEZONE } from "@/types/timezone.types";
import { useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { CompanyDrawer } from "./CompanyDrawer";
import {
  useCompanyOptions,
  useUpdateCompany,
  type CompanyRow,
} from "../_lib/hooks";

type DrawerState = {
  isOpen: boolean;
  originalCompanyId: string | null;
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

// Map the DB row → the COMPANY shape the existing drawer was built around so
// we don't have to rewrite the drawer's field layout. Numeric marketcap from
// Postgres comes through as a string already (drizzle's `numeric` mode).
//
// `timezone` and `country` are declared as narrow string unions on COMPANY
// even though the DB stores plain varchar — we cast at this boundary so
// existing typed consumers (Select options, etc.) keep their inference.
// Anything in the DB that isn't a known union member flows through as text
// and the dropdowns simply show no current selection until the user picks
// one of the canonical values.
function dbRowToCompany(row: CompanyRow): COMPANY {
  return {
    symbol: row.symbol ?? "",
    name: row.name ?? "",
    timezone: (row.timezone ?? "") as TIMEZONE,
    country: (row.country ?? "") as COUNTRY,
    description: row.description ?? "",
    estimatedMarketCap: row.estimatedMarketcap ?? "",
    primaryVenue: "",
    city: row.city ?? "",
    state: row.state ?? "",
    website: row.website ?? "",
    twitterHandle: row.twitter ?? "",
    zip: row.zip ?? "",
  };
}

const EMPTY_COMPANY: COMPANY = {
  symbol: "",
  name: "",
  timezone: "" as TIMEZONE,
  country: "" as COUNTRY,
  description: "",
  estimatedMarketCap: "",
  primaryVenue: "",
  city: "",
  state: "",
  website: "",
  twitterHandle: "",
  zip: "",
};

export function Companies() {
  const [searchParams] = useSearchParams();
  const { data: rows, isLoading } = useCompanyOptions();
  const updateCompany = useUpdateCompany();

  const [drawerState, setDrawerState] = useState<DrawerState>({
    isOpen: false,
    originalCompanyId: null,
    originalSymbol: null,
    initialCompany: EMPTY_COMPANY,
    draft: EMPTY_COMPANY,
    errors: {},
  });

  const companies = useMemo(() => rows ?? [], [rows]);

  // ?company=<symbol> deep-link opens that company's drawer once data lands.
  useEffect(() => {
    const companyParam = searchParams.get("company");
    if (!companyParam) return;

    const match = companies.find(
      (row) => (row.symbol ?? "").toLowerCase() === companyParam.toLowerCase(),
    );
    if (!match) return;

    const company = dbRowToCompany(match);
    const timer = window.setTimeout(() => {
      setDrawerState({
        isOpen: true,
        originalCompanyId: match.id,
        originalSymbol: match.symbol,
        initialCompany: { ...company },
        draft: { ...company },
        errors: {},
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [companies, searchParams]);

  const columns = useMemo<Column<CompanyRow>[]>(
    () => [
      {
        title: "Company Symbol",
        key: "symbol",
        render: (row) => (
          <CompanySymbolBadge
            symbol={row.symbol ?? ""}
            index={companies.findIndex((company) => company.id === row.id)}
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
            timezone={row.timezone ?? ""}
            index={companies.findIndex((company) => company.id === row.id)}
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
      { title: "Estimated Market Cap", key: "estimatedMarketcap" },
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
      { title: "X (Twitter handle)", key: "twitter" },
      { title: "Zip", key: "zip" },
    ],
    [companies],
  );

  const openEditDrawer = (row: CompanyRow) => {
    const company = dbRowToCompany(row);
    setDrawerState({
      isOpen: true,
      originalCompanyId: row.id,
      originalSymbol: row.symbol,
      initialCompany: company,
      draft: company,
      errors: {},
    });
  };

  const openEditDrawerAtIndex = (index: number) => {
    const row = companies[index];
    if (!row) return;
    openEditDrawer(row);
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

  const saveCompany = async () => {
    if (!drawerState.originalCompanyId) return;

    const nextCompany = normalizeCompany(drawerState.draft);
    const errors = validateForm(nextCompany, companyValidationSchema);

    // Guard duplicate-symbol case client-side so the user gets immediate
    // feedback. The backend re-checks too (it's the authoritative guard).
    const duplicateSymbol = companies.some(
      (row) =>
        row.id !== drawerState.originalCompanyId &&
        (row.symbol ?? "").toUpperCase() === nextCompany.symbol,
    );
    if (duplicateSymbol) {
      errors.symbol = "A company with this symbol already exists.";
    }

    if (Object.keys(errors).length > 0) {
      setDrawerState((current) => ({ ...current, errors }));
      return;
    }

    try {
      await updateCompany.mutateAsync({
        companyId: drawerState.originalCompanyId,
        body: {
          companySymbol: nextCompany.symbol,
          companyName: nextCompany.name,
          timezone: nextCompany.timezone,
          country: nextCompany.country,
          description: nextCompany.description,
          estimatedMarketcap: nextCompany.estimatedMarketCap,
          city: nextCompany.city,
          state: nextCompany.state,
          zip: nextCompany.zip,
          website: nextCompany.website,
          twitter: nextCompany.twitterHandle,
        },
      });

      showSuccessToast("Company updated.");
      setDrawerState((current) => ({
        ...current,
        originalSymbol: nextCompany.symbol,
        initialCompany: nextCompany,
        draft: nextCompany,
        errors: {},
      }));
    } catch (err) {
      showErrorToast(err);
    }
  };

  const currentIndex = drawerState.originalCompanyId
    ? companies.findIndex(
        (company) => company.id === drawerState.originalCompanyId,
      )
    : -1;

  return (
    <div className="space-y-4">
      <Table
        data={companies}
        columns={columns}
        title="Companies"
        description="Company market and contact profile"
        isLoading={isLoading}
        onRowClick={openEditDrawer}
      />

      <CompanyDrawer
        company={drawerState.draft}
        initialCompany={drawerState.initialCompany}
        isOpen={drawerState.isOpen}
        mode="edit"
        currentIndex={currentIndex}
        rowCount={companies.length}
        errors={drawerState.errors}
        isSaving={updateCompany.isPending}
        onCancel={closeDrawer}
        onChange={updateDraft}
        onNavigate={openEditDrawerAtIndex}
        onReset={resetDraft}
        onSave={saveCompany}
      />
    </div>
  );
}
