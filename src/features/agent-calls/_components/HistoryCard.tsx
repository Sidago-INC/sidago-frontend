import { LucideIcon } from "lucide-react";
import { CardShell } from "@/components/ui/CardShell";
import { SectionLabel } from "@/components/ui/SectionLabel";

type Props = {
  title: string;
  value: string;
  icon: LucideIcon;
  className?: string;
};

export function HistoryCard({ title, value, icon, className }: Props) {
  return (
    <CardShell className={className}>
      <SectionLabel icon={icon} className="mb-3">
        {title}
      </SectionLabel>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600 dark:text-gray-300">
        {value || "-"}
      </p>
    </CardShell>
  );
}
