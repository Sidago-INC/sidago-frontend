
import {
  Badge,
  Drawer,
  EmailLink,
  TypeBadge,
} from "@/components/ui";
import { getLeadGridLabel } from "@/features/backoffice-shared/constants";
import {
  BlockedEmailRow,
  getBlockedBrandLabel,
} from "../_lib/data";

type BlockedEmailDrawerProps = {
  row: BlockedEmailRow | null;
  onCancel: () => void;
  isUnblocking: boolean;
  onUnblock: (row: BlockedEmailRow) => void;
};

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
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

export function BlockedEmailDrawer({
  row,
  onCancel,
  isUnblocking,
  onUnblock,
}: BlockedEmailDrawerProps) {
  return (
    <Drawer
      isOpen={Boolean(row)}
      onClose={onCancel}
      direction="right"
      size="min(560px, 100vw)"
      header={
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
            Review Blocked Email
          </h2>
          <p className="truncate text-sm text-slate-500 dark:text-slate-400">
            {row ? getLeadGridLabel(row) : "Blocked email entry"}
          </p>
        </div>
      }
      footer={
        <div className="flex flex-col gap-2 bg-white px-5 py-4 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          {row && (
            <button
              type="button"
              onClick={() => onUnblock(row)}
              disabled={isUnblocking}
              className="cursor-pointer rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              {isUnblocking ? "Unblocking..." : "Unblock Email"}
            </button>
          )}
        </div>
      }
    >
      {row && (
        <dl className="grid gap-3">
          <DetailRow
            label="Lead ID"
            value={getLeadGridLabel(row)}
          />
          <DetailRow label="Company Name" value={row.companyName || "-"} />
          <DetailRow label="Full Name" value={row.fullName || "-"} />
          <DetailRow label="Email" value={row.email ? <EmailLink value={row.email} /> : "-"} />
          <DetailRow
            label="Contact Type"
            value={
              row.contactType ? (
                <TypeBadge value={row.contactType} kind="contact" />
              ) : (
                "-"
              )
            }
          />
          <DetailRow
            label="SVG Lead Type"
            value={
              row.leadTypeSvg ? (
                <TypeBadge value={row.leadTypeSvg} kind="lead" />
              ) : (
                "-"
              )
            }
          />
          <DetailRow
            label="Benton Lead Type"
            value={
              row.leadTypeBenton ? (
                <TypeBadge value={row.leadTypeBenton} kind="lead" />
              ) : (
                "-"
              )
            }
          />
          <DetailRow
            label="95RM Lead Type"
            value={
              row.leadType95rm ? (
                <TypeBadge value={row.leadType95rm} kind="lead" />
              ) : (
                "-"
              )
            }
          />
          <DetailRow
            label="Blocked Brands"
            value={
              <div className="flex flex-wrap gap-1.5">
                {row.blockedBrands.map((brand) => (
                  <Badge key={brand}>{getBlockedBrandLabel(brand)}</Badge>
                ))}
              </div>
            }
          />
        </dl>
      )}
    </Drawer>
  );
}
