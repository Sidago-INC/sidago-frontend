import clsx from "clsx";
import {
  Ban,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import { useState } from "react";
import { Confirmation } from "@/components/ui/Confirmation";
import { EmailLink } from "@/components/ui/EmailLink";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { email as emailRule } from "@/lib/validation";
import {
  isLeadEmailsDisabled,
  useAddLeadEmail,
  useArchiveLeadEmail,
  useConfirmLeadEmail,
  useLeadEmailEvents,
  useLeadEmails,
  useSetLeadEmailDeliverability,
  useUnconfirmLeadEmail,
} from "../_lib/hooks";
import type { Deliverability, LeadEmail } from "../_lib/types";

type Props = {
  leadId: string | null | undefined;
  /**
   * leads.email — shown read-only when the feature is switched off on the
   * server, so the card never makes a lead look like it has no email.
   */
  fallbackEmail?: string | null;
  /** How "Confirm" is recorded: the Calls page verifies by phone. */
  confirmMethod?: "phone" | "agent_promoted";
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
  archived: "Archived",
  restored: "Restored",
  deliverability_reset: "Reset to unknown",
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

const iconBtn =
  "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700";

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
      {data.map((event) => (
        <li
          key={event.id}
          className="flex items-baseline justify-between gap-3 text-xs text-slate-600 dark:text-gray-300"
        >
          <span>{EVENT_LABEL[event.eventType] ?? event.eventType}</span>
          <span className="shrink-0 text-slate-400 dark:text-gray-500">
            {formatDateTime(event.occurredAt)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function EmailRow({
  leadId,
  item,
  confirmMethod,
  busy,
  onConfirm,
  onUnconfirm,
  onMarkInvalid,
  onReset,
  onArchive,
}: {
  leadId: string;
  item: LeadEmail;
  confirmMethod: "phone" | "agent_promoted";
  busy: boolean;
  onConfirm: (item: LeadEmail) => void;
  onUnconfirm: (item: LeadEmail) => void;
  onMarkInvalid: (item: LeadEmail) => void;
  onReset: (item: LeadEmail) => void;
  onArchive: (item: LeadEmail) => void;
}) {
  const [open, setOpen] = useState(false);
  const confirmed = item.verification === "confirmed";
  const deliverabilityLabel = DELIVERABILITY_LABEL[item.deliverability];
  const activity = formatDate(item.lastActivityAt);

  return (
    <li
      className={clsx(
        "rounded-lg border px-3 py-2",
        item.needsReverification
          ? "border-amber-300 bg-amber-50/60 dark:border-amber-700 dark:bg-amber-900/10"
          : "border-slate-200 bg-white dark:border-gray-700 dark:bg-gray-800",
        !item.eligible && !item.needsReverification && "opacity-70",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          {confirmed ? (
            <ShieldCheck
              className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
              aria-label="Confirmed"
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
                title={
                  confirmed && item.confirmedAt
                    ? `Confirmed ${formatDate(item.confirmedAt)}${
                        item.confirmationMethod
                          ? ` ${METHOD_LABEL[item.confirmationMethod] ?? ""}`
                          : ""
                      }`
                    : undefined
                }
              >
                {confirmed ? "Confirmed" : "Unverified"}
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

        <div className="flex shrink-0 items-center gap-1">
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
            className={clsx(iconBtn, "hover:text-rose-600")}
            title="Archive (history is kept)"
            aria-label={`Archive ${item.address}`}
            disabled={busy}
            onClick={() => onArchive(item)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {item.needsReverification ? (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-300">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          This confirmed address no longer accepts mail. Verify it with the
          contact again, or add a new one.
        </p>
      ) : null}

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
          <EventHistory leadId={leadId} emailId={item.id} />
        </div>
      ) : null}
    </li>
  );
}

/**
 * Every email address of a lead as its own record — verification, delivery
 * state, last activity — with the agent actions that matter: confirm (the Calls
 * page is where a phone call verifies an address), mark invalid, archive, add.
 *
 * While the backend feature flags are off the endpoints answer
 * LEAD_EMAILS_DISABLED and this renders the legacy comma-joined value instead.
 */
export function LeadEmailsCard({
  leadId,
  fallbackEmail,
  confirmMethod = "phone",
}: Props) {
  const { data, isLoading, isError, error, refetch } = useLeadEmails(leadId);
  const add = useAddLeadEmail(leadId ?? "");
  const confirm = useConfirmLeadEmail(leadId ?? "");
  const unconfirm = useUnconfirmLeadEmail(leadId ?? "");
  const setDeliverability = useSetLeadEmailDeliverability(leadId ?? "");
  const archive = useArchiveLeadEmail(leadId ?? "");

  const [adding, setAdding] = useState(false);
  const [address, setAddress] = useState("");
  const [verified, setVerified] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [toArchive, setToArchive] = useState<LeadEmail | null>(null);

  const busy =
    add.isPending ||
    confirm.isPending ||
    unconfirm.isPending ||
    setDeliverability.isPending ||
    archive.isPending;

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
    const problem = !value ? "Enter an email address" : emailRule()(value);
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

  const items = data ?? [];

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
              onArchive={setToArchive}
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
            className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 outline-none focus:border-sky-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
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
              className="cursor-pointer rounded border border-slate-300 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
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
              className="cursor-pointer rounded bg-sky-600 px-3 py-1 text-xs font-medium text-white hover:bg-sky-500 disabled:opacity-50"
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

      <Confirmation
        open={Boolean(toArchive)}
        title="Archive this email?"
        description={
          toArchive
            ? `${toArchive.address} will no longer be used for this lead. Its history is kept and it can be added back later.`
            : ""
        }
        confirmLabel="Archive"
        loadingLabel="Archiving..."
        loading={archive.isPending}
        onCancel={() => setToArchive(null)}
        onConfirm={() => {
          const target = toArchive;
          if (!target) return;
          void run(() => archive.mutateAsync(target.id), "Email archived.").then(
            () => setToArchive(null),
          );
        }}
      />
    </div>
  );
}
