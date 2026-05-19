import { useMutation } from "@tanstack/react-query";
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
