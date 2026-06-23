
import { Button, DropdownPanel } from "@/components/ui";
import { Bell } from "lucide-react";

export default function Notification() {
  const unreadCount = 0;
  const hasUnreadAlerts = unreadCount > 0;

  return (
    <DropdownPanel
      panelClassName="fixed left-1/2 top-14 z-50 w-[min(100vw-2rem,18rem)] -translate-x-1/2 rounded-2xl border border-slate-200/70 bg-white p-2 shadow-2xl shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/30 md:absolute md:right-0 md:left-auto md:top-auto md:z-20 md:mt-2 md:w-72 md:translate-x-0"
      trigger={(toggle) => (
        <Button
          onClick={toggle}
          className="relative cursor-pointer rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <Bell size={18} />
          {hasUnreadAlerts && (
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full border-2 border-white bg-red-500 dark:border-slate-900" />
          )}
        </Button>
      )}
    >
      <p className="border-b border-slate-100 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:text-slate-500">
        Notifications
      </p>
      <div className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
        No new alerts.
      </div>
    </DropdownPanel>
  );
}
