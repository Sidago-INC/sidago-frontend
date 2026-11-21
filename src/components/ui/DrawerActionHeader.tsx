

import { Check, ChevronDown, ChevronUp, Link, Printer } from "lucide-react";

type DrawerActionHeaderProps = {
  title: string;
  subtitle?: string;
  canGoPrevious?: boolean;
  canGoNext?: boolean;
  copied?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  onPrint?: () => void;
  onCopyLink?: () => void;
};

const iconClass = "h-4 w-4 stroke-[2]";

export function DrawerActionHeader({
  title,
  subtitle,
  canGoPrevious = false,
  canGoNext = false,
  copied = false,
  onPrevious,
  onNext,
  onPrint,
  onCopyLink,
}: DrawerActionHeaderProps) {
  return (
    <div className="flex w-full items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-2">
        {onPrevious && (
          <button
            type="button"
            onClick={onPrevious}
            disabled={!canGoPrevious}
            className="group flex h-7 w-7 cursor-pointer items-center justify-center rounded border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ChevronUp
              className={`${iconClass} transition group-hover:-translate-y-0.5`}
            />
          </button>
        )}
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            disabled={!canGoNext}
            className="group flex h-7 w-7 cursor-pointer items-center justify-center rounded border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ChevronDown
              className={`${iconClass} transition group-hover:translate-y-0.5`}
            />
          </button>
        )}
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          {subtitle && (
            <p className="truncate text-sm text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onPrint && (
          <button
            type="button"
            onClick={onPrint}
            title="Print"
            className="group flex h-7 w-7 cursor-pointer items-center justify-center rounded border border-slate-200 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Printer
              className={`${iconClass} transition group-hover:scale-110`}
            />
          </button>
        )}
        {onCopyLink && (
          <button
            type="button"
            onClick={onCopyLink}
            title={copied ? "Copied!" : "Copy URL"}
            className="group flex h-7 w-7 cursor-pointer items-center justify-center rounded border border-slate-200 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {copied ? (
              <Check className={`${iconClass} text-emerald-500`} />
            ) : (
              <Link
                className={`${iconClass} transition group-hover:scale-110`}
              />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
