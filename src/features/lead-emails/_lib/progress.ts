// Mirrors Sidago-backend src/email/email-stage.ts (BrandEmailProgress). The
// backend works out "Sent n/3" from the stage; the UI only formats it.
//
//   General: 1st -> 2nd -> 3rd -> finished
//   Hot:     send_contract -> resend_contract -> lukewarm -> finished
// email_status is the stage of the NEXT email; `finished` means none is left.

export type EmailProgress = {
  workflow: "general" | "hot";
  sent: number;
  total: number;
};

export type BrandEmailProgress = {
  stage: string;
  /** Null when the stage is on neither track for the lead type. */
  progress: EmailProgress | null;
  lastSentAt: string | null;
};

const STAGE_LABEL: Record<string, string> = {
  "1st": "1st email",
  "2nd": "2nd email",
  "3rd": "3rd email",
  send_contract: "Send contract",
  resend_contract: "Resend contract",
  lukewarm: "Lukewarm reschedule",
  finished: "Finished",
};

export function emailStageLabel(stage: string | null | undefined): string {
  const s = stage ?? "1st";
  return STAGE_LABEL[s] ?? s;
}

/** "Sent 2/3" (General) or "Contract 2/3" (Hot). */
export function progressLabel(progress: EmailProgress): string {
  const prefix = progress.workflow === "hot" ? "Contract" : "Sent";
  return `${prefix} ${progress.sent}/${progress.total}`;
}

/**
 * What the agent sees after Log as Sent, e.g. "Logged 1st email · next:
 * 2nd email (Sent 1/3)" or "… · sequence finished (Sent 3/3)".
 */
export function loggedSendMessage(res: {
  previousStatus?: string | null;
  emailStatus?: string | null;
  progress?: EmailProgress | null;
}): string {
  const logged = `Logged ${emailStageLabel(res.previousStatus)}`;
  const count = res.progress ? ` (${progressLabel(res.progress)})` : "";
  if (res.emailStatus === "finished") return `${logged} · sequence finished${count}`;
  if (res.emailStatus && res.emailStatus === res.previousStatus) {
    // A resend to the next verified address does not move the stage.
    return `${logged} again · stage unchanged${count}`;
  }
  return `${logged} · next: ${emailStageLabel(res.emailStatus)}${count}`;
}
