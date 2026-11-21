import type { QueueLead } from "@/features/agent-calls/_lib/apiTypes";
import { getLeadGridLabel } from "@/features/backoffice-shared/constants";

// The sidebar tree is built from the server's bucket summary, not from the
// loaded rows. Grouping in the browser was only ever possible because the page
// fetched everything it displayed — which capped an agent at 500 leads of a
// single timezone. Rows now arrive one bucket at a time, so the tree has to be
// described before any of them exist.

export function getCallLogLeadLabel(lead: QueueLead): string {
  // Deliberately the SHARED label, not a local variant.
  //
  // This used to split the symbol on ":" and keep only the last part, so
  // "TSX : ARL" rendered as "ARL-Winfield Ding" in the list while the detail
  // panel beside it — and All Leads, and every report — showed "TSX : ARL".
  // 8,256 of 16,004 companies carry an exchange prefix, so the two disagreed
  // for over half the data. Splitting also mangled the handful of symbols with
  // a colon inside the name itself.
  return getLeadGridLabel({
    companySymbol: lead.companySymbol,
    companyName: lead.companyName,
    fullName: lead.fullName,
    leadIdExternal: lead.leadIdExternal,
  });
}

/** Label for a timezone bucket. "" is the real bucket for "no timezone". */
export function getTimezoneBucketLabel(timezone: string): string {
  return timezone || "—";
}

export function getCallLogPathKey(leadType: string, timezone: string) {
  return `${leadType}__${timezone}`;
}
