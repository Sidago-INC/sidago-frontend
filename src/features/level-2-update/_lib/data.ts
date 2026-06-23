import { BRAND_OPTIONS, type BRAND } from "@/types/brand.types";
import type { LEAD_TYPE } from "@/types/lead-type.types";

export type Level2UpdateRow = {
  // Frontend-only row id (e.g. "l2u-new-1") used for editing state. Once a
  // row has been logged to the DB, `logged_at` carries the API timestamp so
  // we can show "logged" feedback in the UI.
  id: string;
  // Lead picker stores the UUID as the value. `lead_label` is
  // "<company_symbol>-<full_name>" for display, sorting, and grouping.
  lead: string;
  lead_label: string;
  campaign: BRAND | "";
  level_2_agent: string;
  level_2_result_update: string;
  updated_notes: string;
  call_back_date: string;
  created_date: string;
  // Read-only — prefilled from /api/leads/<id>/brand-states when a lead is
  // picked, never edited directly in the row.
  lead_type_sidago: LEAD_TYPE | "";
  lead_type_benton: LEAD_TYPE | "";
  lead_type_95rm: LEAD_TYPE | "";
  logged_at?: string;
  // Populated after a successful POST /level-2-requests — used to call the
  // revert endpoint when the user deletes a logged row.
  api_id?: string;
};

// The 14 result options the agent can pick from when updating a Level 2 row.
// Matches the spec from the Level 2 Update brief verbatim (typo "Intersted"
// preserved on the user's request — change here if/when the spec is fixed).
export const level2ResultUpdateOptions = [
  { label: "Intersted", value: "Intersted" },
  { label: "Call back Lead", value: "Call back Lead" },
  { label: "needs more time", value: "needs more time" },
  { label: "no answer", value: "no answer" },
  { label: "left message", value: "left message" },
  { label: "bad number", value: "bad number" },
  { label: "wrong number", value: "wrong number" },
  { label: "not interested", value: "not interested" },
  { label: "DNC", value: "DNC" },
  { label: "Contract Closed", value: "Contract Closed" },
  { label: "Force Fix", value: "Force Fix" },
  { label: "Force General", value: "Force General" },
  { label: "Force Void", value: "Force Void" },
  { label: "Block Email to", value: "Block Email to" },
];

export const level2UpdateCampaignOptions = BRAND_OPTIONS.map((option) => ({
  ...option,
  label: option.value === "BENTON" ? "Benton" : option.label,
}));

export function createEmptyLevel2UpdateRow(nextId: number): Level2UpdateRow {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: `l2u-new-${nextId}`,
    lead: "",
    lead_label: "",
    campaign: "",
    level_2_agent: "",
    level_2_result_update: "",
    updated_notes: "",
    call_back_date: "",
    created_date: today,
    lead_type_sidago: "",
    lead_type_benton: "",
    lead_type_95rm: "",
  };
}
