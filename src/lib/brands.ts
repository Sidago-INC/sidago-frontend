export const LEGACY_BRAND_CODES = ["svg", "95rm", "benton"] as const;

export function isLegacyBrandCode(code: string): boolean {
  return (LEGACY_BRAND_CODES as readonly string[]).includes(code);
}
