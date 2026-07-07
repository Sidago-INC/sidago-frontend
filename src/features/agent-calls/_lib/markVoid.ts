import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { closedContactsTabs, type ClosedContactsTabKey } from "@/features/backoffice-closed-contacts/_lib/data";
import { agentCallsApi } from "./agentCallsApi";

type MarkVoidOptions = {
  successMessage?: string;
  onSuccess?: () => void;
};

export type BrandAgentSlug = "svg" | "benton" | "95rm";

export function isBrandAgentSlug(value: string | null | undefined): value is BrandAgentSlug {
  return value === "svg" || value === "benton" || value === "95rm";
}

export function resolveAgentSlugForClosedContacts(
  tabKey: ClosedContactsTabKey,
  rowBrand?: string,
): BrandAgentSlug | null {
  const tab = closedContactsTabs.find((entry) => entry.key === tabKey);
  if (tab?.brand) return tab.brand;

  const normalized = rowBrand?.trim().toLowerCase();
  if (normalized === "svg" || normalized === "benton" || normalized === "95rm") {
    return normalized;
  }
  if (normalized === "rm95") return "95rm";

  return null;
}

export function jsonEqualIgnoringKeys<T extends object>(
  left: T,
  right: T,
  keys: (keyof T)[],
): boolean {
  const omitKeys = (value: T) => {
    const copy = { ...value };
    for (const key of keys) {
      delete copy[key];
    }
    return copy;
  };

  return (
    JSON.stringify(omitKeys(left)) === JSON.stringify(omitKeys(right))
  );
}

export async function toggleMarkVoid(
  agentSlug: string,
  leadId: string,
  checked: boolean,
  options?: MarkVoidOptions,
): Promise<boolean> {
  if (!checked) return true;

  try {
    await agentCallsApi.markVoid(agentSlug, leadId, true);
    if (options?.successMessage) {
      showSuccessToast(options.successMessage);
    }
    options?.onSuccess?.();
    return true;
  } catch (error) {
    showErrorToast(error);
    return false;
  }
}
