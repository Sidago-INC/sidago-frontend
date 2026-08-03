/**
 * Normalize a MightyCall recording URL.
 *
 * Stored values often look like `https://https/console.mightycall.com/...`.
 * Keep only from `console` onward, then prefix a single `https://`.
 */
export function ensureAbsoluteUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  const consoleIdx = trimmed.toLowerCase().indexOf("console.");
  if (consoleIdx >= 0) {
    return `https://${trimmed.slice(consoleIdx)}`;
  }

  // Fallback for non-MightyCall links
  let s = trimmed.replace(/\\\//g, "/");
  let previous = "";
  while (s !== previous) {
    previous = s;
    s = s.replace(/^(?:https?:\/\/|https?\/|\/\/)/i, "");
  }
  if (!s) return trimmed;
  return `https://${s}`;
}
