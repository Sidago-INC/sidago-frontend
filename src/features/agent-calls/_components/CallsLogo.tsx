import { Phone } from "lucide-react";

export function CallsLogo() {
  return (
    <div className="mr-2 flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-600">
        <Phone className="h-4 w-4 text-white" />
      </div>
      <span className="hidden text-sm font-semibold text-slate-800 dark:text-gray-100 sm:block">
        Call UI
      </span>
    </div>
  );
}
