export type Level2HistoryRow = {
  lead: string;
  campaign: string;
  level_2_agent: string;
  level_2_result_update: string;
  updated_notes: string;
  call_back_date: string;
  created_date: string;
  lead_type_sidago: string;
  lead_type_benton: string;
  lead_type_95rm: string;
};

export const level2HistoryRows: Level2HistoryRow[] = [
  {
    lead: "NR-1001",
    campaign: "Current Interest",
    level_2_agent: "Asha",
    level_2_result_update: "Sent To Fix",
    updated_notes: "Verified business listing and updated direct line.",
    call_back_date: "2026-04-29",
    created_date: "2026-04-28",
    lead_type_sidago: "Fixed",
    lead_type_benton: "General",
    lead_type_95rm: "General",
  },
  {
    lead: "SL-1002",
    campaign: "Reactivation",
    level_2_agent: "Tanvir",
    level_2_result_update: "Fixed",
    updated_notes: "Email corrected and alternate decision-maker added.",
    call_back_date: "2026-04-30",
    created_date: "2026-04-28",
    lead_type_sidago: "Fixed",
    lead_type_benton: "Fixed",
    lead_type_95rm: "General",
  },
  {
    lead: "HP-1003",
    campaign: "Outbound",
    level_2_agent: "Rafi",
    level_2_result_update: "Can't Locate",
    updated_notes:
      "Unable to confirm active office address after manual review.",
    call_back_date: "2026-05-01",
    created_date: "2026-04-27",
    lead_type_sidago: "Can't Locate",
    lead_type_benton: "General",
    lead_type_95rm: "General",
  },
  {
    lead: "BA-1004",
    campaign: "Inbound",
    level_2_agent: "Maliha",
    level_2_result_update: "New",
    updated_notes: "Fresh contact record created from referral handoff.",
    call_back_date: "2026-04-30",
    created_date: "2026-04-27",
    lead_type_sidago: "General",
    lead_type_benton: "General",
    lead_type_95rm: "Hot",
  },
  {
    lead: "VR-1005",
    campaign: "Referral",
    level_2_agent: "Hasib",
    level_2_result_update: "Sent To Fix",
    updated_notes: "Phone mismatch flagged and assigned for validation.",
    call_back_date: "2026-05-02",
    created_date: "2026-04-26",
    lead_type_sidago: "On Hold",
    lead_type_benton: "General",
    lead_type_95rm: "General",
  },
  {
    lead: "EF-1006",
    campaign: "Current Interest",
    level_2_agent: "Nafis",
    level_2_result_update: "Fixed",
    updated_notes: "Updated notes with new extension and owner title.",
    call_back_date: "2026-05-01",
    created_date: "2026-04-26",
    lead_type_sidago: "Fixed",
    lead_type_benton: "Fixed",
    lead_type_95rm: "Fixed",
  },
];
