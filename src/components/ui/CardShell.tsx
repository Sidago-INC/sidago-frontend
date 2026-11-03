import { ReactNode } from "react";
import clsx from "clsx";

type Props = {
  children: ReactNode;
  className?: string;
};

export function CardShell({ children, className }: Props) {
  return <div className={clsx(className)}>{children}</div>;
}
