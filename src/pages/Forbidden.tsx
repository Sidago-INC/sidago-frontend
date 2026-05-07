import { Link } from "react-router-dom";
import { ArrowLeft, ShieldAlert } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-3xl rounded-4xl border border-slate-200/80 bg-white/80 p-8 shadow-2xl shadow-indigo-100/60 backdrop-blur-xl transition-colors dark:border-slate-800 dark:bg-slate-950/75 dark:shadow-black/30 md:p-12">
        <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/30">
          <ShieldAlert size={30} />
        </div>

        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-amber-600 dark:text-amber-300">
            Error 403
          </p>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-slate-50 md:text-5xl">
            You don&apos;t have access to this page.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 md:text-lg">
            This area is restricted for your current role. Head back to a page
            you can access and keep going from there.
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
