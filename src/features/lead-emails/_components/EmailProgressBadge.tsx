import clsx from "clsx";
import {
  emailStageLabel,
  progressLabel,
  type BrandEmailProgress,
} from "../_lib/progress";

/**
 * A brand's email position, the same everywhere: "Sent 2/3 · next: 3rd email",
 * "Contract 1/3 · next: Resend contract", or "Sent 3/3 · Finished".
 */
export function EmailProgressBadge({
  email,
  brandLabel,
  compact = false,
}: {
  email: BrandEmailProgress | null | undefined;
  /** Prefix such as "SVG" where several brands are shown side by side. */
  brandLabel?: string;
  /** Only "Sent 2/3", for table cells. */
  compact?: boolean;
}) {
  if (!email) {
    return <span className="text-xs text-slate-400 dark:text-gray-500">-</span>;
  }
  const { progress, stage } = email;
  const finished = stage === "finished";
  const tone = !progress
    ? "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
    : finished
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
      : progress.workflow === "hot"
        ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
        : "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300";

  const main = progress ? progressLabel(progress) : emailStageLabel(stage);
  const detail = !progress
    ? null
    : finished
      ? "Finished"
      : `next: ${emailStageLabel(stage)}`;
  const title = [
    brandLabel,
    progress ? progressLabel(progress) : null,
    `Stage: ${emailStageLabel(stage)}`,
    email.lastSentAt
      ? `Last sent ${new Date(email.lastSentAt).toLocaleDateString("en-US")}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[11px] font-semibold",
        tone,
      )}
      title={title}
    >
      {brandLabel ? <span className="opacity-70">{brandLabel}</span> : null}
      {main}
      {!compact && detail ? (
        <span className="font-normal opacity-80">· {detail}</span>
      ) : null}
    </span>
  );
}
