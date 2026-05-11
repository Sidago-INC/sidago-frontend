export type { HotLeadRow as UnassignedHotLeadRow } from "@/features/backoffice-shared/types";
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

export const unassignedHotLeadsData: HotLeadRow[] = generateHotLeadRows(20);
