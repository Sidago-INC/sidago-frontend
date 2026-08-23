import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  buildPaginationParams,
  DEFAULT_PAGE_SIZE,
  parsePaginatedResponse,
} from "@/lib/pagination";
import { usePaginatedSelectSource } from "@/lib/use-paginated-select-source";

// Picker shape used by the Add Lead form's Company dropdown — the only
// fields it needs to render a "<SYM> - <Name>" option.
export type CompanyPickerRow = {
  id: string;
  symbol: string | null;
  name: string | null;
  label: string;
};

// Full row used by the Companies directory + drawer. Mirrors what
// GET /api/companies returns for every column on the row.
export type CompanyRow = CompanyPickerRow & {
  timezone: string | null;
  country: string | null;
  description: string | null;
  estimatedMarketcap: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  website: string | null;
  twitter: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type CompaniesResponse = {
  ok: true;
  data: CompanyRow[];
  meta: {
    total_count: number;
    per_page: number;
    current_page: number;
    total_pages: number;
    groups?: { value: string; count: number }[];
  };
};

export type CompaniesGridQuery = {
  search?: string;
  filters?: string;
  sort?: string;
  groupBy?: string;
};

type RawCompanyRow = Record<string, unknown> & {
  id?: string;
  symbol?: string | null;
  name?: string | null;
  label?: string;
  timezone?: string | null;
  companyTimezone?: string | null;
  company_timezone?: string | null;
};

export function normalizeCompanyRow(raw: RawCompanyRow): CompanyRow {
  const name = (raw.name ?? raw.companyName ?? raw.company_name ?? null) as
    | string
    | null;
  const label =
    (raw.label as string | undefined) ||
    (raw.symbol && name
      ? `${raw.symbol} - ${name}`
      : name || (raw.symbol as string | undefined) || String(raw.id ?? ""));
  const symbol = ((raw.symbol ??
    raw.companySymbol ??
    raw.company_symbol ??
    parseCompanySymbolFromLabel(label) ??
    null) as string | null);

  return {
    id: String(raw.id ?? raw.companyId ?? raw.company_id ?? ""),
    symbol,
    name,
    label,
    timezone: (raw.timezone ??
      raw.companyTimezone ??
      raw.company_timezone ??
      null) as string | null,
    country: (raw.country ?? null) as string | null,
    description: (raw.description ?? null) as string | null,
    estimatedMarketcap: (raw.estimatedMarketcap ??
      raw.estimated_marketcap ??
      null) as string | null,
    city: (raw.city ?? null) as string | null,
    state: (raw.state ?? null) as string | null,
    zip: (raw.zip ?? null) as string | null,
    website: (raw.website ?? null) as string | null,
    twitter: (raw.twitter ?? null) as string | null,
    createdAt: (raw.createdAt ?? raw.created_at ?? null) as string | null,
    updatedAt: (raw.updatedAt ?? raw.updated_at ?? null) as string | null,
  };
}

function normalizeCompaniesResponse(data: unknown[]) {
  return data.map((row) => normalizeCompanyRow(row as RawCompanyRow));
}

const COMPANY_PAGE_SIZE = DEFAULT_PAGE_SIZE;
const COMPANY_SEARCH_LIMIT = 20;

export async function fetchCompaniesPage({
  limit = COMPANY_PAGE_SIZE,
  page = 1,
  search,
}: {
  limit?: number;
  page?: number;
  search?: string;
}) {
  const params = buildPaginationParams(page, limit);

  if (search?.trim()) {
    params.set("search", search.trim());
  }

  const json = (await api.get(`/companies?${params}`)) as CompaniesResponse;
  const parsed = parsePaginatedResponse<RawCompanyRow>(json);
  return {
    data: normalizeCompaniesResponse(parsed.data),
    meta: parsed.meta,
  };
}

export async function fetchCompaniesSearch({
  q,
  limit = COMPANY_SEARCH_LIMIT,
  page = 1,
}: {
  q: string;
  limit?: number;
  page?: number;
}) {
  const params = new URLSearchParams({
    q: q.trim(),
    limit: String(limit),
  });

  if (page > 1) {
    params.set("page", String(page));
  }

  const json = (await api.get(`/companies/search?${params}`)) as CompaniesResponse;
  const parsed = parsePaginatedResponse<RawCompanyRow>(json);
  return {
    data: normalizeCompaniesResponse(parsed.data),
    meta: parsed.meta,
  };
}

export function parseCompanySymbolFromLabel(label: string): string | null {
  const match = label.trim().match(/^([^-]+)\s-\s+/);
  return match?.[1]?.trim() || null;
}

export function resolveCompanyFromDirectory(
  option: { label: string; value: string } | null | undefined,
  searchRow: CompanyRow | undefined,
  companies: CompanyRow[],
): CompanyRow | undefined {
  const symbol =
    searchRow?.symbol?.trim() ||
    (option ? parseCompanySymbolFromLabel(option.label) : null);

  if (symbol) {
    const bySymbol = findCompanyBySymbol(symbol, companies);
    if (bySymbol) return bySymbol;
  }

  if (searchRow?.id) {
    const byId = companies.find((company) => company.id === searchRow.id);
    if (byId) return byId;
  }

  const byPicker = findCompanyPickerRow(
    option?.value ?? searchRow?.name,
    symbol ?? undefined,
    companies,
  );
  if (byPicker) return byPicker;

  return searchRow;
}

export function resolveCompanyTimezone(
  company: CompanyRow | null | undefined,
  companies: CompanyRow[] = [],
): string {
  if (!company) return "";

  const directTimezone = company.timezone?.trim();
  if (directTimezone) return directTimezone;

  if (company.symbol?.trim()) {
    const bySymbol = findCompanyBySymbol(company.symbol, companies);
    if (bySymbol?.timezone?.trim()) return bySymbol.timezone.trim();
  }

  if (company.id) {
    const byId = companies.find((row) => row.id === company.id);
    if (byId?.timezone?.trim()) return byId.timezone.trim();
  }

  const match = findCompanyPickerRow(company.name, company.symbol, companies);
  return match?.timezone?.trim() ?? "";
}

export function findCompanyBySymbol(
  symbol: string | null | undefined,
  companies: CompanyRow[],
): CompanyRow | undefined {
  if (!symbol?.trim()) return undefined;

  const normalizedSymbol = symbol.trim().toUpperCase();
  return companies.find((company) => {
    if (company.symbol?.trim().toUpperCase() === normalizedSymbol) {
      return true;
    }

    const labelSymbol = parseCompanySymbolFromLabel(
      company.label ?? company.name ?? "",
    );
    return labelSymbol?.trim().toUpperCase() === normalizedSymbol;
  });
}

export async function fetchCompanyBySymbol(
  symbol: string,
): Promise<CompanyRow | null> {
  if (!symbol.trim()) return null;

  const params = new URLSearchParams({
    q: symbol.trim(),
    limit: "20",
  });
  const json = (await api.get(`/companies/search?${params}`)) as CompaniesResponse;
  const parsed = parsePaginatedResponse<RawCompanyRow>(json);
  const searchRows = normalizeCompaniesResponse(parsed.data);
  const match = findCompanyBySymbol(symbol, searchRows);

  return match ?? null;
}

export function useCompanyBySymbol(
  symbol: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: ["companies", "by-symbol", symbol],
    enabled: enabled && Boolean(symbol?.trim()),
    queryFn: async () => {
      if (!symbol?.trim()) return null;
      return fetchCompanyBySymbol(symbol);
    },
    staleTime: 5 * 60_000,
  });
}

