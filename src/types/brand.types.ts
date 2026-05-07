export type BRAND = string;

const BRAND_VALUES: BRAND[] = ["BENTON", "SVG", "95RM"];

export const BRAND_OPTIONS: { value: BRAND; label: string }[] =
  BRAND_VALUES.map((b) => ({
    value: b,
    label: b,
  }));

export function getRandomBrand(): { value: BRAND; label: string } {
  const randomIndex = Math.floor(Math.random() * BRAND_OPTIONS.length);
  return BRAND_OPTIONS[randomIndex];
}
