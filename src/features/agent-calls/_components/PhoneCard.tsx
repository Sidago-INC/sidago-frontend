import type { Lead } from "../_lib/data";
import { CardShell } from "@/components/ui/CardShell";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Phone } from "lucide-react";

export function PhoneCard({ currentLead }: { currentLead: Lead }) {
  return (
    <CardShell>
      <SectionLabel className="mb-3">Phone</SectionLabel>
      <a
        href={`tel:${currentLead.phone}`}
        className="group flex items-center gap-2 text-lg font-bold text-sky-600 transition-colors hover:text-sky-500 dark:text-sky-400"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 transition-colors group-hover:bg-sky-200 dark:bg-sky-900/40 dark:group-hover:bg-sky-900/60">
          <Phone className="h-4 w-4" />
        </span>
        {currentLead.phone}
      </a>
    </CardShell>
  );
}
