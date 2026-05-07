export function Title({ title }: { title: string }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
      <span className="px-2 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
        {title}
      </span>
      <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}
