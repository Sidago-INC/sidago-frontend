import React from "react";
import { Cog, Paperclip, Workflow } from "lucide-react";
import { Badge } from "./Badge";
import { Avatar } from "./Avatar";

/* ================= TYPES ================= */

export type ActivityItem =
  | {
      type: "badge";
      label: string;
      variant?: "default" | "success" | "warning";
    }
  | { type: "text"; text: string }
  | { type: "button"; label: string; onClick?: () => void }
  | { type: "icon"; icon: React.ReactNode; label?: string }
  | { type: "image"; src: string; alt?: string }
  | { type: "attachment"; fileName: string; size?: string }
  | { type: "custom"; render: () => React.ReactNode };

export type ActivitySection = {
  title?: string;
  items: ActivityItem[];
};

export type Activity = {
  id: number;
  actor: {
    type: "user" | "system" | "automation";
    name: string;
  };
  action: string;
  time: string;
  sections: ActivitySection[];
};

/* ================= RENDER ENGINE ================= */

function RenderItem({ item }: { item: ActivityItem }) {
  switch (item.type) {
    case "badge":
      return <Badge variant={item.variant}>{item.label}</Badge>;

    case "text":
      return (
        <p className="text-xs text-slate-600 dark:text-slate-400">
          {item.text}
        </p>
      );

    case "button":
      return (
        <button className="rounded-md bg-slate-200 px-3 py-1 text-xs hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700">
          {item.label}
        </button>
      );

    case "icon":
      return (
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          {item.icon}
          {item.label && <span>{item.label}</span>}
        </div>
      );

    case "image":
      return (
        <div className="relative h-24 w-24 overflow-hidden rounded-md">
          <img
            src={item.src}
            alt={item.alt || "image"}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      );

    case "attachment":
      return (
        <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-xs dark:border-slate-700">
          <Paperclip size={14} />
          <span>{item.fileName}</span>
          {item.size && <span className="text-slate-400">({item.size})</span>}
        </div>
      );

    case "custom":
      return item.render();

    default:
      return null;
  }
}

/* ================= SECTION ================= */

function Section({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      {title && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {title}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {children}
      </div>
    </div>
  );
}
/* ================= TIMELINE ITEM ================= */

function TimelineItem({ activity }: { activity: Activity }) {
  const isSystem = activity.actor.type === "system";
  const isAutomation = activity.actor.type === "automation";

  return (
    <div className="relative pl-10">
      {/* vertical line */}
      <div className="absolute left-4 top-0 h-full w-px bg-slate-200 dark:bg-slate-700" />

      {/* dot */}
      <div className="absolute left-2 top-1.5 h-4 w-4 rounded-full bg-white border border-slate-300 dark:bg-slate-900 dark:border-slate-700" />

      {/* content */}
      <div>
        {/* Header */}
        <div className="flex items-center gap-3">
          {isSystem ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs text-white">
              <Avatar icon={Cog} />
            </div>
          ) : isAutomation ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs text-white">
              <Avatar icon={Workflow} />
            </div>
          ) : (
            <Avatar name={activity.actor.name} />
          )}

          <p className="text-slate-700 dark:text-slate-300">
            <span className="text-sm font-medium">{activity.actor.name}</span>{" "}
            <span className="text-xs">{activity.action}</span>
          </p>

          <span className="ml-auto text-xs text-slate-400">
            {activity.time}
          </span>
        </div>

        {/* Body */}
        <div className="mt-3 rounded-lg bg-gray-100 p-4 dark:bg-slate-950">
          {activity.sections.map((section, idx) => (
            <Section key={idx} title={section.title}>
              {section.items.map((item, i) => (
                <RenderItem key={i} item={item} />
              ))}
            </Section>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================= MAIN COMPONENT ================= */

export function ActivityTimeline({ activities }: { activities: Activity[] }) {
  return (
    <div className="space-y-6">
      {activities.map((activity) => (
        <TimelineItem key={activity.id} activity={activity} />
      ))}
    </div>
  );
}
