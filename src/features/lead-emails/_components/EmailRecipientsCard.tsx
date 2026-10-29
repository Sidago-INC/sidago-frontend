import clsx from "clsx";
import { Mail, MailCheck, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { useLogEmail } from "@/features/agent-email/_lib/hooks";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { isLeadEmailsDisabled, useEmailRecipients } from "../_lib/hooks";
import type { LeadEmail, RecipientMode } from "../_lib/types";
import { EmailRotationPanel } from "./EmailRotationPanel";

type Props = {
  leadId: string;
  brandCode: string;
  /** The stage being sent (1st, 2nd, send_contract …) — recorded on the log. */
  status: string;
  /** Used for the log entry's subject/body, like the table's Check To Log. */
  logSubject: string;
  logBody: string;
  /** Already logged (Check To Log is ticked): the log button is disabled. */
  alreadyLogged: boolean;
  /** Called after a successful log so the page can tick Check To Log. */
  onLogged: () => void;
};

const MODE_TEXT: Record<RecipientMode, string> = {
  all_confirmed: "All confirmed addresses",
  all_researched: "Researched addresses (no verified address yet)",
  rotation:
    "Verified address #1 — verified addresses get one email each, in turn",
  manual: "Your selection",
};

const STAGE_LABEL: Record<string, string> = {
  "1st": "1st email",
  "2nd": "2nd email",
  "3rd": "3rd email",
  finished: "finished email",
  send_contract: "Send Contract email",
  resend_contract: "Resend Contract email",
  lukewarm: "Lukewarm Reschedule email",
};

const BLOCK_TEXT: Record<string, string> = {
  suppressed:
    "This contact unsubscribed from this brand. Email is suppressed for every address.",
  email_blocked: "Email is blocked for this lead.",
  no_eligible_address:
    "No address can be emailed — every one is bounced, invalid or archived. Add or confirm another address above.",
};

const WARNING_TEXT: Record<string, string> = {
  hot_without_confirmed_email:
    "This is a Hot lead and none of the addresses is confirmed. Consider confirming one by phone first.",
};

function mailtoFor(addresses: string[]): string {
  // One address per recipient, comma-separated in the To: field — RFC 6068.
  return `mailto:${addresses.map((a) => encodeURIComponent(a).replace(/%40/g, "@")).join(",")}`;
}

type Edits = { key: string; removed: Set<string>; added: Set<string> };
const emptyEdits = (key: string): Edits => ({
  key,
  removed: new Set(),
  added: new Set(),
});

const linkButton =
  "inline-flex cursor-pointer items-center gap-1.5 rounded bg-sky-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-sky-500";

/**
 * "Email all recipients": shows who the backend would send to (it owns the
 * rules — ONE verified address per email, in turn; cold cap; suppression),
 * lets the agent drop or add addresses, opens the mail client, and then logs
 * the send. The lead's rotation (which verified address is next, when) is
 * shown above it (EmailRotationPanel).
 *
 * Sending is still manual (mailto:) — the CRM can record that the agent logged
 * the action but cannot verify delivery until a sending provider is connected.
 *
 * A cold send (no confirmed address) is one message PER address, so each gets
 * its own link rather than one message addressed to strangers all at once.
 */
export function EmailRecipientsCard({
  leadId,
  brandCode,
  status,
  logSubject,
  logBody,
  alreadyLogged,
  onLogged,
}: Props) {
  const { data, isLoading, isError, error } = useEmailRecipients(
    leadId,
    brandCode,
  );
  const logEmail = useLogEmail();

  // The selection is the resolver's set plus the agent's edits (addresses they
  // unticked, addresses they added). Derived rather than seeded by an effect,
  // so the first render already shows the right boxes ticked. The edits belong
  // to one (lead, brand, resolved set) — when that changes they start over.
  const resolvedIds = new Set((data?.recipients ?? []).map((r) => r.id));
  const editKey = `${leadId}|${brandCode}|${[...resolvedIds].join(",")}`;
  const [edits, setEdits] = useState<Edits>(emptyEdits(""));
  const current = edits.key === editKey ? edits : emptyEdits(editKey);
  const isSelected = (id: string) =>
    resolvedIds.has(id) ? !current.removed.has(id) : current.added.has(id);

  const all: LeadEmail[] = [...(data?.recipients ?? []), ...(data?.others ?? [])];
  const chosen = all.filter((a) => a.eligible && isSelected(a.id));
  // Verified addresses are emailed one at a time (the backend refuses two).
  const chosenVerified = chosen.find((a) => a.verified);
  const cold = data?.mode === "all_researched";

  if (isError && isLeadEmailsDisabled(error)) return null;
  if (isLoading) {
    return (
      <p className="text-xs text-slate-400 dark:text-gray-500">
        Loading recipients…
      </p>
    );
  }
  if (isError || !data) {
    return <p className="text-xs text-rose-500">Could not load recipients.</p>;
  }

  const toggle = (id: string) =>
    setEdits((prev) => {
      const base = prev.key === editKey ? prev : emptyEdits(editKey);
      const removed = new Set(base.removed);
      const added = new Set(base.added);
      const set = resolvedIds.has(id) ? removed : added;
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return { key: editKey, removed, added };
    });

  const log = async () => {
    try {
      const res = (await logEmail.mutateAsync({
        leadId,
        brandCode,
        subject: logSubject,
        body: logBody,
        status,
        recipientIds: chosen.map((c) => c.id),
      })) as { recipients?: { address: string }[] };
      const n = res.recipients?.length ?? chosen.length;
      showSuccessToast(
        n > 1
          ? `Email logged for ${n} recipients (counted as one touch).`
          : "Email logged.",
      );
      onLogged();
    } catch (err) {
      showErrorToast(err);
    }
  };

  const blocked = data.blockedReason;

  return (
    <EmailRotationPanel leadId={leadId} brandCode={brandCode}>
      <div className="space-y-3">
        {blocked ? (
          <p className="flex items-start gap-1.5 rounded border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-300">
            <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {BLOCK_TEXT[blocked] ?? "This lead cannot be emailed right now."}
          </p>
        ) : null}

        {data.warnings.map((w) => (
          <p
            key={w}
            className="flex items-start gap-1.5 rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
          >
            <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {WARNING_TEXT[w] ?? w}
          </p>
        ))}

        {!blocked && data.rotation ? (
          <p className="text-[11px] uppercase tracking-wide text-indigo-500 dark:text-indigo-300">
            Resend of the {STAGE_LABEL[data.rotation.stage] ?? data.rotation.stage} — no
            reply yet, so it goes to verified address #{data.rotation.step + 1}
          </p>
        ) : !blocked && data.mode ? (
          <p className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-gray-500">
            {MODE_TEXT[data.mode]}
          </p>
        ) : null}

        <ul className="space-y-1.5">
          {all.map((item) => {
            const isResolved = resolvedIds.has(item.id);
            return (
              <li key={item.id}>
                <label
                  className={clsx(
                    "flex cursor-pointer items-center gap-2 text-xs",
                    !item.eligible && "cursor-not-allowed opacity-50",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isSelected(item.id)}
                    disabled={
                      !item.eligible ||
                      Boolean(blocked) ||
                      (item.verified &&
                        !isSelected(item.id) &&
                        Boolean(chosenVerified))
                    }
                    onChange={() => toggle(item.id)}
                  />
                  <span className="break-all text-slate-700 dark:text-slate-200">
                    {item.address}
                  </span>
                  {item.verified ? (
                    <span
                      className="rounded bg-emerald-50 px-1 text-[10px] font-semibold uppercase text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                      title={
                        item.verification === "confirmed"
                          ? "Verified by an agent"
                          : "Verified by NeverBounce"
                      }
                    >
                      Verified
                    </span>
                  ) : null}
                  {!isResolved && item.eligible ? (
                    <span className="text-[10px] text-slate-400">not in default set</span>
                  ) : null}
                  {!item.eligible ? (
                    <span className="text-[10px] text-rose-500">
                      can't be emailed
                    </span>
                  ) : null}
                </label>
              </li>
            );
          })}
        </ul>

        {!blocked && chosen.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {cold ? (
              // One message per address (decision D6).
              chosen.map((c) => (
                <a key={c.id} href={mailtoFor([c.address])} className={linkButton}>
                  <Mail className="h-3.5 w-3.5" />
                  Email {c.address}
                </a>
              ))
            ) : (
              <a
                href={mailtoFor(chosen.map((c) => c.address))}
                className={linkButton}
              >
                <Mail className="h-3.5 w-3.5" />
                Email {chosen.length > 1 ? "all recipients" : "recipient"}
              </a>
            )}
            <button
              type="button"
              disabled={logEmail.isPending || alreadyLogged}
              onClick={() => void log()}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <MailCheck className="h-3.5 w-3.5" />
              {alreadyLogged
                ? "Already logged"
                : logEmail.isPending
                  ? "Logging…"
                  : `Log as sent (${chosen.length})`}
            </button>
          </div>
        ) : null}

        {cold && chosen.length > 1 ? (
          <p className="text-[11px] text-slate-400 dark:text-gray-500">
            No address is verified yet, so each one gets its own message.
            Logging records all {chosen.length} as one touch.
          </p>
        ) : null}
      </div>
    </EmailRotationPanel>
  );
}
