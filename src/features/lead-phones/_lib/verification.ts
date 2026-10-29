import { showInfoToast, showWarningToast } from "@/lib/toast";
import { formatPhone } from "./format";
import type { NumberCheck } from "./types";

export type NumberCheckNotice = { kind: "warning" | "info"; message: string };

/**
 * What to tell the agent about a number that was just saved, or null when there
 * is nothing to say. Only two outcomes need a word:
 *
 *   - Numverify said it is not a valid number: it was saved anyway (as an
 *     invalid number, never dialled), and the agent may want to add another.
 *   - Numverify could not be asked right now: the number is saved and will be
 *     checked later, so nothing is lost - but the agent should know it is unchecked.
 *
 * Valid, switched off (reason "disabled") and bulk-import "pending" are silent.
 */
export function numberCheckNotice(check: NumberCheck | undefined): NumberCheckNotice | null {
  if (!check) return null;
  const phone = formatPhone(check.phoneE164);
  if (check.verification === "invalid") {
    return {
      kind: "warning",
      message: `${phone} is not a valid number according to Numverify. It was saved as an invalid number and will not be dialled - add another number if this lead needs one.`,
    };
  }
  if (check.verification === "pending" && (check.reason === "quota" || check.reason === "unavailable")) {
    return {
      kind: "info",
      message: `${phone} was saved, but Numverify could not check it right now. It will be checked later.`,
    };
  }
  return null;
}

/** Shows one toast per number that needs a word (see numberCheckNotice). */
export function announceNumberChecks(checks: NumberCheck[] | undefined): void {
  for (const check of checks ?? []) {
    const notice = numberCheckNotice(check);
    if (!notice) continue;
    if (notice.kind === "warning") showWarningToast(notice.message);
    else showInfoToast(notice.message);
  }
}
