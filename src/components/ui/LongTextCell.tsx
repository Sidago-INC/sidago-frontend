import { useState } from "react";
import { Modal } from "./Modal";

/**
 * A table cell for free text that can run long.
 *
 * Company descriptions average 574 characters and reach 2,313 — 400 of them
 * are over 200. In a `whitespace-nowrap` cell that stretches the column across
 * the screen and pushes every column after it out of reach. This clamps the
 * cell to a readable width and opens the full text in a dialog on click.
 */
export function LongTextCell({
  value,
  label = "Details",
  /** Characters shown before the ellipsis. */
  preview = 90,
}: {
  value: string | null | undefined;
  label?: string;
  preview?: number;
}) {
  const [open, setOpen] = useState(false);
  const text = value?.trim() ?? "";

  if (!text) {
    return <span className="text-slate-400 dark:text-slate-500">—</span>;
  }

  const isLong = text.length > preview;
  const shown = isLong ? `${text.slice(0, preview).trimEnd()}…` : text;

  if (!isLong) {
    return (
      <span className="block max-w-80 truncate" title={text}>
        {text}
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          // The row itself opens a drawer; reading the description should not
          // also do that.
          event.stopPropagation();
          setOpen(true);
        }}
        title={text}
        aria-label={text}
        className="block max-w-80 cursor-pointer truncate text-left text-sky-700 underline decoration-dotted underline-offset-2 hover:text-sky-600 dark:text-sky-400 dark:hover:text-sky-300"
      >
        {shown}
      </button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title={label}>
        <p className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-200">
          {text}
        </p>
      </Modal>
    </>
  );
}
