

import { Activity, ActivityTimeline } from "@/components/ui/ActivityTimeline";
import { useLeadRevisionHistory } from "@/features/backoffice-shared/use-revision-history";
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react";
import { Bell, Check, ChevronDown, Hourglass, X } from "lucide-react";
import { Fragment, useState } from "react";

type RevisionsProps = {
  leadId?: string;
};

export default function Revisions({ leadId }: RevisionsProps) {
  const [open, setOpen] = useState(false);
  const [notificationMode, setNotificationMode] = useState("mentions");
  const { data: apiActivities, isLoading } = useLeadRevisionHistory(leadId);

  const PAGE_SIZE = 10;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const activities = leadId ? (apiActivities ?? []) : fallbackActivities;
  const visibleActivities = activities.slice(0, visibleCount);
  const hasMore = visibleCount < activities.length;

  return (
    <div className="w-full max-w-xl mx-auto">
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-between px-4 py-3
          bg-white hover:bg-slate-50
          dark:bg-slate-900 dark:hover:bg-slate-800
          border-slate-200 dark:border-slate-700 transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Hourglass size={16} className="text-slate-400" />
            <span className="text-sm text-slate-500 dark:text-slate-400">
              See revision history
            </span>
          </div>
        </button>
      )}

      {open && (
        <div className="overflow-visible bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-700">
            <div className="text-xs">Revision History</div>

            <div className="flex items-center gap-2">
              <Popover className="relative">
                <PopoverButton className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700">
                  <Bell size={16} />
                  <ChevronDown size={12} />
                </PopoverButton>

                <Transition
                  as={Fragment}
                  enter="transition duration-100"
                  enterFrom="opacity-0 translate-y-1"
                  enterTo="opacity-100 translate-y-0"
                  leave="transition duration-75"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <PopoverPanel
                    anchor="top"
                    portal
                    className="z-260 w-64 rounded-lg border shadow-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  >
                    <div className="p-2">
                      <button
                        onClick={() => setNotificationMode("mentions")}
                        className="w-full text-left px-3 py-2 rounded-md text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between cursor-pointer"
                      >
                        <span>Notify me only for @mentions</span>
                        {notificationMode === "mentions" && <Check size={14} />}
                      </button>

                      <button
                        onClick={() => setNotificationMode("all")}
                        className="w-full text-left px-3 py-2 rounded-md text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between cursor-pointer"
                      >
                        <span>Notify me about all comments</span>
                        {notificationMode === "all" && <Check size={14} />}
                      </button>
                    </div>
                  </PopoverPanel>
                </Transition>
              </Popover>

              <button
                onClick={() => setOpen(false)}
                className="cursor-pointer rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto p-4 space-y-3">
            {isLoading && leadId ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Loading revision history…
              </p>
            ) : visibleActivities.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No revision history yet.
              </p>
            ) : (
              <ActivityTimeline activities={visibleActivities} />
            )}

            {hasMore && (
              <div className="flex justify-center pt-3">
                <button
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                  className="cursor-pointer text-sm px-3 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                >
                  Show more
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const fallbackActivities: Activity[] = [
  {
    id: 1,
    actor: { type: "user", name: "AW bugs" },
    action: "edited this lead",
    time: "11mo ago",
    sections: [
      {
        title: "LEAD TYPE BENTON",
        items: [
          { type: "badge", label: "General", variant: "warning" },
          { type: "badge", label: "Fix" },
        ],
      },
    ],
  },
];
