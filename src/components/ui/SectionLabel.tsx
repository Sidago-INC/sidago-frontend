import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  icon?: LucideIcon;
  className?: string;
};

export function SectionLabel({ children, icon: Icon, className }: Props) {
  return (
    <p
      className={[
        "flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-gray-500",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </p>
  );
}
