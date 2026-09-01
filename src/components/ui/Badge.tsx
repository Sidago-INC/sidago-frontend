import { ReactNode, useLayoutEffect, useRef } from "react";
import { Check, Clock3 } from "lucide-react";
import {
  getTimezoneBadgeStyle,
  resolveTimezoneLabel,
} from "@/types/timezone.types";

const COMPANY_BADGE_COLORS = [
  "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:ring-indigo-800",
  "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800",
  "bg-rose-100 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-800",
  "bg-amber-100 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800",
  "bg-sky-100 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-800",
];

const LEAD_TYPE_STYLES: Record<string, string> = {
  Hot: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
  Warm: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  Cold: "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  General:
    "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300",
  Referral:
    "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300",
  Fix: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300",
  Fixed:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
};

const CONTACT_TYPE_STYLES: Record<string, string> = {
  prospecting:
    "border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  validated:
    "border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  interested:
    "border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  "not interested":
    "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  "no answer":
    "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  "left message":
    "border-blue-300 bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  "call lead back":
    "border-purple-300 bg-purple-100 text-purple-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300",
  "bad number":
    "border-orange-300 bg-orange-100 text-orange-700 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300",
  dnc: "border-red-300 bg-red-100 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300",
};

const CAMPAIGN_TYPE_STYLES: Record<string, string> = {
  SVG: "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300",
  BENTON:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  "95RM":
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  "Current Interest":
    "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300",
  Reactivation:
    "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300",
  Inbound:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  Outbound:
    "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  Referral:
    "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300",
};

const EMAIL_PRIORITY_STYLES = [
  "border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
  "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  "border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300",
  "border-violet-200 bg-violet-100 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300",
  "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
] as const;

function badgeClassName(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function normalizeBadgeValue(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

export const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    active: "bg-green-100 text-green-600",
    succeeded: "bg-green-100 text-green-600",
    canceled: "bg-red-100 text-red-600",
    failed: "bg-red-100 text-red-600",
    pending: "bg-yellow-100 text-yellow-600",
    past_due: "bg-yellow-100 text-yellow-600",
    incomplete: "bg-gray-100 text-gray-600",
  };

  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-md ${
        styles[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
};

function AutoFitBadgeText({
  text,
  minFontSize = 8,
  maxFontSize = 12,
}: {
  text: string;
  minFontSize?: number;
  maxFontSize?: number;
}) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const textEl = textRef.current;
    if (!container || !textEl) return;

    const fit = () => {
      let size = maxFontSize;
      textEl.style.fontSize = `${size}px`;
      textEl.style.lineHeight = "1.2";

      while (size > minFontSize && textEl.scrollWidth > container.clientWidth) {
        size -= 0.5;
        textEl.style.fontSize = `${size}px`;
      }
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(container);
    return () => observer.disconnect();
  }, [text, minFontSize, maxFontSize]);

  return (
    <span ref={containerRef} className="block w-full overflow-hidden">
      <span ref={textRef} className="block whitespace-nowrap">
        {text}
      </span>
    </span>
  );
}

export const CompanySymbolBadge = ({
  symbol,
  index,
  className = "rounded-full",
  fitText,
  maxWidth = "5.75rem",
}: {
  symbol: ReactNode;
  index: number;
  className?: string;
  fitText?: boolean;
  maxWidth?: string;
}) => {
  const color = COMPANY_BADGE_COLORS[index % COMPANY_BADGE_COLORS.length];
  const shouldFitText = fitText ?? className === "rounded";
  const symbolText =
    typeof symbol === "string" || typeof symbol === "number"
      ? String(symbol)
      : null;

  return (
    <span
      className={badgeClassName(
        "inline-flex shrink-0 items-center justify-center px-2.5 py-0.5 text-xs font-medium",
        shouldFitText && "overflow-hidden",
        color,
        className,
      )}
      style={
        shouldFitText
          ? {
              maxWidth,
              minHeight: "1.75rem",
            }
          : undefined
      }
    >
      {shouldFitText && symbolText != null ? (
        <AutoFitBadgeText text={symbolText} />
      ) : (
        symbol
      )}
    </span>
  );
};

