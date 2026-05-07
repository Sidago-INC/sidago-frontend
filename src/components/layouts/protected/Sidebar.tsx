
import { motion } from "framer-motion";
import { PanelLeftClose, PanelLeftOpen, ShieldCheck } from "lucide-react";
import { useState, type PointerEvent } from "react";
import { SidebarItem } from "./SidebarItem";
import { Button } from "@/components/ui";
import { NavigationItem } from "@/lib/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useLocation } from "react-router-dom";
import { SidebarRoleBadge } from "./SidebarRoleBadge";
import clsx from "clsx";

export type Props = {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  sidebarWidth: number;
  setSidebarWidth: (value: number) => void;
  navigations: NavigationItem[];
};

const COLLAPSED_WIDTH = 80;
const MIN_SIDEBAR_WIDTH = 280;
const MAX_SIDEBAR_WIDTH = 440;

const clampSidebarWidth = (width: number) =>
  Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, width));

export const Sidebar = ({
  isCollapsed,
  setIsCollapsed,
  sidebarWidth,
  setSidebarWidth,
  navigations,
}: Props) => {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [isResizing, setIsResizing] = useState(false);
  const currentWidth = isCollapsed ? COLLAPSED_WIDTH : sidebarWidth;

  const handleResizeStart = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsResizing(true);
    setIsCollapsed(false);
    setSidebarWidth(clampSidebarWidth(event.clientX));
  };

  const handleResizeMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isResizing) {
      return;
    }

    setSidebarWidth(clampSidebarWidth(event.clientX));
  };

  const handleResizeEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setIsResizing(false);
  };

  return (
    <motion.aside
      initial={false}
      animate={{
        width: currentWidth,
        transition: isResizing
          ? { duration: 0 }
          : { type: "spring", stiffness: 300, damping: 30 },
      }}
      className={clsx(
        "fixed inset-y-0 left-0 z-50 hidden flex-col overflow-visible border-r border-slate-200/80 bg-white/90 shadow-xl shadow-indigo-100/50 backdrop-blur-md transition-colors dark:border-slate-600 dark:bg-slate-950/85 dark:shadow-black/25 md:flex",
        isResizing && "select-none",
      )}
    >
      <div className="relative flex items-center justify-between overflow-hidden p-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className={clsx(
            "bg-indigo-600 p-1.5 rounded text-white shrink-0",
            isCollapsed ? "opacity-0" : "opacity-100"
          )}>
            <ShieldCheck size={18} />
          </div>

          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="whitespace-nowrap text-xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-300"
            >
              Sidago CRM
            </motion.span>
          )}
        </div>
        <Button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`
      absolute top-1/2 -translate-y-1/2
      flex h-8 w-8 items-center justify-center
      cursor-pointer rounded transition hover:bg-slate-100 dark:hover:bg-slate-800
      ${isCollapsed ? "right-5 z-50 border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900" : "right-3 z-10 text-slate-600 dark:text-slate-300"}
    `}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <PanelLeftOpen size={18} />
          ) : (
            <PanelLeftClose size={18} />
          )}
        </Button>
      </div>

      <nav className="mb-10 mt-4 flex-1 overflow-y-auto overflow-x-visible px-3">
        {navigations.map((item) => (
          <SidebarItem
            key={item.href}
            item={item}
            isCollapsed={isCollapsed}
            isActive={pathname === item.href}
          />
        ))}
      </nav>

      <div className="border-t border-slate-200/80 p-3 dark:border-slate-600">
        <SidebarRoleBadge role={user?.role} compact={isCollapsed} />
      </div>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize sidebar"
        aria-valuemin={MIN_SIDEBAR_WIDTH}
        aria-valuemax={MAX_SIDEBAR_WIDTH}
        aria-valuenow={currentWidth}
        className={clsx(
          "group absolute inset-y-0 -right-2 z-50 w-4 cursor-ew-resize touch-none",
          isCollapsed && "cursor-e-resize",
        )}
        onPointerDown={handleResizeStart}
        onPointerMove={handleResizeMove}
        onPointerUp={handleResizeEnd}
        onPointerCancel={handleResizeEnd}
      >
        <div
          className={clsx(
            "absolute right-1.5 top-1/2 h-16 w-1 -translate-y-1/2 rounded-full bg-slate-300 opacity-0 transition-opacity dark:bg-slate-600",
            "group-hover:opacity-100 group-active:opacity-100",
            isResizing && "opacity-100",
          )}
        />
      </div>
    </motion.aside>
  );
};

export default Sidebar;
