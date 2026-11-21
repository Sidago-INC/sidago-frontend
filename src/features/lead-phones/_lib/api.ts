import { api } from "@/lib/api";
import type { LeadPhone, LeadPhoneStatus, NumberCheck } from "./types";

type ItemResponse = { ok: true; item: LeadPhone };

// Writes only. There is no read endpoint on purpose: the numbers arrive with
// the lead detail / queue / grid responses each page already loads.
export const leadPhonesApi = {
  /** 409 when the lead already has the number (in any format). */
  add: (
    leadId: string,
    body: { value: string; extension?: string },
  ): Promise<{ ok: true; revived: boolean; item: LeadPhone; verification?: NumberCheck }> =>
    api.post(`/leads/${leadId}/phones`, body),

  update: (
    phoneId: string,
    body: { status?: LeadPhoneStatus; isPreferred?: boolean; extension?: string },
  ): Promise<ItemResponse> => api.patch(`/lead-phones/${phoneId}`, body),

  /** Out of rotation, kept on the record. Numbers are never deleted. */
  retire: (phoneId: string): Promise<ItemResponse> =>
    api.post(`/lead-phones/${phoneId}/retire`, {}),

  /**
   * Bring a retired number back - the same row, counters reset. 409 when another
   * lead has taken the number live since.
   */
  restore: (phoneId: string): Promise<ItemResponse> =>
    api.post(`/lead-phones/${phoneId}/restore`, {}),
};