function buildCompanyNameSelectOptions(companies: CompanyPickerRow[]) {
  return buildCompanySelectOptions(companies);
}

function buildCompanyIdSelectOptions(companies: CompanyPickerRow[]) {
  return companies
    .map((company) => ({
      value: company.id,
      label: company.label || company.name || company.symbol || company.id,
    }))
    .filter((option) => option.value);
}

export function useCompanyNameSelectSource(
  extraOptions: CompanySelectOption[] = [],
  enabled = true,
) {
  return usePaginatedSelectSource({
    queryKeyPrefix: "companies",
    pageSize: COMPANY_PAGE_SIZE,
    searchPageSize: COMPANY_SEARCH_LIMIT,
    fetchPage: fetchCompaniesPage,
    fetchSearchPage: ({ limit, page, search }) =>
      fetchCompaniesSearch({ q: search, limit, page }),
    buildOptions: buildCompanyNameSelectOptions,
    extraOptions,
    enabled,
  });
}

export function useDrawerCompanyNameSelectSource(
  extraOptions: CompanySelectOption[] = [],
  enabled = true,
) {
  return usePaginatedSelectSource({
    queryKeyPrefix: "companies-drawer",
    pageSize: COMPANY_PAGE_SIZE,
    searchPageSize: COMPANY_SEARCH_LIMIT,
    fetchPage: fetchCompaniesPage,
    fetchSearchPage: ({ limit, page, search }) =>
      fetchCompaniesSearch({ q: search, limit, page }),
    buildOptions: buildCompanyNameSelectOptions,
    extraOptions,
    enabled,
  });
}

export function useCompanyIdSelectSource(
  extraOptions: Array<{ label: string; value: string }> = [],
  enabled = true,
) {
  return usePaginatedSelectSource({
    queryKeyPrefix: "companies",
    pageSize: COMPANY_PAGE_SIZE,
    searchPageSize: COMPANY_SEARCH_LIMIT,
    fetchPage: fetchCompaniesPage,
    fetchSearchPage: ({ limit, page, search }) =>
      fetchCompaniesSearch({ q: search, limit, page }),
    buildOptions: buildCompanyIdSelectOptions,
    extraOptions,
    enabled,
  });
}

