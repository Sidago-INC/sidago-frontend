/**
 * Works out which draft fields need saving: those whose current value differs
 * from what was last sent. A field missing from `latest` counts as cleared ("")
 * so the server clears it too.
 *
 * Returns an empty object when nothing changed.
 */
export function diffDraftPatch(
  saved: Record<string, string>,
  latest: Record<string, string | undefined>,
): Record<string, string> {
  const changed: Record<string, string> = {};
  const keys = new Set([...Object.keys(saved), ...Object.keys(latest)]);
  for (const key of keys) {
    const value = latest[key] ?? "";
    if (value !== (saved[key] ?? "")) changed[key] = value;
  }
  return changed;
}
