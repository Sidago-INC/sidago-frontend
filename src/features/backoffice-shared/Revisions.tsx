
import { Activity, ActivityTimeline } from "@/components/ui/ActivityTimeline";
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react";
import { Bell, Check, ChevronDown, Hourglass, X } from "lucide-react";
import { Fragment, useState } from "react";

// ---------------- MAIN ----------------
export default function Revisions() {
  const [open, setOpen] = useState(false);
  const [notificationMode, setNotificationMode] = useState("mentions");

  const PAGE_SIZE = 10;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const visibleActivities = activities.slice(0, visibleCount);
  const hasMore = visibleCount < activities.length;

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Collapsed */}
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

      {/* Panel */}
      {open && (
        <div className="overflow-visible bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-700">
            <div className="text-xs">Revision History</div>

            <div className="flex items-center gap-2">
              {/* Notification Popover */}
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

              {/* Close */}
              <button
                onClick={() => setOpen(false)}
                className="cursor-pointer rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* history */}
          <div className="max-h-80 overflow-y-auto p-4 space-y-3">
            <ActivityTimeline activities={visibleActivities} />

            {/* Show More */}
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

// ---------------- DATA ----------------

const activities: Activity[] = [
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
  {
    id: 2,
    actor: { type: "system", name: "Automation" },
    action: "updated via API",
    time: "10mo ago",
    sections: [
      {
        title: "CONTACT TYPE",
        items: [
          { type: "badge", label: "Validated", variant: "success" },
          { type: "badge", label: "Prospecting", variant: "warning" },
        ],
      },
      {
        title: "LEAD TYPE",
        items: [
          { type: "badge", label: "Ignore", variant: "success" },
          { type: "badge", label: "General", variant: "warning" },
        ],
      },
    ],
  },
  {
    id: 3,
    actor: {
      type: "automation",
      name: "Automation Engine",
    },
    action: "updated via API",
    time: "10mo ago",
    sections: [
      {
        items: [
          {
            type: "text",
            text: "Automations edited via API (using LEVEL 2 - Log Level 2 Results into Lead Table automation)",
          },
        ],
      },
      {
        title: "CONTACT TYPE",
        items: [
          { type: "badge", label: "Validated", variant: "success" },
          { type: "badge", label: "Prospecting", variant: "warning" },
        ],
      },
      {
        title: "HISTORY CALLS SIDAGO",
        items: [
          {
            type: "text",
            text: "05/05/2025 - LEVEL 2 MARIZ - Not Interested",
          },
          {
            type: "text",
            text: "03/10/2025 - MARIZ CABIDO - Not Interested",
          },
        ],
      },
    ],
  },
];
