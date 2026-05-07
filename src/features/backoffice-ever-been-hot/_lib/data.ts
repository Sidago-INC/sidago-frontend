export type { HotLeadRow as EverBeenHotRow } from "@/features/backoffice-shared/types";
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

export const everBeenHotSvgData: HotLeadRow[] = generateHotLeadRows(10);
export const everBeenHot95rmData: HotLeadRow[] = generateHotLeadRows(10);
export const everBeenHotBentonData: HotLeadRow[] = generateHotLeadRows(10);
