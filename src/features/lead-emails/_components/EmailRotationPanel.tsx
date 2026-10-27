import { MessageSquareReply, Repeat, Square } from "lucide-react";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { useLeadRotations, useStopRotation } from "../_lib/hooks";
import type { EmailRotation } from "../_lib/types";

const STAGE_LABEL: Record<string, string> = {
  "1st": "1st email",
  "2nd": "2nd email",
  "3rd": "3rd email",
  finished: "Finished email",
  send_contract: "Send Contract",
  resend_contract: "Resend Contract",
  lukewarm: "Lukewarm Reschedule",
};

function when(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
}

/** Latest rotation worth showing: the active one, else a reply in the last stop. */
function pick(runs: EmailRotation[]): EmailRotation | null {
  return runs.find((r) => r.status === "active") ?? runs.find((r) => r.status === "replied") ?? null;
}

/**
 * The lead's verified-address rotation, above the send controls: which
 * verified addresses got this stage's email, and when the next one is due.
 * The agent always sends by hand — the queue brings the lead back with the
 * next address pre-selected after 3 days without a reply.
 */
export function EmailRotationPanel({
  leadId,
  brandCode,
  children,
}: {
  leadId: string;
  brandCode: string;
  /** The send controls. */
  children: React.ReactNode;
}) {
  const { data } = useLeadRotations(leadId, brandCode);
  const stop = useStopRotation(leadId, brandCode);
  const run = data?.enabled ? pick(data.data) : null;

  if (!run) return <>{children}</>;

  if (run.status === "replied") {
    return (
      <div className="space-y-3">
        <p className="flex items-start gap-1.5 rounded border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
          <MessageSquareReply className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          The lead replied {when(run.stoppedAt)} — no further addresses are
          queued for the {STAGE_LABEL[run.stage] ?? run.stage}.
        </p>
        {children}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2 rounded border border-indigo-200 bg-indigo-50 p-2.5 text-xs text-indigo-900 dark:border-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-200">
        <p className="flex items-center gap-1.5 font-semibold">
          <Repeat className="h-3.5 w-3.5" />
          Rotation: {STAGE_LABEL[run.stage] ?? run.stage}
          <span className="font-normal text-indigo-700/80 dark:text-indigo-300/80">
            ({run.workflow === "hot" ? "Hot" : "General"} workflow)
          </span>
        </p>
        <ul className="space-y-0.5">
          {run.sends.map((s, i) => (
            <li key={`${s.leadEmailId}-${i}`}>
              #{i + 1} sent to <span className="font-medium">{s.toAddress}</span>{" "}
              {when(s.sentAt)}
            </li>
          ))}
        </ul>
        {run.requeuedAt ? (
          <p>
            No reply in 3 days — send this stage's email to the next verified
            address (pre-selected below).
          </p>
        ) : run.nextDueAt ? (
          <p>
            No reply yet. If none by {when(run.nextDueAt)}, the lead comes back
            here with the next verified address. Mark a reply on the address
            above to stop.
          </p>
        ) : null}
        <button
          type="button"
          disabled={stop.isPending}
          onClick={() =>
            void stop
              .mutateAsync(run.id)
              .then(() => showSuccessToast("Rotation stopped for this lead."))
              .catch(showErrorToast)
          }
          className="inline-flex cursor-pointer items-center gap-1 rounded border border-indigo-300 px-2 py-1 font-medium hover:bg-indigo-100 disabled:opacity-50 dark:border-indigo-700 dark:hover:bg-indigo-900/40"
        >
          <Square className="h-3 w-3" />
          Stop rotation
        </button>
      </div>
      {children}
    </div>
  );
}
