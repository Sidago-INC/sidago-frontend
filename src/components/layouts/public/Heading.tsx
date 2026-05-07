import clsx from "clsx";
import { ShieldCheck } from "lucide-react";
import React from "react";

export default function Heading() {
  return (
    <header
      className={clsx(
        "fixed top-0 w-full z-50 backdrop-blur-md transition-colors",
        // Dark
        "dark:bg-gray-950/70",
      )}
    >
      <div className="flex justify-between items-center px-8 py-4 max-w-full mx-auto">
        <div className="flex items-center gap-2 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400">
          <ShieldCheck className="w-6 h-6" />
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Sidago CRM
          </span>
        </div>
      </div>
    </header>
  );
}
