// Pure rules for what an outcome submission sends and what the notes box keeps.
// No React or API imports, so these can be unit tested directly.

/**
 * The note sent with an outcome: only what the agent typed, trimmed. Empty or
 * whitespace-only text sends nothing. Historical notes never reach this function.
 */
export function notesToSubmit(typed: string): string | undefined {
  const trimmed = typed.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * The follow-up date sent with an outcome. Sent only when it differs from the
 * stored date, so an unchanged date is never resubmitted. A cleared date sends
 * nothing: the clear-date contract is not settled (see the PR notes).
 */
export function followUpToSubmit(
  formDate: string,
  storedDate: string | null | undefined,
): string | undefined {
  const next = formDate.trim();
  const stored = storedDate ?? "";
  if (next === stored) return undefined;
  return next || undefined;
}

/**
 * After a successful save, the box is cleared only if it still holds the text
 * that was submitted. Text typed while the request was in flight is kept.
 */
export function notesAfterSave(current: string, submitted: string): string {
  return current.trim() === submitted ? "" : current;
}
