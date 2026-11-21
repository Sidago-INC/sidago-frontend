import React, { ReactNode, ButtonHTMLAttributes } from "react";

export function Button({
  className = "px-4 py-2 font-medium transition focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0",
  children,
  ...props
}: Props) {
  return (
    <button type={props.type || "button"} className={className} {...props}>
      {children}
    </button>
  );
}

export type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};
