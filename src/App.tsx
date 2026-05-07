import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import { AuthProvider } from "@/providers/AuthProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { DrawerProvider } from "@/providers/DrawerProvider";

import { GuestRoute } from "@/components/guards/GuestRoute";
import { PrivateRoute } from "@/components/guards/PrivateRoute";

import Login from "@/features/auth/_components/Login";
import { ForgotPassword } from "@/features/auth/_components/ForgotPassword";
import ResetPassword from "@/features/auth/_components/ResetPassword";

import { AuthLayout } from "@/components/layouts/protected/AuthLayout";
import DashboardSwitch from "@/features/dashboard/_components/DashboardSwitch";
import { AgentCalls } from "@/features/agent-calls/AgentCalls";
import { ClosedContacts } from "@/features/backoffice-closed-contacts/_components/ClosedContacts";
import { CurrentlyHot95rm } from "@/features/backoffice-currently-hot/_components/CurrentlyHot95rm";
import { CurrentlyHotBenton } from "@/features/backoffice-currently-hot/_components/CurrentlyHotBenton";
import { CurrentlyHotSvg } from "@/features/backoffice-currently-hot/_components/CurrentlyHotSvg";
import { EverBeenHot95rm } from "@/features/backoffice-ever-been-hot/_components/EverBeenHot95rm";
import { EverBeenHotBenton } from "@/features/backoffice-ever-been-hot/_components/EverBeenHotBenton";
import { EverBeenHotSvg } from "@/features/backoffice-ever-been-hot/_components/EverBeenHotSvg";
import { RecentInterest95rm } from "@/features/backoffice-recent-interest/_components/RecentInterest95rm";
import { RecentInterestBenton } from "@/features/backoffice-recent-interest/_components/RecentInterestBenton";
import { RecentInterestSvg } from "@/features/backoffice-recent-interest/_components/RecentInterestSvg";
import { UnassignedHotLeads95rm } from "@/features/backoffice-unassigned-hot-leads/_components/UnassignedHotLeads95rm";
import { UnassignedHotLeadsBenton } from "@/features/backoffice-unassigned-hot-leads/_components/UnassignedHotLeadsBenton";
import { UnassignedHotLeadsSvg } from "@/features/backoffice-unassigned-hot-leads/_components/UnassignedHotLeadsSvg";
import { BackofficeDashboard } from "@/features/backoffice-dashboard/_components/BackofficeDashboard";
import NotFoundPage from "@/pages/NotFound";
import ForbiddenPage from "@/pages/Forbidden";

const queryClient = new QueryClient();

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <DrawerProvider>
              <Routes>
                {/* Guest (auth) routes */}
                <Route element={<GuestRoute />}>
                  <Route path="/" element={<Login />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                </Route>

                {/* Protected routes */}
                <Route element={<PrivateRoute />}>
                  <Route element={<AuthLayout />}>
                    <Route path="/dashboard" element={<DashboardSwitch />} />
                    <Route path="/calls" element={<AgentCalls />} />
                    <Route path="/closed-contacts" element={<ClosedContacts />} />
                    <Route path="/currently-hot-leads-svg" element={<CurrentlyHotSvg />} />
                    <Route path="/currently-hot-leads-95rm" element={<CurrentlyHot95rm />} />
                    <Route path="/currently-hot-leads-benton" element={<CurrentlyHotBenton />} />
                    <Route path="/recent-interest-svg" element={<RecentInterestSvg />} />
                    <Route path="/recent-interest-95rm" element={<RecentInterest95rm />} />
                    <Route path="/recent-interest-benton" element={<RecentInterestBenton />} />
                    <Route path="/unassigned-hot-leads-svg" element={<UnassignedHotLeadsSvg />} />
                    <Route path="/unassigned-hot-leads-95rm" element={<UnassignedHotLeads95rm />} />
                    <Route path="/unassigned-hot-leads-benton" element={<UnassignedHotLeadsBenton />} />
                    <Route path="/ever-been-hot-svg" element={<EverBeenHotSvg />} />
                    <Route path="/ever-been-hot-95rm" element={<EverBeenHot95rm />} />
                    <Route path="/ever-been-hot-benton" element={<EverBeenHotBenton />} />
                    <Route path="/monthly-stats-points" element={<BackofficeDashboard initialView="monthly" />} />
                  </Route>
                </Route>

                <Route path="/403" element={<ForbiddenPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
              <ToastContainer
                position="top-right"
                autoClose={3000}
                newestOnTop
                closeOnClick
                pauseOnHover
                theme="colored"
              />
            </DrawerProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
