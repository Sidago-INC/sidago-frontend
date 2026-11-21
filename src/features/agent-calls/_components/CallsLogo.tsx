import clsx from "clsx";
import { Phone } from "lucide-react";

export function CallsLogo({ className }: { className?: string }) {
  return (
    <div className={clsx("flex shrink-0 items-center gap-2", className)}>
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-600">
        <Phone className="h-4 w-4 text-white" />
      </div>
      <span className="hidden text-sm font-semibold text-slate-800 dark:text-gray-100 sm:block">
        Call UI
      </span>
    </div>
  );
}
