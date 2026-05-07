import { Button } from "@/components/ui";
import { CardShell } from "@/components/ui/CardShell";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Save, StickyNote } from "lucide-react";

type Props = {
  notes: string;
  onChange: (value: string) => void;
  onSave: () => void;
};

export function CallNotesCard({ notes, onChange, onSave }: Props) {
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
      <div className="mt-3 flex justify-end">
        <Button
          onClick={onSave}
          className="flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-200 transition-all hover:bg-sky-500 dark:shadow-sky-900/40 cursor-pointer"
        >
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </CardShell>
  );
}
