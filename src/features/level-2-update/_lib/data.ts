import { BRAND_OPTIONS, type BRAND } from "@/types/brand.types";
import { LEAD_TYPE_OPTIONS, type LEAD_TYPE } from "@/types/lead-type.types";

export type Level2UpdateRow = {
  id: string;
  lead: string;
  campaign: BRAND | "";
  level_2_agent: string;
  level_2_result_update: string;
  updated_notes: string;
  call_back_date: string;
  created_date: string;
  lead_type_sidago: LEAD_TYPE | "";
  lead_type_benton: LEAD_TYPE | "";
  lead_type_95rm: LEAD_TYPE | "";
};

export const level2ResultUpdateOptions = [
  { label: "New", value: "New" },
  { label: "Sent To Fix", value: "Sent To Fix" },
  { label: "Fixed", value: "Fixed" },
  { label: "Can't Locate", value: "Can't Locate" },
  { label: "On Hold", value: "On Hold" },
  { label: "General", value: "General" },
];

export const level2UpdateCampaignOptions = BRAND_OPTIONS.map((option) => ({
  ...option,
  label: option.value === "BENTON" ? "Benton" : option.label,
}));

export const level2UpdateLeadTypeOptions = LEAD_TYPE_OPTIONS;

export const level2LeadOptions = [
  { label: "NR-1001", value: "NR-1001" },
  { label: "SL-1002", value: "SL-1002" },
  { label: "HP-1003", value: "HP-1003" },
  { label: "BA-1004", value: "BA-1004" },
  { label: "VR-1005", value: "VR-1005" },
  { label: "EF-1006", value: "EF-1006" },
];

export const level2AgentOptions = [
  { label: "Asha", value: "Asha" },
  { label: "Tanvir", value: "Tanvir" },
  { label: "Rafi", value: "Rafi" },
  { label: "Maliha", value: "Maliha" },
  { label: "Hasib", value: "Hasib" },
  { label: "Nafis", value: "Nafis" },
];

export const level2UpdateRows: Level2UpdateRow[] = [
  {
    id: "l2u-1",
    lead: "NR-1001",
    campaign: "SVG",
    level_2_agent: "Asha",
    level_2_result_update: "Sent To Fix",
    updated_notes: "Marked for contact refresh before next callback.",
    call_back_date: "2026-04-30",
    created_date: "2026-04-28",
    lead_type_sidago: "Fixed",
    lead_type_benton: "General",
    lead_type_95rm: "General",
  },
  {
    id: "l2u-2",
    lead: "SL-1002",
    campaign: "BENTON",
    level_2_agent: "Tanvir",
    level_2_result_update: "Fixed",
    updated_notes: "Record updated after validation call.",
    call_back_date: "2026-05-01",
    created_date: "2026-04-28",
    lead_type_sidago: "Fixed",
    lead_type_benton: "Fixed",
    lead_type_95rm: "General",
  },
  {
    id: "l2u-3",
    lead: "HP-1003",
    campaign: "95RM",
    level_2_agent: "Rafi",
    level_2_result_update: "Can't Locate",
    updated_notes: "Needs another pass with public records.",
    call_back_date: "2026-05-02",
    created_date: "2026-04-27",
    lead_type_sidago: "Can't Locate",
    lead_type_benton: "General",
    lead_type_95rm: "General",
  },
];

export function createEmptyLevel2UpdateRow(nextId: number): Level2UpdateRow {
  return {
    id: `l2u-new-${nextId}`,
    lead: "",
    campaign: "",
    level_2_agent: "",
    level_2_result_update: "",
    updated_notes: "",
    call_back_date: "",
    created_date: "",
    lead_type_sidago: "",
    lead_type_benton: "",
    lead_type_95rm: "",
  };
}
