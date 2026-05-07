export function Wave() {
  return (
    <div className="flex items-center gap-1">
      <span className="h-2 w-2 animate-bounce rounded-full bg-sky-500 [animation-delay:-0.3s] dark:bg-sky-300" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-sky-500 [animation-delay:-0.15s] dark:bg-sky-300" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-sky-500 dark:bg-sky-300" />
    </div>
  );
}
