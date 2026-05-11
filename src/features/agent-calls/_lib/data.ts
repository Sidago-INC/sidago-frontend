import { CONTACT_TYPE_VALUES } from "@/types/contact-type.types";
import { LEAD_TYPE_VALUES } from "@/types/lead-type.types";

export interface Lead {
  recordId: string;
  lead_id: string;
  full_name: string;
  timezone: string;
  lead_type: string;
  contact_type: string;
  company_name: string;
  role: string;
  phone: string;
  email: string;
  call_notes_sidago: string;
  not_work_anymore: boolean;
  next_follow_up_date_sidago: string;
  last_called_date_sidago: string;
  history_call_notes_sidago: string;
  history_calls_sidago: string;
  last_fixed_date: string;
  other_contacts: string;
}

export const leadTypeOptions = LEAD_TYPE_VALUES;

export const contactTypeOptions = CONTACT_TYPE_VALUES;

export const leadsByAgent: Record<string, Lead[]> = {
  mariz: [
    {
      recordId: "lead-001",
      lead_id: "LD-1001",
      full_name: "Laura Chen",
      timezone: "EST",
      lead_type: "Hot",
      contact_type: "Interested",
      company_name: "Northwind Labs",
      role: "Operations Director",
      phone: "+1 202-555-0141",
      email: "laura.chen@northwindlabs.com",
      call_notes_sidago: "Asked for pricing breakdown and next demo slot.",
      not_work_anymore: false,
      next_follow_up_date_sidago: "2026-04-14",
      last_called_date_sidago: "2026-04-11",
      history_call_notes_sidago:
        "Apr 9: Requested brochure.\nApr 10: Confirmed buying timeline.",
      history_calls_sidago: "Apr 9 - 6 min\nApr 10 - 11 min",
      last_fixed_date: "2026-04-08",
      other_contacts: "CFO: Daniel Green, daniel@northwindlabs.com",
    },
    {
      recordId: "lead-002",
      lead_id: "LD-1002",
      full_name: "Miguel Santos",
      timezone: "PST",
      lead_type: "Warm",
      contact_type: "Call Lead Back",
      company_name: "Summit Freight",
      role: "Fleet Manager",
      phone: "+1 202-555-0182",
      email: "miguel@summitfreight.com",
      call_notes_sidago: "Busy this morning, asked for callback after lunch.",
      not_work_anymore: false,
      next_follow_up_date_sidago: "2026-04-12",
      last_called_date_sidago: "2026-04-11",
      history_call_notes_sidago:
        "Apr 8: Interested in automation.\nApr 11: Requested callback.",
      history_calls_sidago: "Apr 8 - 8 min\nApr 11 - 3 min",
      last_fixed_date: "2026-04-06",
      other_contacts: "Assistant: Rosa King",
    },
    {
      recordId: "lead-003",
      lead_id: "LD-1003",
      full_name: "Anita Patel",
      timezone: "CST",
      lead_type: "Cold",
      contact_type: "No Answer",
      company_name: "BluePeak Retail",
      role: "Regional Lead",
      phone: "+1 202-555-0166",
      email: "apatel@bluepeakretail.com",
      call_notes_sidago: "No answer on two recent attempts.",
      not_work_anymore: false,
      next_follow_up_date_sidago: "2026-04-15",
      last_called_date_sidago: "2026-04-10",
      history_call_notes_sidago: "Apr 7: Left voicemail.\nApr 10: No answer.",
      history_calls_sidago: "Apr 7 - 1 min\nApr 10 - 1 min",
      last_fixed_date: "2026-04-01",
      other_contacts: "Front desk confirmed extension 203.",
    },
    {
      recordId: "lead-004",
      lead_id: "LD-1004",
      full_name: "Brenda Holloway",
      timezone: "EST",
      lead_type: "Hot",
      contact_type: "Interested",
      company_name: "Crestline Health",
      role: "VP Operations",
      phone: "+1 202-555-0195",
      email: "brenda@crestlinehealth.com",
      call_notes_sidago:
        "Asked for case studies and wants a follow-up with operations team.",
      not_work_anymore: false,
      next_follow_up_date_sidago: "2026-04-13",
      last_called_date_sidago: "2026-04-12",
      history_call_notes_sidago:
        "Apr 10: Intro call completed.\nApr 12: Requested proof points.",
      history_calls_sidago: "Apr 10 - 12 min\nApr 12 - 9 min",
      last_fixed_date: "2026-04-09",
      other_contacts: "Ops analyst: Kevin Holt",
    },
  ],
  bryan: [
    {
      recordId: "lead-101",
      lead_id: "LD-2001",
      full_name: "Ethan Ross",
      timezone: "MST",
      lead_type: "Referral",
      contact_type: "Prospecting",
      company_name: "Atlas Works",
      role: "Founder",
      phone: "+1 202-555-0104",
      email: "ethan@atlasworks.io",
      call_notes_sidago: "New referral. Needs introductory call.",
      not_work_anymore: false,
      next_follow_up_date_sidago: "2026-04-13",
      last_called_date_sidago: "2026-04-09",
      history_call_notes_sidago: "Apr 9: Intro email sent.",
      history_calls_sidago: "Apr 9 - 2 min",
      last_fixed_date: "2026-04-07",
      other_contacts: "Referral source: Mona Lewis",
    },
    {
      recordId: "lead-102",
      lead_id: "LD-2002",
      full_name: "Jared Collins",
      timezone: "CST",
      lead_type: "Warm",
      contact_type: "Call Lead Back",
      company_name: "Pioneer Solar",
      role: "Procurement Lead",
      phone: "+1 312-555-0129",
      email: "jared@pioneersolar.com",
      call_notes_sidago:
        "Requested callback with pricing comparison next business day.",
      not_work_anymore: false,
      next_follow_up_date_sidago: "2026-04-13",
      last_called_date_sidago: "2026-04-12",
      history_call_notes_sidago:
        "Apr 9: Shared brief intro.\nApr 12: Asked for callback.",
      history_calls_sidago: "Apr 9 - 4 min\nApr 12 - 5 min",
      last_fixed_date: "2026-04-08",
      other_contacts: "Finance partner: Leona Watts",
    },
    {
      recordId: "lead-103",
      lead_id: "LD-2003",
      full_name: "Nina Brooks",
      timezone: "PST",
      lead_type: "Hot",
      contact_type: "Interested",
      company_name: "Alta Commerce",
      role: "Growth Director",
      phone: "+1 415-555-0138",
      email: "nina@altacommerce.io",
      call_notes_sidago:
        "Wants proposal draft and onboarding timeline before Thursday.",
      not_work_anymore: false,
      next_follow_up_date_sidago: "2026-04-14",
      last_called_date_sidago: "2026-04-12",
      history_call_notes_sidago:
        "Apr 11: Qualification call.\nApr 12: Requested onboarding details.",
      history_calls_sidago: "Apr 11 - 10 min\nApr 12 - 8 min",
      last_fixed_date: "2026-04-10",
      other_contacts: "COO: Melissa Grant",
    },
  ],
  chris: [
    {
      recordId: "lead-201",
      lead_id: "LD-3001",
      full_name: "Hiro Tanaka",
      timezone: "JST",
      lead_type: "Warm",
      contact_type: "Left Message",
      company_name: "Apex Imports",
      role: "Partnership Manager",
      phone: "+81 3-5550-0192",
      email: "hiro@apeximports.jp",
      call_notes_sidago: "Left a concise voicemail about partnership tools.",
      not_work_anymore: false,
      next_follow_up_date_sidago: "2026-04-16",
      last_called_date_sidago: "2026-04-11",
      history_call_notes_sidago: "Apr 11: Left voicemail.",
      history_calls_sidago: "Apr 11 - 1 min",
      last_fixed_date: "2026-04-02",
      other_contacts: "LinkedIn message pending.",
    },
    {
      recordId: "lead-202",
      lead_id: "LD-3002",
      full_name: "Victor Alvarez",
      timezone: "CET",
      lead_type: "Warm",
      contact_type: "Interested",
      company_name: "Transit Core",
      role: "Business Systems Lead",
      phone: "+34 91-555-0102",
      email: "victor@transitcore.es",
      call_notes_sidago:
        "Interested in workflow automation for inbound lead routing.",
      not_work_anymore: false,
      next_follow_up_date_sidago: "2026-04-14",
      last_called_date_sidago: "2026-04-12",
      history_call_notes_sidago:
        "Apr 8: Discovery email.\nApr 12: Demo requested.",
      history_calls_sidago: "Apr 8 - 3 min\nApr 12 - 11 min",
      last_fixed_date: "2026-04-04",
      other_contacts: "IT manager: Elsa Romero",
    },
    {
      recordId: "lead-203",
      lead_id: "LD-3003",
      full_name: "Grace Monroe",
      timezone: "EST",
      lead_type: "Cold",
      contact_type: "No Answer",
      company_name: "Harbor Ledger",
      role: "Revenue Ops Analyst",
      phone: "+1 646-555-0199",
      email: "grace@harborledger.com",
      call_notes_sidago: "Two call attempts this week with no response yet.",
      not_work_anymore: false,
      next_follow_up_date_sidago: "2026-04-16",
      last_called_date_sidago: "2026-04-12",
      history_call_notes_sidago:
        "Apr 10: No answer.\nApr 12: Left voicemail with callback number.",
      history_calls_sidago: "Apr 10 - 1 min\nApr 12 - 1 min",
      last_fixed_date: "2026-04-03",
      other_contacts: "Reception confirmed she is still the right contact.",
    },
  ],
  tom: [
    {
      recordId: "lead-301",
      lead_id: "LD-4001",
      full_name: "Sophia Turner",
      timezone: "GMT",
      lead_type: "Hot",
      contact_type: "Interested",
      company_name: "Evercore Media",
      role: "Revenue Lead",
      phone: "+44 20 5550 1203",
      email: "sophia.turner@evercoremedia.co.uk",
      call_notes_sidago: "Requested proposal draft before Friday.",
      not_work_anymore: false,
      next_follow_up_date_sidago: "2026-04-13",
      last_called_date_sidago: "2026-04-11",
      history_call_notes_sidago:
        "Apr 10: Discussed lead routing.\nApr 11: Asked for proposal.",
      history_calls_sidago: "Apr 10 - 9 min\nApr 11 - 7 min",
      last_fixed_date: "2026-04-05",
      other_contacts: "Sales ops: Helena Price",
    },
    {
      recordId: "lead-302",
      lead_id: "LD-4002",
      full_name: "Caleb Morris",
      timezone: "CST",
      lead_type: "Warm",
      contact_type: "Left Message",
      company_name: "Meridian Foods",
      role: "Sales Enablement Manager",
      phone: "+1 214-555-0144",
      email: "caleb@meridianfoods.com",
      call_notes_sidago: "Left voicemail after brief switchboard transfer.",
      not_work_anymore: false,
      next_follow_up_date_sidago: "2026-04-15",
      last_called_date_sidago: "2026-04-12",
      history_call_notes_sidago:
        "Apr 9: Sent intro email.\nApr 12: Left voicemail.",
      history_calls_sidago: "Apr 9 - 2 min\nApr 12 - 1 min",
      last_fixed_date: "2026-04-06",
      other_contacts: "Procurement: Lila Greene",
    },
    {
      recordId: "lead-303",
      lead_id: "LD-4003",
      full_name: "Priya Nair",
      timezone: "IST",
      lead_type: "Hot",
      contact_type: "Interested",
      company_name: "Orbit Analytics",
      role: "Regional Revenue Head",
      phone: "+91 80-5550-1155",
      email: "priya@orbitanalytics.in",
      call_notes_sidago:
        "Strong fit. Wants proposal and implementation timeline this week.",
      not_work_anymore: false,
      next_follow_up_date_sidago: "2026-04-13",
      last_called_date_sidago: "2026-04-12",
      history_call_notes_sidago:
        "Apr 11: Qualification completed.\nApr 12: Requested commercial proposal.",
      history_calls_sidago: "Apr 11 - 8 min\nApr 12 - 13 min",
      last_fixed_date: "2026-04-10",
      other_contacts: "COO: Aniket Das",
    },
  ],
};
