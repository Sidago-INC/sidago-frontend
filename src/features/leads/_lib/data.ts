import {
  assigneeOptions,
  contactTypeOptions,
  getCompanySymbol,
  getCompanySymbolOptions,
  getLeadId,
  getLeadIdOptions,
  timezoneOptions,
} from "@/features/backoffice-shared/constants";
import type { HotLeadRow } from "@/features/backoffice-shared/types";
import { generateHotLeadRows } from "@/features/backoffice-shared/lead-mapper";
import { LEAD_TYPE_OPTIONS } from "@/types/lead-type.types";

export type LeadDirectoryRow = HotLeadRow & {
  firstName: string;
  lastName: string;
  phoneExtension: string;
};

function splitName(fullName: string) {
  const [firstName = "", ...rest] = fullName.trim().split(/\s+/);
  return {
    firstName,
    lastName: rest.join(" "),
  };
}

export function createLeadDirectoryRow(
  row: HotLeadRow,
  overrides?: Partial<LeadDirectoryRow>,
): LeadDirectoryRow {
  const { firstName, lastName } = splitName(
    overrides?.fullName ?? row.fullName ?? "",
  );

  return {
    ...row,
    firstName,
    lastName,
    phoneExtension: "",
    ...overrides,
  };
}

export const leadsData: LeadDirectoryRow[] = generateHotLeadRows(18).map(
  (row) => createLeadDirectoryRow(row),
);

export {
  assigneeOptions,
  contactTypeOptions,
  getCompanySymbol,
  getCompanySymbolOptions,
  getLeadId,
  getLeadIdOptions,
  timezoneOptions,
};

export const leadTypeOptions = LEAD_TYPE_OPTIONS;
