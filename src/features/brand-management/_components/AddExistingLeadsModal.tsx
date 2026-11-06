import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Modal } from "@/components/ui";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import {
  runBackfillBatch,
  useBackfillPreview,
  type ManagedBrand,
} from "../_lib/hooks";

type Props = {
  brand: ManagedBrand | null;
  onClose: () => void;
};

export function AddExistingLeadsModal({ brand, onClose }: Props) {
  const queryClient = useQueryClient();
  const {
    data: preview,
    isLoading,
    isError,
  } = useBackfillPreview(brand?.id ?? null);
  const [added, setAdded] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  // Saved when the run starts: the preview can refetch mid-run and shrink.
  const [totalToAdd, setTotalToAdd] = useState(0);

  useEffect(() => {
    setAdded(0);
    setIsRunning(false);
    setTotalToAdd(0);
  }, [brand]);

  const canRun =
    !isRunning &&
    !isLoading &&
    (preview?.leadsToAdd ?? 0) > 0 &&
    (preview?.agentCount ?? 0) > 0;
  const percent =
    totalToAdd > 0 ? Math.min(100, Math.round((added / totalToAdd) * 100)) : 0;

  const handleRun = async () => {
    if (!brand || !canRun) return;
    setIsRunning(true);
    setAdded(0);
    setTotalToAdd(preview?.leadsToAdd ?? 0);

    let total = 0;
    try {
      // Small batches, so a dropped connection loses nothing: already added
      // leads are skipped on the next run.
      for (;;) {
        const batch = await runBackfillBatch(brand.id);
        total += batch.added;
        setAdded(total);
        if (batch.done) break;
      }
      showSuccessToast(`${total} leads added to ${brand.displayName}`);
      void queryClient.invalidateQueries({ queryKey: ["brands"] });
      onClose();
    } catch (error) {
      showErrorToast(error);
      void queryClient.invalidateQueries({
        queryKey: ["brands", "backfill-preview", brand.id],
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Modal
      isOpen={Boolean(brand)}
      title={`Add existing leads to ${brand?.displayName ?? ""}`}
      description={
        isRunning
          ? "Keep this window open until it finishes."
          : "Preview only. Nothing changes until you confirm."
      }
      onClose={() => {
        if (!isRunning) onClose();
      }}
      primaryAction={
        canRun || isRunning
          ? {
              label: isRunning ? `Adding... ${percent}%` : "Add Leads",
              onClick: () => void handleRun(),
            }
          : undefined
      }
      secondaryAction={{
        label: "Close",
        onClick: () => {
          if (!isRunning) onClose();
        },
      }}
    >
      <div className="grid gap-2 text-left text-sm text-slate-700 dark:text-slate-200">
        {isRunning && (
          <div className="mb-3 grid gap-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span>
                {added.toLocaleString()} of {totalToAdd.toLocaleString()} leads
                added
              </span>
              <span>{percent}%</span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
            >
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-300 dark:bg-indigo-400"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        )}

        {isLoading && <p>Counting leads...</p>}
        {isError && <p className="text-red-500">Could not load the preview.</p>}
        {preview && (
          <>
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
            {preview.agentCount === 0 && (
              <p className="mt-2 text-red-500">
                Assign at least one agent first.
              </p>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
