import { getLeadGridLabel } from "@/features/backoffice-shared/constants";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type DeadMissingEmailRow = {
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
  missingDeadBrands: string[];
};

type DeadEmailResponse = {
  ok: true;
  count: number;
  data: DeadMissingEmailRow[];
};

type ClearDeadEmailResponse = {
  ok: true;
  updated: number;
};

export function getDeadEmailDisplayLeadId(row: DeadMissingEmailRow): string {
  return getLeadGridLabel(row);
}

export function getDeadEmailBrandLabel(brand: string): string {
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

export function useDeadMissingEmails(limit: number) {
  return useQuery({
    queryKey: ["dead-missing-email", limit],
    queryFn: async () => {
      const json = (await api.get(
        `/dead-email?limit=${limit}`,
      )) as DeadEmailResponse;
      return json.data;
    },
    staleTime: 60_000,
  });
}

async function clearDeadMissingEmail(leadId: string) {
  return (await api.patch(
    `/dead-email/lead/${leadId}/clear`,
    {},
  )) as ClearDeadEmailResponse;
}

export function useClearDeadMissingEmail() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (leadId: string) => clearDeadMissingEmail(leadId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dead-missing-email"] });
    },
  });
}
