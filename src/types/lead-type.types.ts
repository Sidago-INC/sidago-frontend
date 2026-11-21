// Exactly the values present in lead_brand_state.lead_type. This list used
// to say "Fixed", which does not exist in the column — filtering by it
// returned nothing and setting it produced a lead type nothing else knew.
export const LEAD_TYPE_VALUES = [
  "Can't Locate",
  "Company Not Found",
  "Contract Closed",
  "DNC",
  "Fix",
  "General",
  "Hot",
  "Ignore",
  "On Hold",
  "Void",
];

export type LEAD_TYPE = (typeof LEAD_TYPE_VALUES)[number];

export const LEAD_TYPE_OPTIONS: { value: LEAD_TYPE; label: string }[] =
  LEAD_TYPE_VALUES.map((lt) => ({
    value: lt,
    label: lt,
  }));

export function getRandomLeadType(): LEAD_TYPE {
  const randomIndex = Math.floor(Math.random() * LEAD_TYPE_VALUES.length);
  return LEAD_TYPE_VALUES[randomIndex];
}
