import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import React from "react";

interface CellPopoverProps {
  content: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function CellPopover({ content, children, maxWidth = "320px" }: CellPopoverProps) {
  if (!content) {
    return <>{children}</>;
  }

  // Column renderers occasionally bring their own `max-w-*` utility. Keep
  // that content constrained by the cell instead, so widening a table column
  // always reveals more of its value.
  const cellChild = React.isValidElement(children)
    ? React.cloneElement(
        children as React.ReactElement<{ style?: React.CSSProperties }>,
        {
          style: {
            ...(children.props as { style?: React.CSSProperties }).style,
            maxWidth: "100%",
          },
        },
      )
    : children;

  return (
    <Popover className="relative max-w-full overflow-hidden">
      <PopoverButton
        as="div"
        className="block max-w-full overflow-hidden cursor-help"
        onClick={(e) => e.stopPropagation()}
      >
        {cellChild}
      </PopoverButton>
      <PopoverPanel
        anchor="top"
        className="z-50 rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-lg dark:border-slate-700 dark:bg-slate-800"
        style={{ maxWidth }}
      >
        <div className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap break-words">
          {content}
        </div>
      </PopoverPanel>
    </Popover>
  );
}
