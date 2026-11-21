import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SidebarItem } from "./SidebarItem";
import { ShieldCheck, X } from "lucide-react";
import { NavigationItem } from "@/lib/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useLocation, useSearchParams } from "react-router-dom";
import { SidebarRoleBadge } from "./SidebarRoleBadge";

export type Props = {
  navigations: NavigationItem[];
  isMobileOpen: boolean;
  setIsMobileOpen: (value: boolean) => void;
};

export default function Mobilebar({
  navigations,
  isMobileOpen,
  setIsMobileOpen,
}: Props) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();

  return (
    <AnimatePresence>
      {isMobileOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-60 md:hidden"
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-70 flex w-screen flex-col bg-white p-6 transition-colors dark:bg-slate-950 md:hidden"
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xl font-bold text-indigo-600 dark:text-indigo-300">
                <ShieldCheck
                  className="bg-indigo-600 p-1.5 rounded text-white"
                  size={30}
                />{" "}
                CRM
              </div>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="rounded-full bg-slate-100 p-2 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden">
              {navigations.map((item) => (
                <SidebarItem
                  key={item.href ?? item.label}
                  item={item}
                  isCollapsed={false}
                  currentPath={pathname}
                  currentSearch={searchParams.toString()}
                  allowLabelWrap
                />
              ))}
            </nav>
            <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
              <SidebarRoleBadge role={user?.role} />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
