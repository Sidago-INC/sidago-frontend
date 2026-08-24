import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type CreateAdditionalContactBody = {
  firstName: string;
  lastName: string;
  fullName?: string;
  role?: string;
  email: string;
  companyId: string;
};

type CreateAdditionalContactResponse = {
  ok: true;
  id: string;
  createdAt: string;
  companyId: string;
  companySymbol: string | null;
  companyName: string | null;
};

export function useCreateAdditionalContact() {
  return useMutation({
    mutationFn: async (body: CreateAdditionalContactBody) =>
      (await api.post(
        "/additional-contacts",
        body,
      )) as CreateAdditionalContactResponse,
  });
}

export type AdditionalContactRow = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  /**
   * The API returns `name` (the column on additional_contacts), not
   * `fullName`. This type used to claim `fullName`, which is simply absent on
   * the wire — nothing had ever rendered the response, so nothing caught it.
   */
  name: string | null;
  email: string | null;
  role: string | null;
  createdAt: string;
};

type AdditionalContactsListResponse = {
  ok: true;
  count: number;
  data: AdditionalContactRow[];
};

export function useAdditionalContactsByCompany(companyId: string | null) {
  return useQuery({
    queryKey: ["additional-contacts", companyId],
    enabled: Boolean(companyId),
    queryFn: async () => {
      const json = (await api.get(
        `/additional-contacts/company/${companyId}`,
      )) as AdditionalContactsListResponse;
      return json.data;
    },
    staleTime: 60_000,
  });
}
