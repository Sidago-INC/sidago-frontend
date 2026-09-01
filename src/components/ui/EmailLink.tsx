import clsx from "clsx";
import { splitEmails } from "@/lib/validation";

type EmailLinkProps = {
  value?: string | null;
  className?: string;
  title?: string;
  "aria-label"?: string;
};

/**
 * A lead's email cell.
 *
 * `leads.email` holds a comma-joined LIST — 13,978 leads carry more than one
 * address, and one carries twelve. Two consequences handled here:
 *
 *  - `mailto:` gets the FIRST address only. Handing a mail client the whole
 *    list addresses a single message to every one of them, which is not what
 *    clicking a contact's email should do.
 *  - The cell shows the first address and how many more there are, rather than
 *    letting a 316-character string stretch the column. The full list is in
 *    the tooltip.
 */
export function EmailLink({
  value,
  className,
  title,
  "aria-label": ariaLabel,
}: EmailLinkProps) {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return <span>-</span>;
  }

  const addresses = splitEmails(raw);
  const primary = addresses[0] ?? raw;
  const extra = Math.max(0, addresses.length - 1);

  return (
    <span className="inline-flex items-baseline gap-1">
      <a
        href={`mailto:${primary}`}
        onClick={(event) => event.stopPropagation()}
        className={clsx(
          "font-medium text-sky-600 underline-offset-2 hover:underline dark:text-sky-300",
          className,
        )}
        title={title || addresses.join("\n")}
        aria-label={ariaLabel || primary}
      >
        {primary}
      </a>
      {extra > 0 ? (
        <span
          className="shrink-0 text-xs text-slate-500 dark:text-slate-400"
          title={addresses.slice(1).join("\n")}
        >
          +{extra}
        </span>
      ) : null}
    </span>
  );
}
