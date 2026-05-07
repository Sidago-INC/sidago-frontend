import React, { HTMLAttributes, ReactNode } from "react";

export function Card({ className, children }: Props) {
  return <div className={className}>{children}</div>;
}

export function CardContent({ className, children }: Props) {
  return <div className={className}>{children}</div>;
}

export type Props = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};
