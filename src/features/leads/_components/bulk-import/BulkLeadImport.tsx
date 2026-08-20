import { useCallback, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Wave } from "@/components/ui/Spinner";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import {
  commitImport,
  patchImportCompany,
  patchImportLead,
} from "../../_lib/import";
import type {
  PatchPlanCompany,
  PatchPlanLead,
} from "@/types/bulk-import.types";
import { useImportJob } from "./useImportJob";
import { ImportUploadPanel } from "./ImportUploadPanel";
import { ImportProgressPanel } from "./ImportProgressPanel";
import { ImportReview } from "./ImportReview";
import { ImportDonePanel } from "./ImportDonePanel";

/**
 * Bulk Lead Import — upload, review, approve.
 *
 * One file carries both the companies and the leads. Uploading it writes
 * nothing: the backend builds a plan of what WOULD be created, the operator
 * corrects anything wrong, and only the approve step touches the database.
 *
 * This replaced a page that imported on upload, which gave nobody a chance to
 * notice that a company was about to be created with a guessed timezone, or
 * that four of a row's five phone numbers had been dropped.
 */
export function BulkLeadImport() {
  const { job, isRestoring, isStarting, expired, start, refresh, applyPlan, reset } =
    useImportJob();
  const [savingRowId, setSavingRowId] = useState<string | null>(null);

  const handleStart = useCallback(
    (file: File) => {
      void start(file);
    },
    [start],
  );

  const handleSaveLead = useCallback(
    async (rowId: string, patch: PatchPlanLead) => {
      if (!job) return;
      setSavingRowId(rowId);
      try {
        const updated = await patchImportLead(job.id, rowId, patch);
        // Redraw from the response, never from what was typed — the backend
        // re-cleans the values (splits a phone list, applies "+1") and its
        // version is the one that will be imported.
        applyPlan((plan) => ({
          ...plan,
          leads: plan.leads.map((l) => (l.rowId === rowId ? updated : l)),
        }));
        await refresh();
      } catch (error) {
        showErrorToast(error);
      } finally {
        setSavingRowId(null);
      }
    },
    [job, refresh, applyPlan],
  );

  const handleSaveCompany = useCallback(
    async (rowId: string, patch: PatchPlanCompany) => {
      if (!job) return;
      setSavingRowId(rowId);
      try {
        const updated = await patchImportCompany(job.id, rowId, patch);
        applyPlan((plan) => ({
          ...plan,
          companies: plan.companies.map((c) => (c.rowId === rowId ? updated : c)),
        }));
        // A company edit can retime or exclude its leads, so pull the whole plan
        // back rather than guessing which rows moved.
        await refresh();
      } catch (error) {
        showErrorToast(error);
      } finally {
        setSavingRowId(null);
      }
    },
    [job, applyPlan, refresh],
  );

  const handleCommit = useCallback(async () => {
    if (!job) return;
    try {
      await commitImport(job.id);
      await refresh();
    } catch (error) {
      showErrorToast(error);
    }
  }, [job, refresh]);

  const handleDiscard = useCallback(() => {
    reset();
  }, [reset]);

  const handleStartAnother = useCallback(() => {
    const commit = job?.commit;
    if (commit && commit.leadsCreated > 0) {
      showSuccessToast(
        `${commit.leadsCreated} lead${commit.leadsCreated === 1 ? "" : "s"} imported.`,
      );
    }
    handleDiscard();
  }, [job?.commit, handleDiscard]);

  const renderBody = () => {
    if (isRestoring) {
      return (
        <div className="flex items-center justify-center py-16">
          <Wave />
        </div>
      );
    }

    if (job?.status === "failed") {
      return (
        <div className="mx-auto grid w-full max-w-xl gap-4 py-12 text-center">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            The import could not be completed
          </h2>
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-200">
            {job.error ?? "Something went wrong while processing the file."}
          </p>
          <div>
            <button
              type="button"
              onClick={handleDiscard}
              className="cursor-pointer inline-flex h-10 items-center rounded bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
            >
              Start over
            </button>
          </div>
        </div>
      );
    }

    if (job?.status === "analyzing") {
      return (
        <ImportProgressPanel
          phase="analyzing"
          processed={job.processed}
          total={job.total}
          fileName={job.plan?.fileName}
        />
      );
    }

    if (job?.status === "committing") {
      return (
        <ImportProgressPanel
          phase="committing"
          processed={job.processed}
          total={job.total}
          fileName={job.plan?.fileName}
        />
      );
    }

    if (job?.status === "completed" && job.commit) {
      return (
        <ImportDonePanel
          result={job.commit}
          fileName={job.plan?.fileName ?? ""}
          onStartAnother={handleStartAnother}
        />
      );
    }

    if (job?.status === "ready" && job.plan) {
      return (
        <ImportReview
          plan={job.plan}
          savingRowId={savingRowId}
          isCommitting={false}
          onSaveLead={handleSaveLead}
          onSaveCompany={handleSaveCompany}
          onCommit={handleCommit}
          onCancel={handleDiscard}
        />
      );
    }

    return (
      <ImportUploadPanel
        isStarting={isStarting}
        expired={expired}
        onStart={handleStart}
      />
    );
  };

  return (
    <div className="mx-auto flex h-full min-h-0 w-full flex-col px-4 py-6 lg:px-6">
      <Card className="flex min-h-0 flex-1 flex-col rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
          <div className="shrink-0 border-b border-slate-200 px-5 py-4 dark:border-slate-700 sm:px-6">
            <div className="max-w-2xl">
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Bulk Lead Import
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Upload one file — new companies and their leads are created
                together, after you review them.
              </p>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="min-w-0 px-5 py-5 sm:px-6 sm:py-6">{renderBody()}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
