/**
 * Normalize a URL so `<a href>` opens correctly.
 *
 * Handles:
 * - `https/host/...` (malformed scheme missing `://`) → `https://host/...`
 * - bare host paths → prefixed with `https://`
 * - already-absolute `http(s)://` URLs → unchanged
 */
export function ensureAbsoluteUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  // Repair "https/host..." / "http/host..." (missing "://")
  const brokenScheme = trimmed.match(/^(https?)\/(?!\/)/i);
  if (brokenScheme) {
    return `${brokenScheme[1].toLowerCase()}://${trimmed.slice(brokenScheme[0].length)}`;
  }

  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  return `https://${trimmed}`;
}
