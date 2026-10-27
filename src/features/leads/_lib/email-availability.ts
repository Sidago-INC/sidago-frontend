import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { splitEmails } from "@/lib/validation";

// One email address belongs to one lead. The backend enforces it on save
// (409 EMAIL_IN_USE); this lets the Add Lead form say so while the user types.

export type EmailConflict = {
  address: string;
  leadId: string;
  leadName: string | null;
  companyName: string | null;
};

const ADDRESS = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Addresses typed more than once (any case) in the same form. */
export function repeatedAddresses(joined: string): string[] {
  const seen = new Map<string, number>();
  for (const a of splitEmails(joined)) {
    const key = a.trim().toLowerCase();
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  return [...seen].filter(([, n]) => n > 1).map(([a]) => a);
}

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** Other leads already holding any of the (well-formed) addresses. */
export function useEmailAvailability(joined: string, excludeLeadId?: string) {
  const valid = splitEmails(joined)
    .map((a) => a.trim())
    .filter((a) => ADDRESS.test(a));
  const key = useDebounced(valid.join(", "), 400);
  const query = useQuery({
    queryKey: ["email-availability", key, excludeLeadId ?? null],
    enabled: key.length > 0,
    queryFn: async () => {
      const q = new URLSearchParams({ emails: key });
      if (excludeLeadId) q.set("excludeLeadId", excludeLeadId);
      return (await api.get(`/leads/email-availability?${q}`)) as {
        available: boolean;
        conflicts: EmailConflict[];
      };
    },
    staleTime: 10_000,
  });
  return {
    conflicts: key.length > 0 ? (query.data?.conflicts ?? []) : [],
    checking: query.isFetching || key !== valid.join(", "),
  };
}
