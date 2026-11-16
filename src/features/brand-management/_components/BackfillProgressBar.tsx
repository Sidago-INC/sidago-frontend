import { useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSuperOwner } from "@/hooks/useBrandCatalog";
import { useAuth } from "@/providers/AuthProvider";
import { Confirmation, Modal } from "@/components/ui";
import { showErrorToast } from "@/lib/toast";
import {
  isJobActive,
  useBackfillJobs,
  useCancelBackfill,
  type BackfillJob,
} from "../_lib/hooks";

const DISMISSED_KEY = "sidago.backfill.dismissed";

function readDismissed(): string[] {
  try {
    const raw = window.localStorage.getItem(DISMISSED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeDismissed(ids: string[]) {
  try {
    window.localStorage.setItem(DISMISSED_KEY, JSON.stringify(ids.slice(-50)));
  } catch {
    // Storage blocked: the finished bar just shows again after a reload.
  }
}

// A running job that hasn't moved for 2 minutes has lost its worker; the
// automations service picks it up again within about a minute.
function isStalled(job: BackfillJob) {
  return (
    job.status === "running" &&
    job.heartbeatAt != null &&
    Date.now() - new Date(job.heartbeatAt).getTime() > 2 * 60_000
  );
}

function jobTitle(job: BackfillJob) {
  switch (job.kind) {
    case "brand-agent-handover":
      return `Moving a removed agent's leads on ${job.brandName}`;
    case "redistribution.agents-changed":
      return `Rebalancing ${job.brandName} to the new shares`;
    default:
      return `Adding existing leads to ${job.brandName}`;
  }
}

function describe(job: BackfillJob) {
  const added = job.added.toLocaleString();
  const total = job.totalEstimate.toLocaleString();
  if (job.kind === "redistribution.agents-changed") {
    switch (job.status) {
      case "failed":
        return `Failed: ${job.error ?? "unknown error"}`;
      case "done":
        return `Finished. ${added} leads moved.`;
      default:
        return "Moving leads between agents...";
    }
  }
  if (job.kind === "brand-agent-handover") {
    switch (job.status) {
      case "queued":
        return "Waiting for the automations service to start...";
      case "running":
        return isStalled(job)
          ? `${added} moved. Paused, it resumes automatically.`
          : `${added} of ${total} leads moved`;
      case "failed":
        return `Failed after ${added} leads: ${job.error ?? "unknown error"}`;
      default:
        return `Finished. ${added} leads moved.`;
    }
  }
  switch (job.status) {
    case "queued":
      return "Waiting for the automations service to start...";
    case "running":
      return isStalled(job)
        ? `${added} added. Paused, it resumes automatically.`
        : `${added} of about ${total} leads added`;
    case "done":
      return `Finished. ${added} leads added.`;
    case "cancelled":
      return `Stopped. ${added} leads were added before it stopped.`;
    case "failed":
      return `Failed after ${added} leads: ${job.error ?? "unknown error"}`;
  }
}

// Waiting runs, and rebalancing (which doesn't know its total upfront), show a
// pulsing bar instead of a percent.
function isIndeterminate(job: BackfillJob) {
  return (
    job.status === "queued" ||
    (job.kind === "redistribution.agents-changed" && job.status === "running")
  );
}

function jobPercent(job: BackfillJob) {
  if (job.status === "done") return 100;
  return job.totalEstimate > 0
    ? Math.min(100, Math.round((job.processed / job.totalEstimate) * 100))
    : 0;
}

function barColorOf(job: BackfillJob) {
  return job.status === "failed"
    ? "bg-red-500"
    : job.status === "cancelled"
      ? "bg-slate-400"
      : job.status === "done"
        ? "bg-emerald-500"
        : "bg-indigo-500";
}

const STATUS_LABEL: Record<BackfillJob["status"], string> = {
  queued: "Waiting to start",
  running: "Running",
  done: "Finished",
  cancelled: "Stopped",
  failed: "Failed",
};

function formatTime(value: string | null) {
  return value ? new Date(value).toLocaleString() : "-";
}

function formatDuration(from: string | null, to: string | null) {
  if (!from) return "-";
  const ms = (to ? new Date(to).getTime() : Date.now()) - new Date(from).getTime();
  const seconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(seconds / 60);
  return minutes > 0 ? `${minutes} min ${seconds % 60} s` : `${seconds} s`;
}

function StopConfirmation({
  job,
  open,
  onClose,
}: {
  job: BackfillJob;
  open: boolean;
  onClose: () => void;
}) {
  const cancel = useCancelBackfill();
  return (
    <Confirmation
      open={open}
      title={`Stop adding leads to ${job.brandName}?`}
      description="The batch in progress is undone and the run stops. Leads already added stay. You can start again later and it skips them."
      confirmLabel="Stop"
      loadingLabel="Stopping..."
      loading={cancel.isPending}
      onCancel={onClose}
      onConfirm={() =>
        cancel.mutate(job.id, {
          onSuccess: onClose,
          onError: (error) => showErrorToast(error),
        })
      }
    />
  );
}

// The run's details, opened by clicking its bar. Reads the same polled job, so
// the numbers keep moving while it is open.
function JobDetailsModal({ job, onClose }: { job: BackfillJob; onClose: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const active = isJobActive(job);
  const percent = jobPercent(job);
  const skipped = Math.max(0, job.processed - job.added);

  const status: [string, string] = [
    "Status",
    isStalled(job) ? "Paused, it resumes automatically" : STATUS_LABEL[job.status],
  ];
  const times: [string, string][] = [
    ["Queued at", formatTime(job.createdAt)],
    ["Started at", formatTime(job.startedAt ?? job.createdAt)],
    ["Finished at", formatTime(job.finishedAt)],
    ["Duration", formatDuration(job.startedAt ?? job.createdAt, job.finishedAt)],
  ];
  const rows: [string, string][] =
    job.kind === "brand-backfill"
      ? [
          status,
          ["Leads to add (estimate)", job.totalEstimate.toLocaleString()],
          ["Leads checked", job.processed.toLocaleString()],
          ["Leads added", job.added.toLocaleString()],
          ...(skipped > 0
            ? ([["Skipped (already in the brand)", skipped.toLocaleString()]] as [
                string,
                string,
              ][])
            : []),
          ...times,
        ]
      : job.kind === "brand-agent-handover"
        ? [
            status,
            ["Leads to move", job.totalEstimate.toLocaleString()],
            ["Leads moved", job.added.toLocaleString()],
            ...times,
          ]
        : [status, ["Leads moved", job.added.toLocaleString()], ...times];

  return (
    <>
      {/* Hidden while the Stop confirmation is up: it sits below the modal's layer. */}
      <Modal
        isOpen={!confirming}
        title={jobTitle(job)}
        description={
          active
            ? "Running in the background. You can close this window or reload the page; it keeps going."
            : describe(job)
        }
        onClose={onClose}
        primaryAction={
          active && job.kind === "brand-backfill"
            ? { label: "Stop", onClick: () => setConfirming(true) }
            : undefined
        }
        secondaryAction={{ label: "Close", onClick: onClose }}
      >
        <div className="grid gap-2 text-left text-sm text-slate-700 dark:text-slate-200">
          <div className="mb-3 grid gap-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span>
                {job.kind === "brand-backfill" && job.status !== "queued"
                  ? `${job.added.toLocaleString()} of about ${job.totalEstimate.toLocaleString()} leads added`
                  : describe(job)}
              </span>
              {!isIndeterminate(job) && <span>{percent}%</span>}
            </div>
            <div
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColorOf(job)} ${
                  isIndeterminate(job) ? "animate-pulse" : ""
                }`}
                style={{
                  width: `${isIndeterminate(job) ? 100 : percent}%`,
                  opacity: isIndeterminate(job) ? 0.35 : 1,
                }}
              />
            </div>
          </div>
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4">
              <span className="text-slate-500 dark:text-slate-400">{label}</span>
              <span className="text-right font-medium">{value}</span>
            </div>
          ))}
          {job.status === "failed" && job.error && (
            <p className="mt-2 rounded border border-red-200 bg-red-50 p-3 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              {job.error}
            </p>
          )}
        </div>
      </Modal>
      <StopConfirmation job={job} open={confirming} onClose={() => setConfirming(false)} />
    </>
  );
}

function JobRow({
  job,
  onDismiss,
  onOpen,
}: {
  job: BackfillJob;
  onDismiss: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const active = isJobActive(job);
  const percent = jobPercent(job);
  const barColor = barColorOf(job);

  return (
    <div className="flex items-center gap-3 px-4 py-2 text-xs sm:px-6">
      <button
        type="button"
        onClick={() => onOpen(job.id)}
        title="Show details"
        className="min-w-0 flex-1 cursor-pointer rounded text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3">
          <span className="truncate font-semibold text-slate-800 dark:text-slate-100">
            {jobTitle(job)}
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            {describe(job)}
            {active && job.status === "running" && !isStalled(job) && ` · ${percent}%`}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label={jobTitle(job)}
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor} ${
              isIndeterminate(job) ? "animate-pulse" : ""
            }`}
            style={{
              width: `${isIndeterminate(job) ? 100 : percent}%`,
              opacity: isIndeterminate(job) ? 0.35 : 1,
            }}
          />
        </div>
      </button>
      {active ? (
        // Only adding leads can be stopped: a half-done handover would leave
        // leads with an agent who can't call them.
        job.kind === "brand-backfill" && (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="shrink-0 rounded border border-slate-300 px-2.5 py-1 font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Stop
        </button>
        )
      ) : (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => onDismiss(job.id)}
          className="shrink-0 rounded p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <StopConfirmation job={job} open={confirming} onClose={() => setConfirming(false)} />
    </div>
  );
}

// Strip under the header, on every page, while a Super Owner has a brand run
// going: adding leads, moving a removed agent's leads, or rebalancing. The run happens in the automations service, so closing the
// modal, reloading or navigating away doesn't stop it.
export function BackfillProgressBar() {
  const { user } = useAuth();
  const { isSuperOwner } = useSuperOwner(user?.role === "admin");
  const { data: jobs = [] } = useBackfillJobs(isSuperOwner);
  const queryClient = useQueryClient();
  const [dismissed, setDismissed] = useState<string[]>(readDismissed);
  const [openJobId, setOpenJobId] = useState<string | null>(null);
  const openJob = jobs.find((job) => job.id === openJobId) ?? null;
  const previous = useRef(new Map<string, string>());

  // When a run finishes, refresh the screens that show brand lead counts.
  useEffect(() => {
    let finished = false;
    for (const job of jobs) {
      const before = previous.current.get(job.id);
      if (before && before !== job.status && !isJobActive(job)) finished = true;
      previous.current.set(job.id, job.status);
    }
    if (finished) {
      void queryClient.invalidateQueries({ queryKey: ["brands", "managed"] });
      void queryClient.invalidateQueries({ queryKey: ["brands", "backfill-preview"] });
    }
  }, [jobs, queryClient]);

  const visible = jobs.filter((job) => isJobActive(job) || !dismissed.includes(job.id));
  if (!isSuperOwner || visible.length === 0) return null;

  return (
    <div className="border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-gray-900/90">
      {visible.map((job) => (
        <JobRow
          key={job.id}
          job={job}
          onOpen={setOpenJobId}
          onDismiss={(id) => {
            const next = [...dismissed, id];
            setDismissed(next);
            writeDismissed(next);
          }}
        />
      ))}
      {openJob && <JobDetailsModal job={openJob} onClose={() => setOpenJobId(null)} />}
    </div>
  );
}
