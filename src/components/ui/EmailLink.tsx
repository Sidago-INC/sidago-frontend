

import clsx from "clsx";

type EmailLinkProps = {
  value?: string | null;
  className?: string;
  title?: string;
  "aria-label"?: string;
};

export function EmailLink({ value, className, title, "aria-label": ariaLabel }: EmailLinkProps) {
  const email = String(value ?? "").trim();

  if (!email) {
    return <span>-</span>;
  }

  return (
    <a
      href={`mailto:${email}`}
      onClick={(event) => event.stopPropagation()}
      className={clsx(
        "font-medium text-sky-600 underline-offset-2 hover:underline dark:text-sky-300",
        className,
      )}
      title={title || email}
      aria-label={ariaLabel || email}
    >
      {email}
    </a>
  );
}
