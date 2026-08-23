import { Clock } from "lucide-react";
import type { QueueLead } from "../_lib/apiTypes";

/**
 * Explains why the queue is ordered the way it is, and when that will change.
 *
 * Agents reported the queue "changing on its own with no action taken". Three
 * things move it and none of them said so:
 *
 *  1. `compute_timezone_priority()` on the server reads the clock and returns a
 *     different ranking in each of the nine windows below, so the whole queue
 *     re-sorts as the day passes.
 *  2. The page refetches every 90 seconds, so a change lands without a reload.
 *  3. A lead drops out once anyone calls that company today.
 *
 * The ordering itself is intended — this just makes it visible.
 */

/** Mirrors compute_timezone_priority() in the database. EST clock hours. */
const PRIORITY_WINDOWS: { start: number; label: string }[] = [
  { start: 8.5, label: "EST" },
  { start: 9.5, label: "CST, then EST" },
  { start: 10.5, label: "MST, then EST" },
  { start: 11.0, label: "MST, then EST" },
  { start: 11.5, label: "PST, then EST" },
  { start: 17.0, label: "CST, then MST" },
  { start: 18.0, label: "MST, then PST" },
  { start: 19.0, label: "PST" },
  { start: 21.0, label: "EST" },
];

function estHoursNow(): number {
  // Read the wall clock in New York regardless of where the agent is.
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return hour + minute / 60;
}

function formatBoundary(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  const suffix = h >= 12 ? "PM" : "AM";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}:${String(m).padStart(2, "0")} ${suffix} EST`;
}

function currentWindow() {
  const now = estHoursNow();
  // Before the first boundary of the day the overnight window is still in
  // force, which the database expresses as the trailing ELSE branch.
  let active = PRIORITY_WINDOWS[PRIORITY_WINDOWS.length - 1];
  let next = PRIORITY_WINDOWS[0];

  for (let i = 0; i < PRIORITY_WINDOWS.length; i += 1) {
    if (now >= PRIORITY_WINDOWS[i].start) {
      active = PRIORITY_WINDOWS[i];
      next = PRIORITY_WINDOWS[i + 1] ?? PRIORITY_WINDOWS[0];
    }
  }

  return { active, next };
}

export function QueuePriorityNotice({ leads }: { leads: QueueLead[] }) {
  if (leads.length === 0) return null;

  const { active, next } = currentWindow();

  // How many timezones are actually in this queue — agents assume one.
  const timezones = new Set(
    leads.map((lead) => lead.timezone?.trim()).filter(Boolean),
  );

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-gray-900 dark:text-slate-300">
      <Clock size={13} className="shrink-0 text-slate-400" />
      <span>
        Calling <strong className="font-semibold">{active.label}</strong> first.
      </span>
      <span className="text-slate-400 dark:text-slate-500">
        Order changes at {formatBoundary(next.start)}
        {timezones.size > 1
          ? ` · ${leads.length} leads across ${timezones.size} timezones`
          : ` · ${leads.length} leads`}
        .
      </span>
    </div>
  );
}
