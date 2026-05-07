import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export function CardShell({ children, className }: Props) {
  return (
    <div
      className={[
        "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