// Companies list for picker dropdowns + the Companies directory. 5-min stale
// time matches the lead picker — the company roster doesn't churn during a
// working session.
export function useCompanyOptions(
  page: number,
  perPage = DEFAULT_PAGE_SIZE,
  grid: CompaniesGridQuery = {},
) {
  return useQuery({
    queryKey: ["companies", "picker", page, perPage, grid],
    queryFn: async () => {
      const params = buildPaginationParams(page, perPage, {
        ...(grid.search ? { search: grid.search } : {}),
        ...(grid.filters ? { filters: grid.filters } : {}),
        ...(grid.sort ? { sort: grid.sort } : {}),
        ...(grid.groupBy ? { groupBy: grid.groupBy } : {}),
      });
      const json = (await api.get(
        `/companies?${params.toString()}`,
      )) as CompaniesResponse;
      const parsed = parsePaginatedResponse<RawCompanyRow>(json);
      return {
        data: normalizeCompaniesResponse(parsed.data),
        meta: { ...parsed.meta, groups: json.meta.groups },
      };
    },
    // Grid data: hold the previous page on screen while the next one loads.
    // Without this the hook drops to isLoading/undefined between keystrokes and
    // the page unmounts itself, taking the search box with it.
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  });
}

// Patch one company. Body keys mirror the backend PATCH route exactly.
type CompanyPatchBody = Partial<{
  companySymbol: string;
  companyName: string;
  timezone: string;
  country: string;
  description: string;
  estimatedMarketcap: string;
  city: string;
  state: string;
  zip: string;
  website: string;
  twitter: string;
}>;

type CompanyPatchResponse = {
  ok: true;
  company: { id: string; symbol: string | null; name: string | null };
};

type CompanySelectOption = { label: string; value: string };

function normalizeCompanyText(value: string) {
  return value.trim().toLowerCase();
}

export function buildCompanySelectOptions(
  companies: CompanyPickerRow[],
): CompanySelectOption[] {
  return companies
    .map((company) => {
      const value = (company.name ?? company.label ?? "").trim();
      if (!value) return null;

      return {
        label: company.label || company.name || company.symbol || company.id,
        value,
      };
    })
    .filter((option): option is CompanySelectOption => option !== null);
}

export function resolveCompanySelectValue(
  companyName: string | null | undefined,
  companySymbol: string | null | undefined,
  companies: CompanyPickerRow[],
): string {
  const trimmedName = companyName?.trim() ?? "";
  const trimmedSymbol = companySymbol?.trim() ?? "";

  if (trimmedName) {
    const normalizedName = normalizeCompanyText(trimmedName);
    const byName = companies.find((company) => {
      if (company.name && normalizeCompanyText(company.name) === normalizedName) {
        return true;
      }

      if (company.label && normalizeCompanyText(company.label) === normalizedName) {
        return true;
      }

      return false;
    });

    if (byName?.name) return byName.name;
    if (byName?.label) return byName.label;
  }

  if (trimmedSymbol) {
    const normalizedSymbol = normalizeCompanyText(trimmedSymbol);
    const bySymbol = companies.find(
      (company) =>
        company.symbol &&
        normalizeCompanyText(company.symbol) === normalizedSymbol,
    );
    if (bySymbol?.name) return bySymbol.name;
    if (bySymbol?.label) return bySymbol.label;
  }

  return trimmedName;
}

export function findCompanyPickerRow(
  companyName: string | null | undefined,
  companySymbol: string | null | undefined,
  companies: CompanyRow[],
): CompanyRow | undefined {
  const resolvedName = resolveCompanySelectValue(
    companyName,
    companySymbol,
    companies,
  );

  if (resolvedName) {
    const normalizedResolved = normalizeCompanyText(resolvedName);
    const byName = companies.find((company) => {
      if (company.name && normalizeCompanyText(company.name) === normalizedResolved) {
        return true;
      }

      if (company.label && normalizeCompanyText(company.label) === normalizedResolved) {
        return true;
      }

      return false;
    });
    if (byName) return byName;
  }

  if (companySymbol?.trim()) {
    return findCompanyBySymbol(companySymbol, companies);
  }

  return undefined;
}

export function useUpdateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      companyId,
      body,
    }: {
      companyId: string;
      body: CompanyPatchBody;
    }) => {
      return (await api.patch(
        `/companies/${companyId}`,
        body,
      )) as CompanyPatchResponse;
    },
    // The Add Lead picker and Companies directory share the same cache key,
    // so a single invalidation refreshes both surfaces.
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["companies", "picker"] });
    },
  });
}
