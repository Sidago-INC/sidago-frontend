import { useState } from "react";
import clsx from "clsx";
import { Phone, Plus } from "lucide-react";
import { CardShell } from "@/components/ui/CardShell";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { AddPhoneForm } from "@/features/lead-phones/_components/AddPhoneForm";
import {
  formatPhone,
  formatPhoneWithExtension,
  phoneActivity,
  sortPhones,
  STATUS_LABELS,
} from "@/features/lead-phones/_lib/format";
import { isDialable, type LeadPhone } from "@/features/lead-phones/_lib/types";

type Props = {
  leadId: string;
  /** Every number the lead has (from the lead detail). Empty until it loads. */
  phones: LeadPhone[];
  /** The number the agent is about to dial; its id is sent with the result. */
  selectedId: string | null;
  onSelect: (phoneId: string) => void;
  /** The lead's primary number from the queue row, shown while the detail loads
   *  or for a lead with no number rows. Null when it has no live number at all. */
  fallbackPhone: string | null;
  fallbackExtension?: string | null;
  onAdded: () => void | Promise<unknown>;
};

// Display only. Deliberately NOT a tel: link — the CRM no longer initiates
// calls, so clicking the number must not hand off to a phone app. `select-all`
// lets one click highlight the whole number for copying into the dialler.
//
// The number shown is the one rotation picked for this attempt. The agent can
// switch to another live number; whichever is selected is the one the call
// result is recorded against.
export function PhoneCard({
  leadId,
  phones,
  selectedId,
  onSelect,
  fallbackPhone,
  fallbackExtension,
  onAdded,
}: Props) {
  const [adding, setAdding] = useState(false);
  const selected = phones.find((p) => p.id === selectedId) ?? null;
  const others = sortPhones(phones).filter((p) => p.id !== selectedId && isDialable(p));
  // Counted the way the grids and the phones panel count them: every live
  // number. The ones that cannot be dialled are not listed above, so say so.
  const live = phones.filter((p) => p.retiredAt === null);
  const notDialable = live.filter((p) => !isDialable(p)).length;

  const shown = selected
    ? formatPhoneWithExtension(selected.phoneE164, selected.extension)
    : formatPhoneWithExtension(fallbackPhone, fallbackExtension) || fallbackPhone || "";

  return (
    <CardShell>
      <SectionLabel className="mb-2 sm:mb-3">
        Phone
        {live.length > 1 ? (
          <span className="normal-case tracking-normal text-slate-400">
            · {live.length} numbers
            {notDialable > 0 ? ` (${notDialable} not dialable)` : ""}
          </span>
        ) : null}
      </SectionLabel>
      <div className="flex min-h-11 items-center gap-2 text-base font-bold text-slate-800 sm:text-lg dark:text-gray-100">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-gray-800">
          <Phone className="h-4 w-4 text-slate-500 dark:text-gray-400" />
        </span>
        <span className="select-all">{shown || "—"}</span>
      </div>

      {selected ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">
          {[
            selected.isPreferred ? "Preferred" : null,
            selected.status !== "active" ? STATUS_LABELS[selected.status] : null,
            selected.contactType === "Validated" ? "Validated" : null,
            phoneActivity(selected),
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      ) : null}

      {others.length > 0 ? (
        <div className="mt-3">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-gray-500">
            Other numbers
          </p>
          <div className="flex flex-wrap gap-1.5">
            {others.map((phone) => (
              <button
                key={phone.id}
                type="button"
                onClick={() => onSelect(phone.id)}
                title={`Dial this number instead - ${phoneActivity(phone)}`}
                className={clsx(
                  "cursor-pointer rounded border px-2 py-1 text-xs font-medium transition",
                  "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50",
                  "dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-sky-700 dark:hover:bg-sky-950/40",
                )}
              >
                {formatPhone(phone.phoneE164)}
                {phone.isPreferred ? " ★" : ""}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-3">
        {adding ? (
          <AddPhoneForm
            leadId={leadId}
            onCancel={() => setAdding(false)}
            onAdded={async () => {
              setAdding(false);
              await onAdded();
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
      </div>
    </CardShell>
  );
}
