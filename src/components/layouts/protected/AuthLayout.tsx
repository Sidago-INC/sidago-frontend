
import React, { ReactNode, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Mobilebar from "./Mobilebar";
import { useAuth } from "@/providers/AuthProvider";
import { PrivateRoute } from "@/components/guards/PrivateRoute";

export function AuthLayout({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { navigations } = useAuth();
  const currentSidebarWidth = isCollapsed ? 80 : sidebarWidth;

  return (
    <PrivateRoute>
      <div className="flex h-screen overflow-hidden bg-transparent">
        <Sidebar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          sidebarWidth={sidebarWidth}
          setSidebarWidth={setSidebarWidth}
          navigations={navigations}
        />

        <div
          className="flex min-w-0 flex-1 flex-col transition-all duration-300 ease-in-out md:ml-[var(--sidebar-width)] md:w-[calc(100%_-_var(--sidebar-width))]"
          style={
            {
              "--sidebar-width": `${currentSidebarWidth}px`,
            } as React.CSSProperties
          }
        >
          <Header onMenuClick={() => setIsMobileOpen(true)} />

          <main className="flex-1 overflow-y-auto text-slate-900 transition-colors dark:text-slate-100">
            {children}
          </main>
        </div>
        <Mobilebar
          navigations={navigations}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />
      </div>
    </PrivateRoute>
  );
}
