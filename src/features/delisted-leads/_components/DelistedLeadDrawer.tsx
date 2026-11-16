import { Badge, Drawer, EmailLink, TypeBadge } from "@/components/ui";
import { formatEasternDateTime } from "@/lib/est";
import { getLeadGridLabel } from "@/features/backoffice-shared/constants";
import { getDelistedBrandLabel, type DelistedLeadRow } from "../_lib/data";

type DelistedLeadDrawerProps = {
  row: DelistedLeadRow | null;
  onClose: () => void;
  onEditReason: (row: DelistedLeadRow) => void;
  onRestore: (row: DelistedLeadRow) => void;
  isRestoring: boolean;
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950/70">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">
        {value}
      </dd>
    </div>
  );
}

function formatDelistedAt(value: string | null): string {
  if (!value) return "-";
  return Number.isNaN(new Date(value).getTime()) ? value : formatEasternDateTime(value);
}

export function DelistedLeadDrawer({
  row,
  onClose,
  onEditReason,
  onRestore,
  isRestoring,
}: DelistedLeadDrawerProps) {
  return (
    <Drawer
      isOpen={Boolean(row)}
      onClose={onClose}
      direction="right"
      size="min(560px, 100vw)"
      header={
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
            Delisted Lead
          </h2>
          <p className="truncate text-sm text-slate-500 dark:text-slate-400">
            {row ? getLeadGridLabel(row) : "Delisted lead"}
          </p>
        </div>
      }
      footer={
        <div className="flex flex-col gap-2 bg-white px-5 py-4 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          >
            Close
          </button>
          {row && (
            <>
              <button
                type="button"
                onClick={() => onEditReason(row)}
                className="cursor-pointer rounded border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Edit Reason
              </button>
              <button
                type="button"
                onClick={() => onRestore(row)}
                disabled={isRestoring}
                className="cursor-pointer rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Restore Company
              </button>
            </>
          )}
        </div>
      }
    >
      {row && (
        <dl className="grid gap-3">
          <DetailRow label="Lead ID" value={getLeadGridLabel(row)} />
          <DetailRow label="Company" value={row.companyName || "-"} />
          <DetailRow label="Full Name" value={row.fullName || "-"} />
          <DetailRow label="Email" value={row.email ? <EmailLink value={row.email} /> : "-"} />
          <DetailRow
            label="Contact Type"
            value={
              row.contactType ? <TypeBadge value={row.contactType} kind="contact" /> : "-"
            }
          />
          <DetailRow
            label="Delisted Brands"
            value={
              <div className="flex flex-wrap gap-1.5">
                {row.delistedBrands.map((brand) => (
                  <Badge key={brand}>{getDelistedBrandLabel(brand)}</Badge>
                ))}
              </div>
            }
          />
          <DetailRow label="Delisted At" value={formatDelistedAt(row.delistedAt)} />
          <DetailRow label="Delisted By" value={row.delistedByName || "-"} />
          <DetailRow label="Reason" value={row.delistedReason || "-"} />
        </dl>
      )}
    </Drawer>
  );
}
