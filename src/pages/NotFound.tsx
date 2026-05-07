import { Link } from "react-router-dom";
import { ArrowLeft, Compass, TriangleAlert } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-3xl rounded-4xl border border-slate-200/80 bg-white/80 p-8 shadow-2xl shadow-indigo-100/60 backdrop-blur-xl transition-colors dark:border-slate-800 dark:bg-slate-950/75 dark:shadow-black/30 md:p-12">
        <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30">
          <TriangleAlert size={30} />
        </div>

        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-indigo-600 dark:text-indigo-300">
            Error 404
          </p>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-slate-50 md:text-5xl">
            This page took a wrong turn.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 md:text-lg">
            The page you&apos;re looking for doesn&apos;t exist, may have been
            moved, or the link may be outdated.
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/70 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-indigo-200 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:text-indigo-300"
          >
            <Compass size={16} />
            Open Dashboard
          </Link>
        </div>

        <div className="mt-10 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-5 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
          Tip: check the URL for typos, or use the navigation to get back on
          track.
        </div>
      </div>
    </main>
  );
}
