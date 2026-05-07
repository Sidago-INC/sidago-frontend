import { ReactNode } from "react";
import { Clock3 } from "lucide-react";

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
};

const CONTACT_TYPE_STYLES: Record<string, string> = {
  Prospecting:
    "border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  Interested:
    "border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  "Not Interested":
    "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  "No Answer":
    "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  "Left Message":
    "border-blue-300 bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  "Call Lead Back":
    "border-purple-300 bg-purple-100 text-purple-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300",
  "Bad Number":
    "border-orange-300 bg-orange-100 text-orange-700 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300",
  DNC: "border-red-300 bg-red-100 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300",
};

const CAMPAIGN_TYPE_STYLES: Record<string, string> = {
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

const TIMEZONE_STYLES = [
  "border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  "border-violet-200 bg-violet-100 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300",
  "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  "border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
  "border-pink-200 bg-pink-100 text-pink-700 dark:border-pink-800 dark:bg-pink-950/40 dark:text-pink-300",
  "border-orange-200 bg-orange-100 text-orange-700 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300",
] as const;

function getTimezoneStyle(label: string) {
  const hash = label
    .split("")
    .reduce((total, char) => total + char.charCodeAt(0), 0);

  return TIMEZONE_STYLES[hash % TIMEZONE_STYLES.length];
}

function badgeClassName(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
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

export const CompanySymbolBadge = ({
  symbol,
  index,
  className = "rounded-full",
}: {
  symbol: ReactNode;
  index: number;
  className?: string;
}) => {
  const color = COMPANY_BADGE_COLORS[index % COMPANY_BADGE_COLORS.length];

  return (
    <span
      className={badgeClassName(
        "inline-flex items-center px-2.5 py-1 text-xs font-semibold",
        color,
        className,
      )}
    >
      {symbol}
    </span>
  );
};

export const TypeBadge = ({
  value,
  kind,
  className,
}: {
  value: string;
  kind: "lead" | "contact";
  className?: string;
}) => {
  const styles = kind === "lead" ? LEAD_TYPE_STYLES : CONTACT_TYPE_STYLES;

  return (
    <span
      className={badgeClassName(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        styles[value] ??
          "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
        className,
      )}
    >
      {value}
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
  index,
  className,
}: {
  timezone: string;
  index?: number;
  className?: string;
}) => {
  const normalizedTimezone = timezone.toUpperCase();
  const label =
    typeof index === "number"
      ? `${index + 1}-${normalizedTimezone}`
      : normalizedTimezone;
  const timezoneStyle = getTimezoneStyle(label);

  return (
    <span
      className={badgeClassName(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
        timezoneStyle,
        className,
      )}
    >
      <Clock3 className="h-3.5 w-3.5" />
      {label}
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
