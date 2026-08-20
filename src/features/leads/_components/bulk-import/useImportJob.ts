import { useCallback, useEffect, useRef, useState } from "react";
import { showErrorToast } from "@/lib/toast";
import { fetchImportJob, startLeadImport } from "../../_lib/import";
import {
  IMPORT_JOB_GONE,
  type ImportJob,
  type ImportPlan,
  type LeadSheetMode,
} from "@/types/bulk-import.types";

// How often to ask the backend for progress while it is working. Analysis takes
// a couple of seconds; a commit of a few thousand rows runs for minutes.
const POLL_MS = 1200;

const STORAGE_KEY = "sidago.lead-import-job";

// The job id is kept so a browser refresh — or an accidental navigation away
// mid-review — resumes where the operator left off. The plan itself lives in
// the backend, so there is nothing else to persist. If the backend has since
// restarted, the id resolves to 404 and we fall back to the upload screen.
function loadStoredJobId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Statuses where the backend is still working and we should keep polling. */
function isWorking(status: ImportJob["status"]): boolean {
  return status === "analyzing" || status === "committing" || status === "running";
}

export type UseImportJob = {
  job: ImportJob | null;
  /** True while restoring a job id from a previous visit. */
  isRestoring: boolean;
  /** True between choosing a file and the backend accepting it. */
  isStarting: boolean;
  /** The job is gone — the backend restarted. Operator must upload again. */
  expired: boolean;
  start: (file: File, mode?: LeadSheetMode) => Promise<void>;
  refresh: () => Promise<void>;
  /** Apply a locally-known plan change without a round trip. */
  applyPlan: (update: (plan: ImportPlan) => ImportPlan) => void;
  reset: () => void;
};

export function useImportJob(): UseImportJob {
  const [job, setJob] = useState<ImportJob | null>(null);
  const [isRestoring, setIsRestoring] = useState<boolean>(() => Boolean(loadStoredJobId()));
  const [isStarting, setIsStarting] = useState(false);
  const [expired, setExpired] = useState(false);

  // Held in a ref as well as state so the poll loop always sees the current id
  // without having to re-subscribe the effect on every tick.
  const jobIdRef = useRef<string | null>(loadStoredJobId());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const clearStored = useCallback(() => {
    jobIdRef.current = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* private mode — the id simply will not survive a refresh */
    }
  }, []);

  const pull = useCallback(async (): Promise<ImportJob | null> => {
    const id = jobIdRef.current;
    if (!id) return null;
    try {
      const next = await fetchImportJob(id);
      if (!mountedRef.current) return null;
      setJob(next);
      setExpired(false);
      return next;
    } catch (error) {
      if (!mountedRef.current) return null;
      if (error instanceof Error && error.message === IMPORT_JOB_GONE) {
        // Not an error worth a toast — nothing was written, and the screen
        // explains what happened and offers the file picker again.
        clearStored();
        setJob(null);
        setExpired(true);
        return null;
      }
      showErrorToast(error);
      return null;
    }
  }, [clearStored]);

  // Restore a job left behind by a refresh.
  useEffect(() => {
    if (!jobIdRef.current) return;
    void pull().finally(() => {
      if (mountedRef.current) setIsRestoring(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll while the backend is working; stop as soon as it is not.
  useEffect(() => {
    if (!job || !isWorking(job.status)) return;
    timerRef.current = setTimeout(() => {
      void pull();
    }, POLL_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [job, pull]);

  const start = useCallback(
    async (file: File, mode?: LeadSheetMode) => {
      setIsStarting(true);
      setExpired(false);
      try {
        const { jobId } = await startLeadImport(file, mode);
        jobIdRef.current = jobId;
        try {
          localStorage.setItem(STORAGE_KEY, jobId);
        } catch {
          /* ignore */
        }
        await pull();
      } catch (error) {
        // A rejected file (missing column, too many rows) reports here. The
        // message names the column, so it is worth showing verbatim.
        showErrorToast(error);
      } finally {
        if (mountedRef.current) setIsStarting(false);
      }
    },
    [pull],
  );

  const applyPlan = useCallback((update: (plan: ImportPlan) => ImportPlan) => {
    setJob((prev) => (prev?.plan ? { ...prev, plan: update(prev.plan) } : prev));
  }, []);

  const reset = useCallback(() => {
    clearStored();
    setJob(null);
    setExpired(false);
    setIsRestoring(false);
  }, [clearStored]);

  // Stable identity — the page memoises its save handlers on this, and a new
  // function every render would rebuild them on every poll tick.
  const refresh = useCallback(async () => {
    await pull();
  }, [pull]);

  return { job, isRestoring, isStarting, expired, start, refresh, applyPlan, reset };
}
