import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  LEAD_EMAILS_DISABLED,
  type AddLeadEmailBody,
  type EmailRecipientsResponse,
  type LeadEmail,
  type LeadEmailEvent,
  type LeadEmailsResponse,
} from "./types";

export const leadEmailsKey = (leadId: string | null | undefined) =>
  ["lead-emails", leadId] as const;

/** True while the backend feature flags are off (the card then falls back). */
export function isLeadEmailsDisabled(error: unknown): boolean {
  const e = error as { code?: string; status?: number } | null;
  return e?.code === LEAD_EMAILS_DISABLED;
}

export function useLeadEmails(leadId: string | null | undefined) {
  return useQuery({
    queryKey: leadEmailsKey(leadId),
    enabled: Boolean(leadId),
    queryFn: async () => {
      const json = (await api.get(
        `/leads/${leadId}/emails`,
      )) as LeadEmailsResponse;
      return json.data;
    },
    // A disabled feature will not start working by retrying.
    retry: (count, error) => !isLeadEmailsDisabled(error) && count < 2,
    staleTime: 30_000,
  });
}

export function useLeadEmailEvents(
  leadId: string,
  emailId: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["lead-email-events", leadId, emailId],
    enabled,
    queryFn: async () => {
      const json = (await api.get(
        `/leads/${leadId}/emails/${emailId}/events`,
      )) as { data: LeadEmailEvent[] };
      return json.data;
    },
    staleTime: 15_000,
  });
}

// Everything that changes an address also changes what the queue resolves and
// what leads.email (the derived cache) shows, so refresh those too.
function useInvalidateAfterChange(leadId: string) {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: leadEmailsKey(leadId) });
    void qc.invalidateQueries({ queryKey: ["lead-email-events", leadId] });
    void qc.invalidateQueries({ queryKey: ["email-recipients", leadId] });
    void qc.invalidateQueries({ queryKey: ["email-queue"] });
  };
}

export function useAddLeadEmail(leadId: string) {
  const invalidate = useInvalidateAfterChange(leadId);
  return useMutation({
    mutationFn: async (body: AddLeadEmailBody) =>
      (await api.post(`/leads/${leadId}/emails`, body)) as {
        ok: true;
        data: LeadEmail;
      },
    onSuccess: invalidate,
  });
}

export function useConfirmLeadEmail(leadId: string) {
  const invalidate = useInvalidateAfterChange(leadId);
  return useMutation({
    mutationFn: async (vars: {
      id: string;
      method?: "phone" | "agent_promoted";
      note?: string;
    }) =>
      (await api.post(`/leads/${leadId}/emails/${vars.id}/confirm`, {
        method: vars.method,
        note: vars.note,
      })) as { ok: true; data: LeadEmail },
    onSuccess: invalidate,
  });
}

export function useUnconfirmLeadEmail(leadId: string) {
  const invalidate = useInvalidateAfterChange(leadId);
  return useMutation({
    mutationFn: async (vars: { id: string; note?: string }) =>
      (await api.post(`/leads/${leadId}/emails/${vars.id}/unconfirm`, {
        note: vars.note,
      })) as { ok: true; data: LeadEmail },
    onSuccess: invalidate,
  });
}

export function useSetLeadEmailDeliverability(leadId: string) {
  const invalidate = useInvalidateAfterChange(leadId);
  return useMutation({
    mutationFn: async (vars: {
      id: string;
      deliverability: "invalid" | "unknown";
      note?: string;
    }) =>
      (await api.patch(`/leads/${leadId}/emails/${vars.id}`, {
        deliverability: vars.deliverability,
        note: vars.note,
      })) as { ok: true; data: LeadEmail },
    onSuccess: invalidate,
  });
}

export function useArchiveLeadEmail(leadId: string) {
  const invalidate = useInvalidateAfterChange(leadId);
  return useMutation({
    mutationFn: async (id: string) =>
      (await api.delete(`/leads/${leadId}/emails/${id}`)) as {
        ok: true;
        id: string;
      },
    onSuccess: invalidate,
  });
}

/** Who an email to this lead would go to, resolved centrally by the backend. */
export function useEmailRecipients(
  leadId: string | null | undefined,
  brandCode: string | null | undefined,
) {
  return useQuery({
    queryKey: ["email-recipients", leadId, brandCode],
    enabled: Boolean(leadId && brandCode),
    queryFn: async () =>
      (await api.get(
        `/email/lead/${leadId}/brand/${brandCode}/recipients`,
      )) as EmailRecipientsResponse,
    retry: (count, error) => !isLeadEmailsDisabled(error) && count < 2,
    staleTime: 15_000,
  });
}
