import { tokenService } from "@/lib/token";
import type { LeadImportResult } from "@/types/lead-import.types";
import type { LeadImportRow } from "@/types/lead-import.types";

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
    throw new Error(
      Array.isArray(errMsg) ? errMsg.join("; ") : String(errMsg),
    );
  }

  return data as T;
}

export async function uploadLeadImportFile(
  file: File,
): Promise<LeadImportResult> {
  await tokenService.waitForInit();
  const token = tokenService.getAccessToken();
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/imports/leads`, {
    method: "POST",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
    credentials: "include",
  });

  return parseResponse<LeadImportResult>(res);
}

type SingleImportResponse = {
  ok: boolean;
  status: "imported" | "duplicate" | "invalid" | "incomplete" | "company_not_exist";
  validationErrors?: { field: string; error: string }[];
  reason?: string;
};

export async function submitSingleLeadRow(
  row: LeadImportRow,
): Promise<SingleImportResponse> {
  await tokenService.waitForInit();
  const token = tokenService.getAccessToken();

  const res = await fetch(`${BASE_URL}/imports/leads/single`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(row),
    credentials: "include",
  });

  return parseResponse<SingleImportResponse>(res);
}
