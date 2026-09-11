
import clsx from "clsx";
import { Fragment } from "react";

type EmailLinkProps = {
  value?: string | null;
  className?: string;
};

function splitEmailAddresses(value: string): string[] {
  return value
    .split(/[,;]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function EmailLink({ value, className }: EmailLinkProps) {
  const emails = splitEmailAddresses(String(value ?? ""));

  if (emails.length === 0) {
    return <span>-</span>;
  }

  return (
    <span className={clsx("break-words", className)}>
      {emails.map((email, index) => (
        <Fragment key={`${email}-${index}`}>
          {index > 0 ? (
            <span className="font-medium text-sky-600 dark:text-sky-300">
              ,{" "}
            </span>
          ) : null}
          <a
            href={`mailto:${email}`}
            onClick={(event) => event.stopPropagation()}
            className="font-medium text-sky-600 underline-offset-2 hover:underline dark:text-sky-300"
          >
            {email}
          </a>
        </Fragment>
      ))}
    </span>
  );
}
