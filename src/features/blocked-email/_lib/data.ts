import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type BlockedEmailRow = {
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
  blockedBrands: string[];
};

type BlockedEmailResponse = {
  ok: true;
  count: number;
  data: BlockedEmailRow[];
};

type UnblockBlockedEmailResponse = {
  ok: true;
  updated: number;
};

export function getBlockedBrandLabel(brand: string): string {
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

export function useBlockedEmails(limit: number) {
  return useQuery({
    queryKey: ["blocked-email", limit],
    queryFn: async () => {
      const json = (await api.get(
        `/blocked-email?limit=${limit}`,
      )) as BlockedEmailResponse;
      return json.data;
    },
    staleTime: 60_000,
  });
}

async function unblockBlockedEmail(leadId: string) {
  return (await api.patch(
    `/blocked-email/lead/${leadId}/unblock`,
    {},
  )) as UnblockBlockedEmailResponse;
}

export function useUnblockBlockedEmail() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (leadId: string) => unblockBlockedEmail(leadId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blocked-email"] });
    },
  });
}
