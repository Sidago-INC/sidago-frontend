import { useMemo, useState } from "react";
import clsx from "clsx";
import { Archive, Phone, Plus, Star } from "lucide-react";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { leadPhonesApi } from "../_lib/api";
import {
  formatPhoneWithExtension,
  phoneActivity,
  sortPhones,
  STATUS_LABELS,
  STATUS_STYLES,
} from "../_lib/format";
import {
  isDialable,
  LEAD_PHONE_STATUSES,
  type LeadPhone,
  type LeadPhoneStatus,
} from "../_lib/types";
import { AddPhoneForm } from "./AddPhoneForm";

type Props = {
  leadId: string;
  phones: LeadPhone[];
  /** The number the next call will use, highlighted in the list. */
  nextPhoneId?: string | null;
  /** Called after any change so the owner can refetch its lead detail. */
  onChanged: () => void | Promise<unknown>;
};

/**
 * Every number a lead has, with its status, attempts and history, and the
 * actions on it: add, make preferred, change status, retire. Numbers are never
 * deleted - a retired number stays listed, folded away under "retired".
 */
export function LeadPhonesPanel({ leadId, phones, nextPhoneId, onChanged }: Props) {
  const [adding, setAdding] = useState(false);
  const [showRetired, setShowRetired] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmRetireId, setConfirmRetireId] = useState<string | null>(null);

  const sorted = useMemo(() => sortPhones(phones), [phones]);
  const live = sorted.filter((p) => p.retiredAt === null);
  const retired = sorted.filter((p) => p.retiredAt !== null);

  const run = async (phoneId: string, action: () => Promise<unknown>, done: string) => {
    setBusyId(phoneId);
    try {
      await action();
      await onChanged();
      showSuccessToast(done);
    } catch (error) {
      showErrorToast(error);
    } finally {
      setBusyId(null);
      setConfirmRetireId(null);
    }
  };

  return (
    <div className="space-y-2">
      {live.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          No phone numbers recorded yet.
        </p>
      ) : (
        live.map((phone) => (
          <PhoneRow
            key={phone.id}
            phone={phone}
            isNext={phone.id === nextPhoneId}
            busy={busyId === phone.id}
            confirmingRetire={confirmRetireId === phone.id}
            onMakePreferred={() =>
              run(
                phone.id,
                () => leadPhonesApi.update(phone.id, { isPreferred: true }),
                "Preferred number updated.",
              )
            }
            onStatusChange={(status) =>
              run(
                phone.id,
                () => leadPhonesApi.update(phone.id, { status }),
                "Number status updated.",
              )
            }
            onRetireRequest={() => setConfirmRetireId(phone.id)}
            onRetireCancel={() => setConfirmRetireId(null)}
            onRetireConfirm={() =>
              run(phone.id, () => leadPhonesApi.retire(phone.id), "Number retired.")
            }
          />
        ))
      )}

      {adding ? (
        <AddPhoneForm
          leadId={leadId}
          onCancel={() => setAdding(false)}
          onAdded={async () => {
            setAdding(false);
            await onChanged();
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-sky-700 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300"
        >
          <Plus className="h-3.5 w-3.5" />
          Add number
        </button>
      )}

      {retired.length > 0 ? (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowRetired((v) => !v)}
            className="cursor-pointer text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            {showRetired ? "Hide" : "Show"} retired numbers ({retired.length})
          </button>
          {showRetired ? (
            <div className="mt-2 space-y-2">
              {retired.map((phone) => (
                <PhoneRow key={phone.id} phone={phone} isNext={false} busy={false} />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function PhoneRow({
  phone,
  isNext,
  busy,
  confirmingRetire = false,
  onMakePreferred,
  onStatusChange,
  onRetireRequest,
  onRetireCancel,
  onRetireConfirm,
}: {
  phone: LeadPhone;
  isNext: boolean;
  busy: boolean;
  confirmingRetire?: boolean;
  onMakePreferred?: () => void;
  onStatusChange?: (status: LeadPhoneStatus) => void;
  onRetireRequest?: () => void;
  onRetireCancel?: () => void;
  onRetireConfirm?: () => void;
}) {
  const retired = phone.retiredAt !== null;
  const canPrefer = !retired && !phone.isPreferred && isDialable(phone);

  return (
    <div
      className={clsx(
        "rounded border px-3 py-2",
        retired
          ? "border-slate-200 bg-slate-100/60 opacity-70 dark:border-slate-700 dark:bg-slate-900/40"
          : "border-slate-200 bg-white dark:border-slate-700 dark:bg-gray-900",
        busy && "pointer-events-none opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span
              className={clsx(
                "select-all text-sm font-semibold text-slate-800 dark:text-slate-100",
                retired && "line-through",
              )}
            >
              {formatPhoneWithExtension(phone.phoneE164, phone.extension)}
            </span>
            {phone.isPreferred ? (
              <Tag className="border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300">
                Preferred
              </Tag>
            ) : null}
            {isNext ? (
              <Tag className="border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300">
                Next to dial
              </Tag>
            ) : null}
            <Tag className={STATUS_STYLES[phone.status]}>{STATUS_LABELS[phone.status]}</Tag>
            {phone.contactType === "Validated" ? (
              <Tag className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                Validated
              </Tag>
            ) : null}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {phoneActivity(phone)}
            {!retired && (phone.counterF > 0 || phone.counterB > 0)
              ? ` · no answers ${phone.counterF}, bad ${phone.counterB}`
              : ""}
          </p>
        </div>

        {!retired ? (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onMakePreferred}
              disabled={!canPrefer}
              title={
                phone.isPreferred
                  ? "This is the preferred number"
                  : canPrefer
                    ? "Make preferred"
                    : "Only an active number can be preferred"
              }
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-default disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Star className={clsx("h-3.5 w-3.5", phone.isPreferred && "fill-sky-500 text-sky-500")} />
            </button>
            <button
              type="button"
              onClick={onRetireRequest}
              title="Retire this number"
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded border border-slate-200 text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Archive className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}
      </div>

      {!retired ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <label className="text-[11px] text-slate-500 dark:text-slate-400" htmlFor={`status-${phone.id}`}>
            Status
          </label>
          <select
            id={`status-${phone.id}`}
            value={phone.status}
            onChange={(event) => onStatusChange?.(event.target.value as LeadPhoneStatus)}
            className="cursor-pointer rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] text-slate-700 dark:border-slate-700 dark:bg-gray-900 dark:text-slate-200"
          >
            {LEAD_PHONE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>

          {confirmingRetire ? (
            <span className="flex items-center gap-2 text-[11px]">
              <span className="text-slate-600 dark:text-slate-300">
                Retire? It stays on record but is never dialled.
              </span>
              <button
                type="button"
                onClick={onRetireConfirm}
                className="cursor-pointer font-semibold text-red-600 hover:text-red-700 dark:text-red-400"
              >
                Retire
              </button>
              <button
                type="button"
                onClick={onRetireCancel}
                className="cursor-pointer text-slate-500 hover:text-slate-700 dark:text-slate-400"
              >
                Cancel
              </button>
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Tag({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={clsx("rounded border px-1.5 py-px text-[10px] font-semibold", className)}>
      {children}
    </span>
  );
}
