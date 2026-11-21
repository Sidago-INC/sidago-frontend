export const CONTACT_TYPE_VALUES = ["Prospecting", "Validated"];

export type CONTACT_TYPE = (typeof CONTACT_TYPE_VALUES)[number];

export const CONTACT_TYPE_OPTIONS: { value: CONTACT_TYPE; label: string }[] =
  CONTACT_TYPE_VALUES.map((ct) => ({
    value: ct,
    label: ct,
  }));

export function getRandomContactType(): CONTACT_TYPE {
  const randomIndex = Math.floor(Math.random() * CONTACT_TYPE_VALUES.length);
  return CONTACT_TYPE_VALUES[randomIndex];
}
