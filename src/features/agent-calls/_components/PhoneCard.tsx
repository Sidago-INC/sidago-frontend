import { CardShell } from "@/components/ui/CardShell";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Phone } from "lucide-react";

export function PhoneCard({ phone }: { phone: string }) {
  return (
    <CardShell>
      <SectionLabel className="mb-2 sm:mb-3">Phone</SectionLabel>
      <a
        href={`tel:${phone}`}
        className="group flex min-h-11 items-center gap-2 text-base font-bold text-sky-600 transition-colors hover:text-sky-500 sm:text-lg dark:text-sky-400"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 transition-colors group-hover:bg-sky-200 dark:bg-sky-900/40 dark:group-hover:bg-sky-900/60">
          <Phone className="h-4 w-4" />
        </span>
        {phone}
      </a>
    </CardShell>
  );
}
