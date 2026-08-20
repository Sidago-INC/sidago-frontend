import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Download, FileSpreadsheet, Upload, ShieldCheck } from "lucide-react";
import { downloadWorkbook } from "@/lib/excel";

const FILE_INPUT_ACCEPT =
  ".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv";

// The two real sheet shapes, each with its own single-sheet template.
//
// One template per shape rather than one workbook with two tabs: the importer
// reads only the FIRST worksheet, so a two-tab template invites someone to fill
// in the second one and upload a file the backend never looks at.
//
// The operator still does not have to classify their file on upload — the shape
// is detected from the headings. This choice is only about which starting point
// to download.
const SHEET_SHAPES = [
  {
    key: "person",
    title: "Simple leads",
    description: "A named person at a company — the usual lead list.",
    note: "New companies are created as EST / USA.",
    fileName: "sidago-simple-lead-import-template.xlsx",
    sheetName: "Simple Leads",
    columns: ["Symbol", "Company Name", "Name", "Role", "Email", "Phone Number"],
    sample: {
      Symbol: "NASDAQ: EXMPL",
      "Company Name": "Example Corp",
      Name: "Jamie Carter",
      Role: "Operations Manager",
      Email: "jamie.carter@example.com, j.carter@example.net",
      "Phone Number": "(617) 555-0148, (617) 555-0149",
    } as Record<string, string>,
  },
  {
    key: "company",
    title: "Company leads",
    description: "The company switchboard itself — no person, no role.",
    note: "Timezone and country come from the file. Leads are named “Company”.",
    fileName: "sidago-company-lead-import-template.xlsx",
    sheetName: "Company Leads",
    columns: ["Symbol", "Company Name", "Country", "Email", "Phone", "Timezone"],
    sample: {
      Symbol: "NYSE : EXMPL",
      "Company Name": "Example Corp",
      Country: "USA",
      Email: "investors@example.com",
      Phone: "877-555-0100",
      Timezone: "CST",
    } as Record<string, string>,
  },
] as const;

type Props = {
  isStarting: boolean;
  expired: boolean;
  onStart: (file: File) => void;
};

export function ImportUploadPanel({ isStarting, expired, onStart }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onStart(file);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (isStarting) return;
    const file = event.dataTransfer.files?.[0];
    if (file) onStart(file);
  };

  const handleTemplateDownload = async (shape: (typeof SHEET_SHAPES)[number]) => {
    await downloadWorkbook(shape.fileName, [
      {
        kind: "object",
        name: shape.sheetName,
        columns: [...shape.columns],
        rows: [shape.sample],
      },
    ]);
  };

  return (
    <div className="grid gap-5">
      {expired && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
          <p className="font-semibold">That import session has expired.</p>
          <p className="mt-1 text-amber-800/80 dark:text-amber-300/80">
            Nothing was saved, so nothing is out of place — please upload the file
            again to start a fresh review.
          </p>
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!isStarting) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`rounded-xl border border-dashed p-6 transition ${
          isDragging
            ? "border-slate-500 bg-slate-100 dark:border-slate-400 dark:bg-slate-800/60"
            : "border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-950/40"
        }`}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
              <FileSpreadsheet size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Upload one file — companies and leads together
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Drop a <code>.csv</code> or <code>.xlsx</code> here, or choose one.
                Up to 20&nbsp;MB.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => !isStarting && fileInputRef.current?.click()}
            disabled={isStarting}
            className="cursor-pointer inline-flex h-10 items-center gap-2 rounded bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
          >
            <Upload size={16} />
            {isStarting ? "Reading file..." : "Choose File"}
          </button>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200">
        <ShieldCheck size={16} className="mt-0.5 shrink-0" />
        <p>
          <span className="font-semibold">Nothing is saved on upload.</span> You
          will see exactly which companies and leads would be created, and can
          correct anything, before approving.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {SHEET_SHAPES.map((shape) => (
          <div
            key={shape.key}
            className="flex flex-col rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {shape.title}
            </p>
            <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-200">
              {shape.description}
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {shape.columns.join(" · ")}
            </p>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              {shape.note}
            </p>
            <button
              type="button"
              onClick={() => handleTemplateDownload(shape)}
              className="cursor-pointer mt-3 inline-flex h-9 w-fit items-center gap-2 rounded border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Download size={15} />
              Download this template
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          What happens to your data
        </p>
        <ul className="mt-2 grid gap-1.5 text-sm text-slate-700 dark:text-slate-200">
          <li>
            Companies that are already in the CRM are left untouched — only
            missing ones are created.
          </li>
          <li>
            A cell holding several phone numbers keeps the first as the lead’s
            phone; the rest move to Other Contacts. <code>+1</code> is added
            where it is missing.
          </li>
          <li>All email addresses in a cell are kept together in one field.</li>
          <li>
            In an <code>.xlsx</code> workbook only the{" "}
            <span className="font-medium">first sheet</span> is read — put your
            rows there.
          </li>
        </ul>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={FILE_INPUT_ACCEPT}
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
