import type { SmsStatus } from "../_lib/data";

const SMS_STATUS_STYLES: Record<SmsStatus, string> = {
  "1st":
    "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  "2nd":
    "border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300",
  "3rd":
    "border-violet-200 bg-violet-100 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300",
  finished:
    "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
};

export function AgentSmsStatusBadge({ status }: { status: SmsStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${SMS_STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}
