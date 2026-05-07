export const LEAD_TYPE_VALUES = [
  "Can't Locate",
  "Company Not Found",
  "Contract Closed",
  "DNC",
  "Fixed",
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
