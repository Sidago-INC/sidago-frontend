export type { HotLeadRow as LeadRow } from "@/features/backoffice-shared/types";
export {
  leadOptions,
  contactTypeOptions,
  leadTypeOptions,
  timezoneOptions,
  getCompanySymbol,
  getCompanySymbolOptions,
  getLeadId,
  getLeadIdOptions,
  getRowCompanySymbol,
} from "@/features/backoffice-shared/constants";

import type { CompanyRow } from "@/features/companies/_lib/hooks";
import { findCompanyBySymbol } from "@/features/companies/_lib/hooks";
import type { HotLeadRow } from "@/features/backoffice-shared/types";
import { generateHotLeadRows } from "@/features/backoffice-shared/lead-mapper";
import { resolveLeadTimezone } from "@/types/timezone.types";
import { getRowCompanySymbol } from "@/features/backoffice-shared/constants";

export function findCompanyForLead(
  row: Pick<HotLeadRow, "companyName" | "companySymbol">,
  companies: CompanyRow[],
): CompanyRow | undefined {
  const symbol = getRowCompanySymbol(row);
  if (symbol) {
    const bySymbol = findCompanyBySymbol(symbol, companies);
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

export function getHotLeadTimezone(
  row: Pick<HotLeadRow, "companyName" | "companySymbol" | "timezone">,
  companies: CompanyRow[] = [],
): string {
  const company = findCompanyForLead(row, companies);
  return resolveLeadTimezone(row.timezone, company?.timezone) ?? "";
}

export const svgCurrentlyHotLeadsData: HotLeadRow[] = generateHotLeadRows(10);
export const bentonCurrentlyHotLeadsData: HotLeadRow[] =
  generateHotLeadRows(10);
export const rm95CurrentlyHotLeadsData: HotLeadRow[] = generateHotLeadRows(10);

export const currentlyHotLeadsDataByCompany = {
  SVG: svgCurrentlyHotLeadsData,
  Benton: bentonCurrentlyHotLeadsData,
  "95RM": rm95CurrentlyHotLeadsData,
} as const;
