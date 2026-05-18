import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type CallHistoryEntry = {
  id: string;
  calledAt: string;
  userId: string | null;
  userName: string | null;
  resultCode: string | null;
  durationSeconds: number | null;
  notes: string | null;
};

export type CallHistoryByBrand = {
  svg: CallHistoryEntry[];
  "95rm": CallHistoryEntry[];
  benton: CallHistoryEntry[];
};

export type EmailBlocklistDirectoryRow = {
  leadId: string;
  leadIdExternal: string | null;
  companySymbol: string | null;
  companyName: string | null;
  fullName: string | null;
  email: string | null;
  contactType: string | null;
  leadTypeSvg: string | null;
  leadType95rm: string | null;
  leadTypeBenton: string | null;
  blacklistedBrands: string[];
  callHistory: CallHistoryByBrand;
};

type EmailBlacklistResponse = {
  ok: true;
  count: number;
  data: EmailBlocklistDirectoryRow[];
};

export function getEmailBlacklistDisplayLeadId(
  row: EmailBlocklistDirectoryRow,
): string {
  if (row.leadIdExternal && row.companySymbol) {
    return `${row.companySymbol}-${row.leadIdExternal}`;
  }

  return row.leadIdExternal || row.leadId;
}

export function getBrandLabel(brand: string): string {
  switch (brand.toLowerCase()) {
    case "svg":
      return "SVG";
    case "95rm":
      return "95RM";
    case "benton":
      return "Benton";
    default:
      return brand;
  }
}

export function useEmailBlacklistDirectory(limit: number) {
  return useQuery({
    queryKey: ["email-blacklist-directory", limit],
    queryFn: async () => {
      const json = (await api.get(
        `/email-blacklist?limit=${limit}`,
      )) as EmailBlacklistResponse;
      return json.data;
    },
    staleTime: 60_000,
  });
}
