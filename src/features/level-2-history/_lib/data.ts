// Frontend shape for one Level 2 history row. Mirrors the response of
// GET /api/level-2-requests (source_type='level_2' rows only — agent-side
// manual updates live under source_type='manual_update' and are scoped out
// of this view per spec).
export type Level2HistoryRow = {
  id: string;
  leadId: string;
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
