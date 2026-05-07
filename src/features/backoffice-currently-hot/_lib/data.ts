export type { HotLeadRow as LeadRow } from "@/features/backoffice-shared/types";
export {
  leadOptions,
  contactTypeOptions,
  leadTypeOptions,
  assigneeOptions,
  timezoneOptions,
  getCompanySymbol,
  getCompanySymbolOptions,
  getLeadId,
  getLeadIdOptions,
} from "@/features/backoffice-shared/constants";

import type { HotLeadRow } from "@/features/backoffice-shared/types";
import { generateHotLeadRows } from "@/features/backoffice-shared/lead-mapper";

export const svgCurrentlyHotLeadsData: HotLeadRow[] = generateHotLeadRows(10);
export const bentonCurrentlyHotLeadsData: HotLeadRow[] = generateHotLeadRows(10);
export const rm95CurrentlyHotLeadsData: HotLeadRow[] = generateHotLeadRows(10);

export const currentlyHotLeadsDataByCompany = {
  SVG: svgCurrentlyHotLeadsData,
  Benton: bentonCurrentlyHotLeadsData,
  "95RM": rm95CurrentlyHotLeadsData,
} as const;
