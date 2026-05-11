import type { Lead } from "@/features/agent-calls/_lib/data";

export type CallsFormState = {
  email: string;
  notes: string;
  callBackDate: string;
  leadType: string;
  contactType: string;
  notWorkAnymore: boolean;
};

export type CallsModalState = {
  title: string;
  message: string;
  direction?: "top" | "bottom" | "left" | "right" | "center";
};

export function createFormStateFromLead(lead: Lead): CallsFormState {
  return {
    email: lead.email,
    notes: lead.call_notes_sidago,
    callBackDate: lead.next_follow_up_date_sidago,
    leadType: lead.lead_type,
    contactType: lead.contact_type,
    notWorkAnymore: lead.not_work_anymore,
  };
}
