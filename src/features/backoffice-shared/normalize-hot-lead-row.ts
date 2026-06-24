import type { HotLeadRow } from "@/features/backoffice-shared/types";
import { resolveLeadTimezone, stripTimezonePrefix } from "@/types/timezone.types";

type ApiHotLeadRow = HotLeadRow & {
  company_symbol?: string | null;
  company_timezone?: string | null;
  company?: {
    name?: string | null;
    symbol?: string | null;
    timezone?: string | null;
  } | null;
};

export function normalizeHotLeadRow(raw: ApiHotLeadRow): HotLeadRow {
  const companyName =
    raw.companyName?.trim() ||
    raw.company?.name?.trim() ||
    "";
  const companySymbol =
    raw.companySymbol?.trim() ||
    raw.company_symbol?.trim() ||
    raw.company?.symbol?.trim() ||
    "";
  const timezone =
    resolveLeadTimezone(
      raw.timezone ?? raw.company_timezone ?? raw.company?.timezone,
      raw.company?.timezone,
    ) ?? "";

  return {
    ...raw,
    companyName,
    companySymbol,
    timezone: timezone ? stripTimezonePrefix(timezone) : "",
  };
}