export const TypeBadge = ({
  value,
  kind,
  className,
}: {
  value: string | null | undefined;
  kind: "lead" | "contact";
  className?: string;
}) => {
  const trimmedValue = value?.trim();
  if (!trimmedValue) {
    return null;
  }

  const styles = kind === "lead" ? LEAD_TYPE_STYLES : CONTACT_TYPE_STYLES;
  const styleKey =
    kind === "lead" ? trimmedValue : normalizeBadgeValue(trimmedValue);
  const tone =
    styleKey != null
      ? styles[styleKey as keyof typeof styles]
      : undefined;

  return (
    <span
      className={badgeClassName(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tone ??
          "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
      className,
    )}
    >
      {trimmedValue}
    </span>
  );
};

export const CampaignBadge = ({
  value,
  className,
}: {
  value: string;
  className?: string;
}) => {
  if (!value.trim()) {
    return null;
  }
  return (
    <span
      className={badgeClassName(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        CAMPAIGN_TYPE_STYLES[value] ??
          "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
        className,
      )}
    >
      {value}
    </span>
  );
};

export const TimezoneBadge = ({
  timezone,
  className,
}: {
  timezone: string;
  className?: string;
}) => {
  const trimmedTimezone = timezone.trim();
  if (!trimmedTimezone) {
    return null;
  }

  const label = resolveTimezoneLabel(trimmedTimezone);
  const timezoneStyle = getTimezoneBadgeStyle(trimmedTimezone);

  return (
    <span
      className={badgeClassName(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        timezoneStyle,
        className,
      )}
    >
      <Clock3 className="h-3.5 w-3.5" />
      {label}
    </span>
  );
};

const EMAIL_STATUS_DISPLAY: Record<string, string> = {
  "1st": "1st",
  "2nd": "2nd",
  "3rd": "3rd",
  "4th": "4th",
  "5th": "5th",
  send_contract: "Send Contract",
  resend_contract: "Resend Contract",
  lukewarm: "Lukewarm",
  finished: "Finished",
};

const EMAIL_STATUS_STYLES: Record<string, string> = {
  send_contract:
    "border-violet-200 bg-violet-100 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300",
  resend_contract:
    "border-indigo-200 bg-indigo-100 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300",
  lukewarm:
    "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  finished:
    "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
};

export const EmailPriorityBadge = ({
  value,
  className,
}: {
  value: string;
  className?: string;
}) => {
  const normalized = value.trim();
  const display = EMAIL_STATUS_DISPLAY[normalized] ?? normalized;
  const digitMatch = normalized.match(/\d+/);
  const priorityStyle = EMAIL_STATUS_STYLES[normalized]
    ? EMAIL_STATUS_STYLES[normalized]
    : EMAIL_PRIORITY_STYLES[
        ((Number(digitMatch?.[0] ?? 1) - 1) % EMAIL_PRIORITY_STYLES.length +
          EMAIL_PRIORITY_STYLES.length) %
          EMAIL_PRIORITY_STYLES.length
      ];

  return (
    <span
      className={badgeClassName(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        priorityStyle,
        className,
      )}
    >
      {display}
    </span>
  );
};

export const BooleanCheckBadge = ({
  checked,
  className,
}: {
  checked: boolean;
  className?: string;
}) => {
  return (
    <span
      className={badgeClassName(
        "inline-flex h-7 w-7 items-center justify-center rounded-full border",
        checked
          ? "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
          : "border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500",
        className,
      )}
      aria-label={checked ? "Yes" : "No"}
      title={checked ? "Yes" : "No"}
    >
      <Check className="h-3.5 w-3.5" />
    </span>
  );
};

export const Badge = ({
  variant = "default",
  children,
  className,
}: {
  variant?: "default" | "success" | "warning" | "error";
  children: React.ReactNode;
  className?: string;
}) => {
  const base =
    "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold";

  const variants = {
    default:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700",
    success:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    warning:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    error:
      "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
  };

  return (
    <span className={badgeClassName(base, variants[variant], className)}>
      {children}
    </span>
  );
};
