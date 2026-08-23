/**
 * Prints a fragment of HTML without opening a window.
 *
 * Every print button in this app used to do:
 *
 *     const w = window.open("", "_blank", "width=900,height=700");
 *     if (!w) return;
 *
 * That third argument turns the call into a *pop-up* rather than a new tab, and
 * Chrome's pop-up blocker refuses it. `window.open` then returns null, the
 * guard bails out, and the button does nothing at all — no error, no dialog.
 * Firefox is more permissive, which is exactly the browser split the QA team
 * reported for both Print and Listen.
 *
 * A hidden same-document iframe has nothing to block, needs no permission, and
 * prints from any browser.
 */
export type PrintHtmlOptions = {
  /** Document title — becomes the default filename when saving as PDF. */
  title: string;
  /** Markup for the printed page body. Must already be escaped. */
  body: string;
  /**
   * Landscape suits wide tables. The QA note that "columns on the right are
   * not printed" was never missing markup — the sheet was simply too narrow.
   */
  orientation?: "portrait" | "landscape";
  /** Extra CSS for the printed document. */
  css?: string;
};

const BASE_CSS = `
  * { box-sizing: border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    padding: 24px;
    color: #0f172a;
    margin: 0;
  }
  h1 { font-size: 20px; margin: 0 0 8px; }
  table {
    width: 100%;
    border-collapse: collapse;
    /* Fixed layout + wrapping is what keeps a wide table on the sheet
       instead of letting the right-hand columns run off the edge. */
    table-layout: fixed;
  }
  th, td {
    border: 1px solid #cbd5e1;
    padding: 8px;
    text-align: left;
    font-size: 11px;
    vertical-align: top;
    word-wrap: break-word;
    overflow-wrap: anywhere;
  }
  th { background: #f8fafc; text-transform: uppercase; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
`;

export function printHtml({
  title,
  body,
  orientation = "portrait",
  css = "",
}: PrintHtmlOptions): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  document.body.appendChild(frame);

  const doc = frame.contentDocument;
  const win = frame.contentWindow;

  if (!doc || !win) {
    frame.remove();
    return;
  }

  doc.open();
  doc.write(
    `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>` +
      `<style>@page { size: ${orientation}; margin: 12mm; }${BASE_CSS}${css}</style>` +
      `</head><body>${body}</body></html>`,
  );
  doc.close();

  const cleanUp = () => {
    // Give the print dialog time to take its snapshot before the frame goes.
    window.setTimeout(() => frame.remove(), 1000);
  };

  win.addEventListener("afterprint", cleanUp, { once: true });

  // Wait for the document (and any fonts) to settle, or the first page can
  // print blank.
  window.setTimeout(() => {
    try {
      win.focus();
      win.print();
    } finally {
      cleanUp();
    }
  }, 100);
}

/**
 * Drop-in replacement for `window.open("", "_blank", "width=…,height=…")`.
 *
 * Returns a real `Window` — the one belonging to a hidden iframe — so callers
 * keep using `document.write`, `document.body.innerHTML`, `focus()` and
 * `print()` exactly as they did. The difference is that nothing pops up, so
 * there is nothing for Chrome to block.
 *
 * Prefer `printHtml` for new code; this exists so the existing print handlers
 * could be fixed by changing one line each rather than rewriting the markup
 * they build.
 */
export function openPrintFrame(): Window | null {
  if (typeof document === "undefined") return null;

  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  document.body.appendChild(frame);

  const win = frame.contentWindow;
  if (!win) {
    frame.remove();
    return null;
  }

  // The caller triggers print synchronously, so tear down once the dialog
  // closes — or after a grace period if `afterprint` never fires.
  const remove = () => window.setTimeout(() => frame.remove(), 1000);
  win.addEventListener("afterprint", remove, { once: true });
  window.setTimeout(remove, 60_000);

  return win;
}

/** Escapes text for interpolation into the markup passed to `printHtml`. */
export function escapePrintHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Renders a label/value list as the two-column table the drawers all print. */
export function printDetailRows(
  items: { label: string; value: string }[],
): string {
  return items
    .map(
      (item) =>
        `<tr><td style="width:38%;font-weight:600;background:#f8fafc;">` +
        `${escapePrintHtml(item.label)}</td>` +
        `<td>${escapePrintHtml(item.value || "-")}</td></tr>`,
    )
    .join("");
}
