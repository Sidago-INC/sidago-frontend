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

  return (
    <Popover className="relative">
      <PopoverButton
        as="div"
        className="cursor-help"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
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
