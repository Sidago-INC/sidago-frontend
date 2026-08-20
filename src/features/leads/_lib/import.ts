import { tokenService } from "@/lib/token";
import { api } from "@/lib/api";
import {
  IMPORT_JOB_GONE,
  type ImportJob,
  type LeadSheetMode,
  type PatchPlanCompany,
  type PatchPlanLead,
  type PlanCompany,
  type PlanLead,
} from "@/types/bulk-import.types";

const BASE_URL = import.meta.env.VITE_API_URL;

async function parseResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data: T | null = null;
  if (text) {
    try {
      data = JSON.parse(text) as T;
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const record = data as Record<string, unknown> | null;
    const errMsg =
      record?.error ??
      record?.message ??
      `Upload failed with status ${res.status}`;
    throw new Error(Array.isArray(errMsg) ? errMsg.join("; ") : String(errMsg));
  }

  return data as T;
}

/**
 * Step 1 — hand the file over. This does NOT import anything: the backend
 * parses it, resolves it against the CRM and parks a plan for review. A bad
 * file fails here with a message naming the missing column.
 *
 * `mode` is normally omitted — the sheet shape is detected from its headings.
 * Pass it only to override a detection the operator disagrees with.
 */
export async function startLeadImport(
  file: File,
  mode?: LeadSheetMode,
): Promise<{ jobId: string; mode: LeadSheetMode }> {
  await tokenService.waitForInit();
  const token = tokenService.getAccessToken();
  const formData = new FormData();
  formData.append("file", file);
  if (mode) formData.append("mode", mode);

  const res = await fetch(`${BASE_URL}/imports/leads`, {
    method: "POST",
    headers: { ...(token && { Authorization: `Bearer ${token}` }) },
    body: formData,
    credentials: "include",
  });

  return parseResponse<{ ok: boolean; jobId: string; mode: LeadSheetMode }>(res);
}

/**
 * Step 2 — poll for progress, then for the plan, then for the commit result.
 *
 * A 404 is not an ordinary failure: the plan lives in the backend's memory, so
 * a server restart drops it. It is re-thrown with a marker the caller turns
 * into "please upload the file again" instead of a generic error toast.
 */
export async function fetchImportJob(jobId: string): Promise<ImportJob> {
  try {
    const res = await api.get(`/imports/jobs/${jobId}`);
    return res as ImportJob;
  } catch (error) {
    if ((error as { status?: number })?.status === 404) {
      throw new Error(IMPORT_JOB_GONE);
    }
    throw error;
  }
}

/** Correct one staged lead. Returns the row as the backend re-normalised it. */
export async function patchImportLead(
  jobId: string,
  rowId: string,
  patch: PatchPlanLead,
): Promise<PlanLead> {
  const res = await api.patch(`/imports/jobs/${jobId}/leads/${rowId}`, patch);
  return (res as { lead: PlanLead }).lead;
}

/** Correct one staged company. Rejected for companies already in the CRM. */
export async function patchImportCompany(
  jobId: string,
  rowId: string,
  patch: PatchPlanCompany,
): Promise<PlanCompany> {
  const res = await api.patch(
    `/imports/jobs/${jobId}/companies/${rowId}`,
    patch,
  );
  return (res as { company: PlanCompany }).company;
}

/** Step 3 — approve. Returns immediately; poll the job for progress. */
export async function commitImport(
  jobId: string,
): Promise<{ jobId: string; total: number }> {
  const res = await api.post(`/imports/jobs/${jobId}/commit`, {});
  return res as { jobId: string; total: number };
}
