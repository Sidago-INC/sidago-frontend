import clsx from "clsx";
import {
  ArchiveRestore,
  Ban,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  MailCheck,
  MessageSquareReply,
  Pencil,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "react-toastify";
import { Confirmation } from "@/components/ui/Confirmation";
import { EmailLink } from "@/components/ui/EmailLink";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { email as emailRule } from "@/lib/validation";
import {
  isLeadEmailsDisabled,
  useAddLeadEmail,
  useArchiveLeadEmail,
  useAutoVerifyLeadEmail,
  useChangeLeadEmailAddress,
  useConfirmLeadEmail,
  useLeadEmailEvents,
  useLeadEmails,
  useMarkReplied,
  useRestoreLeadEmail,
  useSetLeadEmailDeliverability,
  useUnconfirmLeadEmail,
} from "../_lib/hooks";
import type {
  Deliverability,
  LeadEmail,
  LeadEmailEvent,
  NeverbounceResult,
} from "../_lib/types";

type Props = {
  leadId: string | null | undefined;
  /**
   * leads.email — shown read-only when the feature is switched off on the
   * server, so the card never makes a lead look like it has no email.
   */
  fallbackEmail?: string | null;
  /** How "Confirm" is recorded: the Calls page verifies by phone. */
  confirmMethod?: "phone" | "agent_promoted";
  /** The brand being worked; a reply also takes the lead out of its email queue. */
  brandCode?: string;
  /**
   * Rendered instead while the feature is switched off on the server: pages
   * that edit the old comma-joined field pass that input here.
   */
  fallback?: ReactNode;
};

const DELIVERABILITY_LABEL: Record<Deliverability, string> = {
  unknown: "",
  valid: "Delivered",
  soft_bounced: "Soft bounce",
  hard_bounced: "Bounced",
  invalid: "Invalid",
  complained: "Spam complaint",
};

const DELIVERABILITY_TONE: Record<Deliverability, string> = {
  unknown: "",
  valid:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  soft_bounced:
    "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  hard_bounced:
    "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  invalid: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  complained:
    "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
};

// The NeverBounce result, shown next to (never instead of) the agent's own
// verification. Only "valid" counts as verified for the rotation.
const NEVERBOUNCE_LABEL: Record<NeverbounceResult, string> = {
  unchecked: "Not checked",
  valid: "NeverBounce: valid",
  invalid: "NeverBounce: invalid",
  disposable: "NeverBounce: disposable",
  catchall: "NeverBounce: catch-all",
  unknown: "NeverBounce: unknown",
};

const NEVERBOUNCE_TONE: Record<NeverbounceResult, string> = {
  unchecked: "bg-slate-100 text-slate-500 dark:bg-gray-700 dark:text-gray-300",
  valid:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  invalid: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  disposable:
    "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  catchall:
    "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  unknown:
    "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

const EVENT_LABEL: Record<string, string> = {
  added: "Added",
  confirmed: "Confirmed",
  unconfirmed: "Confirmation removed",
  sent: "Email sent",
  delivered: "Delivered",
  opened: "Opened",
  clicked: "Clicked",
  replied: "Replied",
  bounced: "Bounced",
  marked_invalid: "Marked invalid",
  unsubscribed: "Unsubscribed",
  complained: "Spam complaint",
  archived: "Deleted",
  restored: "Restored",
  deliverability_reset: "Reset to unknown",
  auto_verified: "Automated check (NeverBounce)",
  address_changed: "Address edited",
};

const METHOD_LABEL: Record<string, string> = {
  phone: "by phone",
  agent_promoted: "by agent",
  reply: "by reply",
  import: "on import",
};

function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Validation message for a typed address, or null when it is fine. */
function addressProblem(value: string): string | null {
  return !value ? "Enter an email address" : (emailRule()(value) ?? null);
}

const iconBtn =
  "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700";

const smallBtn =
  "cursor-pointer rounded border border-slate-300 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700";

const primaryBtn =
  "cursor-pointer rounded bg-sky-600 px-3 py-1 text-xs font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50";

const inputCls =
  "w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 outline-none focus:border-sky-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100";

/** Extra detail under an event, e.g. "old@x.com → new@x.com" for an edit. */
function eventDetail(event: LeadEmailEvent): string | null {
  const payload = (event.rawPayload ?? {}) as Record<string, unknown>;
  if (event.eventType === "address_changed") {
    const from = typeof payload.from === "string" ? payload.from : "";
    const to = typeof payload.to === "string" ? payload.to : "";
    return from || to ? `${from} → ${to}` : null;
  }
  if (event.eventType === "confirmed" && typeof payload.method === "string") {
    return METHOD_LABEL[payload.method] ?? null;
  }
  return typeof payload.note === "string" && payload.note ? payload.note : null;
}

function EventHistory({ leadId, emailId }: { leadId: string; emailId: string }) {
  const { data, isLoading, isError } = useLeadEmailEvents(leadId, emailId, true);
  if (isLoading) {
    return <p className="text-xs text-slate-400">Loading history…</p>;
  }
  if (isError || !data) {
    return <p className="text-xs text-rose-500">Could not load history.</p>;
  }
  if (data.length === 0) {
    return <p className="text-xs text-slate-400">No history yet.</p>;
  }
  return (
    <ul className="space-y-1">
      {data.map((event) => {
        const detail = eventDetail(event);
        return (
          <li
            key={event.id}
            className="flex flex-col gap-x-3 text-xs text-slate-600 sm:flex-row sm:items-baseline sm:justify-between dark:text-gray-300"
          >
            <span className="min-w-0">
              {EVENT_LABEL[event.eventType] ?? event.eventType}
              {detail ? (
                <span className="block break-all text-[11px] text-slate-400 dark:text-gray-500">
                  {detail}
                </span>
              ) : null}
            </span>
            <span className="shrink-0 text-slate-400 dark:text-gray-500">
              {formatDateTime(event.occurredAt)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function HistoryToggle({ leadId, emailId }: { leadId: string; emailId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-1.5 inline-flex cursor-pointer items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300"
      >
        {open ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        History
      </button>
      {open ? (
        <div className="mt-1 border-t border-slate-100 pt-1.5 dark:border-gray-700">
          <EventHistory leadId={leadId} emailId={emailId} />
        </div>
      ) : null}
    </>
  );
}

function EditAddressForm({
  item,
  saving,
  onSave,
  onCancel,
}: {
  item: LeadEmail;
  saving: boolean;
  onSave: (address: string) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(item.address);
  const [problem, setProblem] = useState<string | null>(null);
  const value = draft.trim();
  // Changing more than letter case makes it a different mailbox, so the
  // backend resets its verification — say so before the agent saves.
  const resetsVerification =
    value.toLowerCase() !== item.address.trim().toLowerCase() &&
    (item.confirmedByAgent || item.neverbounceResult !== "unchecked");

  const submit = async () => {
    if (value === item.address) {
      onCancel();
      return;
    }
    const error = addressProblem(value);
    if (error) {
      setProblem(error);
      return;
    }
    if (await onSave(value)) onCancel();
  };

  return (
    <div className="space-y-2">
      <input
        type="email"
        autoFocus
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
          setProblem(null);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void submit();
          } else if (event.key === "Escape") {
            event.preventDefault();
            onCancel();
          }
        }}
        aria-label={`Edit ${item.address}`}
        className={inputCls}
      />
      {problem ? <p className="text-xs text-rose-500">{problem}</p> : null}
      {resetsVerification ? (
        <p className="text-[11px] text-amber-600 dark:text-amber-400">
          A new address starts unverified. Confirm it again after saving.
        </p>
      ) : null}
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" className={smallBtn} onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          disabled={saving}
          className={primaryBtn}
          onClick={() => void submit()}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

function EmailRow({
  leadId,
  item,
  confirmMethod,
  busy,
  saving,
  onConfirm,
  onUnconfirm,
  onMarkInvalid,
  onReset,
  onDelete,
  onAutoVerify,
  onReplied,
  onChangeAddress,
}: {
  leadId: string;
  item: LeadEmail;
  confirmMethod: "phone" | "agent_promoted";
  busy: boolean;
  saving: boolean;
  onAutoVerify: (item: LeadEmail) => void;
  onReplied: (item: LeadEmail) => void;
  onConfirm: (item: LeadEmail) => void;
  onUnconfirm: (item: LeadEmail) => void;
  onMarkInvalid: (item: LeadEmail) => void;
  onReset: (item: LeadEmail) => void;
  onDelete: (item: LeadEmail) => void;
  onChangeAddress: (item: LeadEmail, address: string) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState(false);
  const confirmed = item.confirmedByAgent;
  const deliverabilityLabel = DELIVERABILITY_LABEL[item.deliverability];
  const activity = formatDate(item.lastActivityAt);
  const confirmedTitle =
    confirmed && item.agentConfirmedAt
      ? [
          `Confirmed ${formatDate(item.agentConfirmedAt)}`,
          item.agentConfirmationMethod
            ? METHOD_LABEL[item.agentConfirmationMethod]
            : null,
          item.agentName ? `by ${item.agentName}` : null,
        ]
          .filter(Boolean)
          .join(" ")
      : undefined;

  return (
    <li
      className={clsx(
        "@container rounded-lg border px-3 py-2",
        item.needsReverification
          ? "border-amber-300 bg-amber-50/60 dark:border-amber-700 dark:bg-amber-900/10"
          : "border-slate-200 bg-white dark:border-gray-700 dark:bg-gray-800",
        !item.eligible && !item.needsReverification && !editing && "opacity-70",
      )}
    >
      {editing ? (
        <EditAddressForm
          item={item}
          saving={saving}
          onSave={(address) => onChangeAddress(item, address)}
          onCancel={() => setEditing(false)}
        />
      ) : (
        // Stack the actions under the address when the row is narrow (e.g.
        // the Calls page side column) so the address is not squeezed.
        <div className="flex flex-col gap-2 @xs:flex-row @xs:items-start @xs:justify-between">
          <div className="flex min-w-0 items-start gap-2">
            {item.verified ? (
              <ShieldCheck
                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
                aria-label="Verified"
              />
            ) : (
              <CircleHelp
                className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 dark:text-gray-500"
                aria-label="Unverified"
              />
            )}
            <div className="min-w-0">
              <p className="break-all text-sm leading-5">
                <EmailLink value={item.address} wrap />
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span
                  className={clsx(
                    "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    confirmed
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                      : "bg-slate-100 text-slate-500 dark:bg-gray-700 dark:text-gray-300",
                  )}
                  title={confirmedTitle}
                >
                  {confirmed ? "Agent verified" : "Not agent-verified"}
                </span>
                <span
                  className={clsx(
                    "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    NEVERBOUNCE_TONE[item.neverbounceResult],
                  )}
                  title={
                    item.neverbounceCheckedAt
                      ? `Checked ${formatDate(item.neverbounceCheckedAt)}`
                      : "Not checked by NeverBounce yet"
                  }
                >
                  {NEVERBOUNCE_LABEL[item.neverbounceResult]}
                </span>
                {deliverabilityLabel ? (
                  <span
                    className={clsx(
                      "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      DELIVERABILITY_TONE[item.deliverability],
                    )}
                  >
                    {deliverabilityLabel}
                  </span>
                ) : null}
                {item.sendCount > 0 ? (
                  <span className="text-[11px] text-slate-400 dark:text-gray-500">
                    Sent {item.sendCount}×
                  </span>
                ) : null}
                {activity ? (
                  <span className="text-[11px] text-slate-400 dark:text-gray-500">
                    Last activity {activity}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-1 pl-6 @xs:pl-0">
            <button
              type="button"
              className={clsx(iconBtn, "hover:text-sky-600")}
              title="Edit address (the old one is kept in History)"
              aria-label={`Edit ${item.address}`}
              disabled={busy}
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            {confirmed ? (
              <button
                type="button"
                className={iconBtn}
                title="Remove confirmation"
                aria-label={`Remove confirmation from ${item.address}`}
                disabled={busy}
                onClick={() => onUnconfirm(item)}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                className={clsx(iconBtn, "hover:text-emerald-600")}
                title={
                  confirmMethod === "phone"
                    ? "Confirm (verified by phone)"
                    : "Confirm this address"
                }
                aria-label={`Confirm ${item.address}`}
                disabled={busy || !item.eligible}
                onClick={() => onConfirm(item)}
              >
                <Check className="h-3.5 w-3.5" />
              </button>
            )}
            {item.deliverability === "invalid" ? (
              <button
                type="button"
                className={iconBtn}
                title="Not invalid after all — reset"
                aria-label={`Reset ${item.address}`}
                disabled={busy}
                onClick={() => onReset(item)}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                className={clsx(iconBtn, "hover:text-rose-600")}
                title="Mark invalid (wrong person / mailbox gone)"
                aria-label={`Mark ${item.address} invalid`}
                disabled={busy || !item.eligible}
                onClick={() => onMarkInvalid(item)}
              >
                <Ban className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              className={clsx(iconBtn, "hover:text-emerald-600")}
              title="The lead replied from this address — stop the follow-ups"
              aria-label={`Mark a reply from ${item.address}`}
              disabled={busy}
              onClick={() => onReplied(item)}
            >
              <MessageSquareReply className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className={clsx(iconBtn, "hover:text-sky-600")}
              title="Check deliverability with NeverBounce now"
              aria-label={`Check ${item.address} with NeverBounce`}
              disabled={busy}
              onClick={() => onAutoVerify(item)}
            >
              <MailCheck className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className={clsx(iconBtn, "hover:text-rose-600")}
              title="Delete (can be recovered; history is kept)"
              aria-label={`Delete ${item.address}`}
              disabled={busy}
              onClick={() => onDelete(item)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {item.needsReverification && !editing ? (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-300">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          This confirmed address no longer accepts mail. Verify it with the
          contact again, or add a new one.
        </p>
      ) : null}

      <HistoryToggle leadId={leadId} emailId={item.id} />
    </li>
  );
}

/** Deleted addresses, kept with their history, each one restorable. */
function DeletedEmails({
  leadId,
  items,
  busy,
  onRestore,
}: {
  leadId: string;
  items: LeadEmail[];
  busy: boolean;
  onRestore: (item: LeadEmail) => void;
}) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;

  return (
    <div className="border-t border-slate-200 pt-2 dark:border-gray-600">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
        Deleted emails ({items.length})
      </button>
      {open ? (
        <ul className="mt-2 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 dark:border-gray-600 dark:bg-gray-800/60"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="min-w-0 flex-1 break-all text-sm leading-5 text-slate-500 line-through decoration-slate-400 dark:text-gray-400">
                  {item.address}
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onRestore(item)}
                  title="Restore — verification comes back as it was"
                  className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  <ArchiveRestore className="h-3.5 w-3.5" />
                  Restore
                </button>
              </div>
              {item.confirmedByAgent ? (
                <p className="mt-1 text-[11px] text-slate-400 dark:text-gray-500">
                  Was agent-verified; it will be again once restored.
                </p>
              ) : null}
              <HistoryToggle leadId={leadId} emailId={item.id} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * Every email address of a lead as its own record — verification, delivery
 * state, last activity — with the agent actions that matter: confirm (the Calls
 * page is where a phone call verifies an address), edit, mark invalid, delete
 * (recoverable), add. Edits and deletes are recorded in each address's History.
 *
 * While the backend feature flags are off the endpoints answer
 * LEAD_EMAILS_DISABLED and this renders the legacy comma-joined value instead.
 */
export function LeadEmailsCard({
  leadId,
  fallbackEmail,
  confirmMethod = "phone",
  brandCode,
  fallback,
}: Props) {
  const { data, isLoading, isError, error, refetch } = useLeadEmails(leadId);
  const add = useAddLeadEmail(leadId ?? "");
  const confirm = useConfirmLeadEmail(leadId ?? "");
  const unconfirm = useUnconfirmLeadEmail(leadId ?? "");
  const setDeliverability = useSetLeadEmailDeliverability(leadId ?? "");
  const archive = useArchiveLeadEmail(leadId ?? "");
  const restore = useRestoreLeadEmail(leadId ?? "");
  const changeAddress = useChangeLeadEmailAddress(leadId ?? "");
  const autoVerify = useAutoVerifyLeadEmail(leadId ?? "");
  const markReplied = useMarkReplied(leadId ?? "", brandCode);

  const [adding, setAdding] = useState(false);
  const [address, setAddress] = useState("");
  const [verified, setVerified] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<LeadEmail | null>(null);

  const busy =
    add.isPending ||
    confirm.isPending ||
    unconfirm.isPending ||
    setDeliverability.isPending ||
    archive.isPending ||
    restore.isPending ||
    changeAddress.isPending ||
    autoVerify.isPending ||
    markReplied.isPending;

  const run = async (action: () => Promise<unknown>, success: string) => {
    try {
      await action();
      showSuccessToast(success);
    } catch (err) {
      showErrorToast(err);
    }
  };

  if (!leadId) return null;

  if (isError && isLeadEmailsDisabled(error)) {
    if (fallback !== undefined) return <>{fallback}</>;
    const legacy = String(fallbackEmail ?? "").trim();
    return legacy ? (
      <EmailLink value={legacy} wrap />
    ) : (
      <span className="text-slate-400 dark:text-gray-500">
        No email on record
      </span>
    );
  }

  const submitAdd = async () => {
    const value = address.trim();
    const problem = addressProblem(value);
    if (problem) {
      setAddressError(problem);
      return;
    }
    setAddressError(null);
    try {
      await add.mutateAsync({ address: value, confirm: verified });
      showSuccessToast(verified ? "Email added and confirmed." : "Email added.");
      setAddress("");
      setVerified(false);
      setAdding(false);
    } catch (err) {
      showErrorToast(err);
    }
  };

  const restoreEmail = (row: LeadEmail) =>
    run(() => restore.mutateAsync(row.id), `${row.address} restored.`);

  const deleteEmail = async (row: LeadEmail) => {
    try {
      await archive.mutateAsync(row.id);
      setToDelete(null);
      toast.success(
        ({ closeToast }) => (
          <span className="flex items-center justify-between gap-3">
            <span className="break-all">{row.address} deleted.</span>
            <button
              type="button"
              className="shrink-0 cursor-pointer rounded border border-current px-2 py-0.5 text-xs font-semibold"
              onClick={() => {
                closeToast?.();
                void restoreEmail(row);
              }}
            >
              Undo
            </button>
          </span>
        ),
        { autoClose: 8000 },
      );
    } catch (err) {
      showErrorToast(err);
    }
  };

  const all = data ?? [];
  const items = all.filter((item) => !item.isArchived);
  const deleted = all.filter((item) => item.isArchived);

  return (
    <div className="space-y-2">
      {isLoading ? (
        <p className="text-sm text-slate-400 dark:text-gray-500">
          Loading emails…
        </p>
      ) : isError ? (
        <p className="text-sm text-rose-500">
          Could not load emails.{" "}
          <button
            type="button"
            className="cursor-pointer underline"
            onClick={() => void refetch()}
          >
            Retry
          </button>
        </p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-gray-500">
          No email on record
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <EmailRow
              key={item.id}
              leadId={leadId}
              item={item}
              confirmMethod={confirmMethod}
              busy={busy}
              saving={changeAddress.isPending}
              onConfirm={(row) =>
                void run(
                  () => confirm.mutateAsync({ id: row.id, method: confirmMethod }),
                  "Email confirmed.",
                )
              }
              onUnconfirm={(row) =>
                void run(
                  () => unconfirm.mutateAsync({ id: row.id }),
                  "Confirmation removed.",
                )
              }
              onMarkInvalid={(row) =>
                void run(
                  () =>
                    setDeliverability.mutateAsync({
                      id: row.id,
                      deliverability: "invalid",
                    }),
                  "Email marked invalid.",
                )
              }
              onReset={(row) =>
                void run(
                  () =>
                    setDeliverability.mutateAsync({
                      id: row.id,
                      deliverability: "unknown",
                    }),
                  "Email reset.",
                )
              }
              onDelete={setToDelete}
              onAutoVerify={(row) =>
                void run(
                  () => autoVerify.mutateAsync(row.id),
                  "Checked with NeverBounce.",
                )
              }
              onReplied={(row) =>
                void run(
                  () => markReplied.mutateAsync(row.id),
                  "Reply recorded — follow-up emails stopped for this lead.",
                )
              }
              onChangeAddress={async (row, next) => {
                try {
                  await changeAddress.mutateAsync({ id: row.id, address: next });
                  showSuccessToast("Email updated.");
                  return true;
                } catch (err) {
                  // Keep the form open with the draft so it can be fixed.
                  showErrorToast(err);
                  return false;
                }
              }}
            />
          ))}
        </ul>
      )}

      {adding ? (
        <div className="space-y-2 rounded-lg border border-dashed border-slate-300 p-3 dark:border-gray-600">
          <input
            type="email"
            autoFocus
            value={address}
            onChange={(event) => {
              setAddress(event.target.value);
              setAddressError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void submitAdd();
              }
            }}
            placeholder="name@company.com"
            aria-label="New email address"
            className={inputCls}
          />
          {addressError ? (
            <p className="text-xs text-rose-500">{addressError}</p>
          ) : null}
          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={verified}
              onChange={(event) => setVerified(event.target.checked)}
            />
            Verified with the contact
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className={smallBtn}
              onClick={() => {
                setAdding(false);
                setAddress("");
                setVerified(false);
                setAddressError(null);
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              className={primaryBtn}
              onClick={() => void submitAdd()}
            >
              {add.isPending ? "Adding…" : "Add email"}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-sky-600 hover:underline dark:text-sky-300"
        >
          <Plus className="h-3.5 w-3.5" />
          Add email
        </button>
      )}

      <DeletedEmails
        leadId={leadId}
        items={deleted}
        busy={busy}
        onRestore={(row) => void restoreEmail(row)}
      />

      <Confirmation
        open={Boolean(toDelete)}
        title="Delete this email?"
        description={
          toDelete
            ? `${toDelete.address} will no longer be used for this lead. You can recover it from "Deleted emails" below, and its history is kept.`
            : ""
        }
        confirmLabel="Delete"
        loadingLabel="Deleting..."
        loading={archive.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) void deleteEmail(toDelete);
        }}
      />
    </div>
  );
}
