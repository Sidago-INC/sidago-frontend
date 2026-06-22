import type { QueueLead } from "@/features/agent-calls/_lib/apiTypes";
import { getCompanySymbol } from "@/features/backoffice-shared/constants";

export type CallLogLeadGroup = {
  leadType: string;
  timezones: Array<{
    timezone: string;
    leads: QueueLead[];
  }>;
};

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

export function matchesCallLogSearch(lead: QueueLead, query: string): boolean {
  if (!query.trim()) {
    return true;
  }

  const normalizedQuery = query.trim().toLowerCase();

  return [
    getCallLogLeadLabel(lead),
    lead.fullName,
    lead.companyName,
    lead.email,
    lead.phone,
    lead.leadType,
    lead.timezone,
  ]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(normalizedQuery));
}

export function flattenCallsLogLeads(data: {
  hot: QueueLead[];
  general: QueueLead[];
}): QueueLead[] {
  return [...data.hot, ...data.general];
}

export function buildCallLogGroups(leads: QueueLead[]): CallLogLeadGroup[] {
  const leadTypeMap = new Map<string, Map<string, QueueLead[]>>();

  for (const lead of leads) {
    const leadType = lead.leadType || "Uncategorized";
    const timezone = lead.timezone || "Unknown";

    if (!leadTypeMap.has(leadType)) {
      leadTypeMap.set(leadType, new Map());
    }

    const timezoneMap = leadTypeMap.get(leadType)!;

    if (!timezoneMap.has(timezone)) {
      timezoneMap.set(timezone, []);
    }

    timezoneMap.get(timezone)!.push(lead);
  }

  return Array.from(leadTypeMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([leadType, timezoneMap]) => ({
      leadType,
      timezones: Array.from(timezoneMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([timezone, groupedLeads]) => ({
          timezone,
          leads: [...groupedLeads].sort((a, b) =>
            getCallLogLeadLabel(a).localeCompare(getCallLogLeadLabel(b)),
          ),
        })),
    }));
}

export function getCallLogPathKey(leadType: string, timezone: string) {
  return `${leadType}__${timezone}`;
}
