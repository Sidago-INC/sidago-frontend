interface TieBadgeProps {
  label?: string;
  compact?: boolean;
}

export function TieBadge({ label = "Tie", compact = false }: TieBadgeProps) {
  return (
    <div
      className={[
        "flex items-center rounded-full bg-slate-100 font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300",
        compact
          ? "gap-1 px-2 py-1 text-[10px]"
          : "gap-1.5 px-3 py-1 text-[10px]",
      ].join(" ")}
    >
      <span>{label}</span>
    </div>
  );
}
