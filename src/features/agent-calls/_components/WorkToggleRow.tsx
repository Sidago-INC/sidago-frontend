import type { CallsFormState } from "@/types";

export function WorkToggleRow({
  value,
  onChange,
}: {
  value: CallsFormState["notWorkAnymore"];
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between border-t border-slate-100 pt-2 dark:border-gray-700">
      <span className="max-w-40 text-xs leading-tight text-slate-500 dark:text-gray-400">
        Doesn&apos;t work here anymore
      </span>
      <button
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ring-0 cursor-pointer ${
          value ? "bg-amber-500" : "bg-slate-300 dark:bg-gray-600"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
            value ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
