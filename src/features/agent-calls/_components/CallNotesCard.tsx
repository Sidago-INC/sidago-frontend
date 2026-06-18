import { CardShell } from "@/components/ui/CardShell";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { StickyNote } from "lucide-react";

type Props = {
  notes: string;
  onChange: (value: string) => void;
  onSave: () => void;
};

export function CallNotesCard({ notes, onChange }: Props) {
  return (
    <CardShell>
      <SectionLabel icon={StickyNote} className="mb-3">
        Call Notes
      </SectionLabel>
      <textarea
        value={notes}
        onChange={(event) => onChange(event.target.value)}
        rows={5}
        placeholder="Add notes from this call..."
        className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition placeholder:text-slate-400 focus:border-sky-500 focus:outline-none ring-0 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder:text-gray-500"
      />
    </CardShell>
  );
}
