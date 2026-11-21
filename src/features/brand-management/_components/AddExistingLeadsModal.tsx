import { Modal } from "@/components/ui";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import {
  isJobActive,
  useBackfillJobs,
  useBackfillPreview,
  useStartBackfill,
  type ManagedBrand,
} from "../_lib/hooks";

type Props = {
  brand: ManagedBrand | null;
  onClose: () => void;
};

export function AddExistingLeadsModal({ brand, onClose }: Props) {
  const { data: preview, isFetching, isError } = useBackfillPreview(brand?.id ?? null);
  const { data: jobs = [] } = useBackfillJobs(Boolean(brand));
  const start = useStartBackfill();

  const runningJob = jobs.find((job) => job.brandId === brand?.id && isJobActive(job));

  const canRun =
    !runningJob &&
    !start.isPending &&
    !isFetching &&
    (preview?.leadsToAdd ?? 0) > 0 &&
    (preview?.agentCount ?? 0) > 0;

  const handleRun = async () => {
    if (!brand || !canRun) return;
    try {
      await start.mutateAsync(brand.id);
      showSuccessToast(
        `Adding leads to ${brand.displayName} in the background. Progress shows at the top of the page.`,
      );
      onClose();
    } catch (error) {
      showErrorToast(error);
    }
  };

  const perAgent = preview?.agents.perAgent ?? [];

  return (
    <Modal
      isOpen={Boolean(brand)}
      title={`Add existing leads to ${brand?.displayName ?? ""}`}
      description={
        runningJob
          ? "Leads are being added right now. Progress shows at the top of the page."
          : "Preview only. Nothing changes until you confirm. The run continues in the background if you close this window or reload."
      }
      onClose={onClose}
      primaryAction={
        canRun || start.isPending
          ? {
              label: start.isPending ? "Starting..." : "Add Leads",
              onClick: () => void handleRun(),
            }
          : undefined
      }
      secondaryAction={{ label: "Close", onClick: onClose }}
    >
      <div className="grid gap-2 text-left text-sm text-slate-700 dark:text-slate-200">
        {runningJob && (
          <p className="rounded border border-indigo-200 bg-indigo-50 p-3 text-indigo-800 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200">
            {runningJob.status === "queued"
              ? "Waiting for the automations service to start."
              : `${runningJob.added.toLocaleString()} of about ${runningJob.totalEstimate.toLocaleString()} leads added so far.`}
          </p>
        )}

        {isFetching && !preview && <p>Counting leads...</p>}
        {isError && <p className="text-red-500">Could not load the preview.</p>}
        {preview && !runningJob && (
          <div className={isFetching ? "opacity-60" : undefined}>
            <div className="flex justify-between gap-4 font-medium">
              <span>Leads to add</span>
              <span>{preview.leadsToAdd.toLocaleString()}</span>
            </div>
            {preview.statuses.map((row) => (
              <div key={row.status} className="flex justify-between gap-4">
                <span>Will start as {row.status}</span>
                <span>{row.count.toLocaleString()}</span>
              </div>
            ))}
            <div className="flex justify-between gap-4 text-slate-500 dark:text-slate-400">
              <span>Already in this brand</span>
              <span>{preview.alreadyInBrand.toLocaleString()}</span>
            </div>

            {perAgent.length > 0 && preview.leadsToAdd > 0 && (
              <div className="mt-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Where the leads land (estimate)
                </p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 dark:text-slate-400">
                      <th className="py-1 font-medium">Agent</th>
                      <th className="py-1 text-right font-medium">Share</th>
                      <th className="py-1 text-right font-medium">Has now</th>
                      <th className="py-1 text-right font-medium">Adding</th>
                      <th className="py-1 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {perAgent.map((agent) => (
                      <tr
                        key={agent.userId}
                        className="border-t border-slate-100 dark:border-slate-700"
                      >
                        <td className="py-1">{agent.name}</td>
                        <td className="py-1 text-right">
                          {agent.percent == null ? "-" : `${agent.percent}%`}
                        </td>
                        <td className="py-1 text-right">{agent.existing.toLocaleString()}</td>
                        <td className="py-1 text-right font-medium">
                          {agent.adding.toLocaleString()}
                        </td>
                        <td className="py-1 text-right">{agent.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.agents.otherAssignees > 0 && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {preview.agents.otherAssignees.toLocaleString()} On Hold leads go
                    to whoever already holds a Hot lead at the same company, outside
                    this brand's agents.
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Leads are added in batches, so the final split can differ by a
                  few leads.
                </p>
              </div>
            )}

            {preview.agentCount === 0 && (
              <p className="mt-2 text-red-500">Assign at least one agent first.</p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
