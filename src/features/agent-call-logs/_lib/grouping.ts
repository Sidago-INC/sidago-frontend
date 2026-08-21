import type { QueueLead } from "@/features/agent-calls/_lib/apiTypes";
import { getCompanySymbol } from "@/features/backoffice-shared/constants";

// The sidebar tree is built from the server's bucket summary, not from the
// loaded rows. Grouping in the browser was only ever possible because the page
// fetched everything it displayed — which capped an agent at 500 leads of a
// single timezone. Rows now arrive one bucket at a time, so the tree has to be
// described before any of them exist.

export function getCallLogLeadLabel(lead: QueueLead): string {
  const rawSymbol =
    lead.companySymbol?.trim() || getCompanySymbol(lead.companyName);
  const symbolParts = rawSymbol.split(":").map((part) => part.trim()).filter(Boolean);
  const companySymbol =
    symbolParts.length > 1 ? symbolParts[symbolParts.length - 1]! : rawSymbol;
  const fullName = lead.fullName?.trim();

  if (companySymbol && fullName) {
    return `${companySymbol}-${fullName}`;
  }

  return fullName || companySymbol || lead.leadIdExternal || lead.leadId;
}

/** Label for a timezone bucket. "" is the real bucket for "no timezone". */
export function getTimezoneBucketLabel(timezone: string): string {
  return timezone || "—";
}

export function getCallLogPathKey(leadType: string, timezone: string) {
  return `${leadType}__${timezone}`;
}
