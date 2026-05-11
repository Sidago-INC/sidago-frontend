

import {
  Drawer,
  EditableField,
  Select,
  Textarea,
  TextInput,
} from "@/components/ui";
import {
  contactTypeOptions,
  leadTypeOptions,
} from "@/features/backoffice-shared/constants";
import { BlockedEmailRow } from "../_lib/data";

type BlockedEmailDrawerProps = {
  row: BlockedEmailRow | null;
  onCancel: () => void;
  onChange: (field: keyof BlockedEmailRow, value: string) => void;
  onReset: () => void;
  onSave: () => void;
  onUnblock: (row: BlockedEmailRow) => void;
};

const leadTypeSelectOptions = leadTypeOptions.map((value) => ({
  label: value,
  value,
}));
const contactTypeSelectOptions = contactTypeOptions.map((value) => ({
  label: value,
  value,
}));

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
  onChange,
  onReset,
  onSave,
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
            {row?.leadId ?? "Blocked email entry"}
          </p>
        </div>
      }
      footer={
        <div className="flex flex-col gap-2 bg-white px-5 py-4 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onReset}
            className="cursor-pointer rounded border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            className="cursor-pointer rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
          >
            Save
          </button>
          {row && (
            <button
              type="button"
              onClick={() => onUnblock(row)}
              className="cursor-pointer rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              Unblock Email
            </button>
          )}
        </div>
      }
    >
      {row && (
        <dl className="grid gap-3">
          <DetailRow label="Lead ID" value={row.leadId} />
          <EditableField label="Lead Type">
            <Select
              value={row.leadType}
              onChange={(value) => onChange("leadType", String(value))}
              options={leadTypeSelectOptions}
              className="text-sm font-medium"
            />
          </EditableField>
          <EditableField label="Contact Type">
            <Select
              value={row.contactType}
              onChange={(value) => onChange("contactType", String(value))}
              options={contactTypeSelectOptions}
              className="text-sm font-medium"
            />
          </EditableField>
          <EditableField label="Email">
            <TextInput
              type="email"
              value={row.email}
              onChange={(event) => onChange("email", event.target.value)}
              className="text-sm font-medium"
            />
          </EditableField>
          <EditableField label="Blocked Email">
            <TextInput
              type="email"
              value={row.blockedEmail}
              onChange={(event) => onChange("blockedEmail", event.target.value)}
              className="text-sm font-medium"
            />
          </EditableField>
          <DetailRow
            label="Blocked At"
            value={new Date(row.blockedAt).toLocaleString()}
          />
          <EditableField label="Reason" align="stack">
            <Textarea
              value={row.reason}
              onChange={(event) => onChange("reason", event.target.value)}
              rows={3}
              className="text-sm font-medium leading-5"
            />
          </EditableField>
        </dl>
      )}
    </Drawer>
  );
}
