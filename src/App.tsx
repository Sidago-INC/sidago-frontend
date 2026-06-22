import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { DrawerProvider } from "@/providers/DrawerProvider";
import { RoutePreloader } from "@/components/ui";
import { GuestRoute } from "@/components/guards/GuestRoute";
import { AuthLayout } from "@/components/layouts/protected/AuthLayout";

// Auth pages
import Login from "@/features/auth/_components/Login";
import { ForgotPassword } from "@/features/auth/_components/ForgotPassword";
import ResetPasswordPage from "@/pages/ResetPasswordPage";

// Protected pages
import DashboardSwitch from "@/features/dashboard/_components/DashboardSwitch";
import { AgentCalls } from "@/features/agent-calls/AgentCalls";
import { AgentCallLogs } from "@/features/agent-call-logs/AgentCallLogs";
import { Leads } from "@/features/leads/_components/Leads";
import { AddLeadForm } from "@/features/leads/_components/AddLeadForm";
import { BulkLeadImport } from "@/features/leads/_components/BulkLeadImport";
import { LeadManualUpdateForm } from "@/features/lead-manual-update/LeadManualUpdateForm";
import { Companies } from "@/features/companies/_components/Companies";
import { AddCompanyForm } from "@/features/companies/_components/AddCompanyForm";
import { BulkCompanyImport } from "@/features/companies/_components/BulkCompanyImport";
import { AdditionalContactsForm } from "@/features/additional-contacts/_components/AdditionalContactsForm";
import { Level2Update } from "@/features/level-2-update/_components/Level2Update";
import { Level2History } from "@/features/level-2-history/_components/Level2History";
import { FixLeads } from "@/features/fix-leads/_components/FixLeads";
import { FixLeadEditForm } from "@/features/fix-leads/_components/FixLeadEditForm";
import { LeadsStats } from "@/features/leads-stats/_components/LeadsStats";
import { BlockedEmail } from "@/features/blocked-email/_components/BlockedEmail";
import { EmailBlocklistDirectory } from "@/features/email-blocklist-directory/_components/EmailBlocklistDirectory";
import { DeadMissingEmail } from "@/features/dead-missing-email/_components/DeadMissingEmail";
import { BackofficeDashboard } from "@/features/backoffice-dashboard/_components/BackofficeDashboard";
import { ClosedContacts } from "@/features/backoffice-closed-contacts/_components/ClosedContacts";

// SMS / Email pages
import SmsPage from "@/pages/SmsPage";
import EmailPage from "@/pages/EmailPage";
import { AgentSms } from "@/features/agent-sms/_components/AgentSms";
import { AgentEmail } from "@/features/agent-email/_components/AgentEmail";

// Backoffice reports
import { CurrentlyHotSvg } from "@/features/backoffice-currently-hot/_components/CurrentlyHotSvg";
import { CurrentlyHot95rm } from "@/features/backoffice-currently-hot/_components/CurrentlyHot95rm";
import { CurrentlyHotBenton } from "@/features/backoffice-currently-hot/_components/CurrentlyHotBenton";
import { RecentInterestSvg } from "@/features/backoffice-recent-interest/_components/RecentInterestSvg";
import { RecentInterest95rm } from "@/features/backoffice-recent-interest/_components/RecentInterest95rm";
import { RecentInterestBenton } from "@/features/backoffice-recent-interest/_components/RecentInterestBenton";
import { EverBeenHotSvg } from "@/features/backoffice-ever-been-hot/_components/EverBeenHotSvg";
import { EverBeenHot95rm } from "@/features/backoffice-ever-been-hot/_components/EverBeenHot95rm";
import { EverBeenHotBenton } from "@/features/backoffice-ever-been-hot/_components/EverBeenHotBenton";
import { UnassignedHotSvg } from "@/features/backoffice-unassigned-hot/_components/UnassignedHotSvg";
import { UnassignedHot95rm } from "@/features/backoffice-unassigned-hot/_components/UnassignedHot95rm";
import { UnassignedHotBenton } from "@/features/backoffice-unassigned-hot/_components/UnassignedHotBenton";

const queryClient = new QueryClient();

function P({ children }: { children: React.ReactNode }) {
  return <AuthLayout>{children}</AuthLayout>;
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <DrawerProvider>
              <RoutePreloader />
              <Routes>
                {/* Guest (auth) routes */}
                <Route path="/" element={<GuestRoute><Login /></GuestRoute>} />
                <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
                <Route path="/reset-password" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />

                {/* Protected routes — AuthLayout includes PrivateRoute */}
                <Route path="/dashboard" element={<P><DashboardSwitch /></P>} />
                <Route path="/calls" element={<P><AgentCalls /></P>} />
                <Route path="/call-logs" element={<P><AgentCallLogs /></P>} />

                {/* Leads */}
                <Route path="/leads" element={<P><Leads /></P>} />
                <Route path="/leads/add" element={<P><AddLeadForm /></P>} />
                <Route path="/leads/bulk-import" element={<P><BulkLeadImport /></P>} />
                <Route path="/lead-manual-update" element={<P><LeadManualUpdateForm /></P>} />

                {/* Companies */}
                <Route path="/companies/update" element={<P><Companies /></P>} />
                <Route path="/companies/add" element={<P><AddCompanyForm /></P>} />
                <Route path="/companies/bulk-import" element={<P><BulkCompanyImport /></P>} />

                {/* SMS */}
                <Route path="/sms" element={<P><SmsPage /></P>} />
                <Route path="/sms/mariz-cabido" element={<P><AgentSms agentName="Mariz Cabido" agentSlug="mariz-cabido" /></P>} />
                <Route path="/sms/tom-silver" element={<P><AgentSms agentName="Tom Silver" agentSlug="tom-silver" /></P>} />
                <Route path="/sms/chris-moore" element={<P><AgentSms agentName="Chris Moore" agentSlug="chris-moore" /></P>} />

                {/* Email */}
                <Route path="/email" element={<P><EmailPage /></P>} />
                <Route path="/email/mariz-cabido" element={<P><AgentEmail agentName="Mariz Cabido" agentSlug="mariz-cabido" /></P>} />
                <Route path="/email/tom-silver" element={<P><AgentEmail agentName="Tom Silver" agentSlug="tom-silver" /></P>} />
                <Route path="/email/chris-moore" element={<P><AgentEmail agentName="Chris Moore" agentSlug="chris-moore" /></P>} />

                {/* Email management */}
                <Route path="/blocked-email" element={<P><BlockedEmail /></P>} />
                <Route path="/email-blocklist-directory" element={<P><EmailBlocklistDirectory /></P>} />
                <Route path="/dead-missing-email" element={<P><DeadMissingEmail /></P>} />

                {/* Admin / Level 2 */}
                <Route path="/level-2-update" element={<P><Level2Update /></P>} />
                <Route path="/level-2-history" element={<P><Level2History /></P>} />
                <Route path="/fix-leads" element={<P><FixLeads /></P>} />
                <Route path="/fix-leads/:leadId" element={<P><FixLeadEditForm /></P>} />
                <Route path="/leads-stats" element={<P><LeadsStats /></P>} />
                <Route path="/additional-contacts" element={<P><AdditionalContactsForm /></P>} />

                {/* Backoffice dashboard */}
                <Route path="/monthly-stats-points" element={<P><BackofficeDashboard initialView="monthly" /></P>} />
                <Route path="/closed-contacts" element={<P><ClosedContacts /></P>} />

                {/* Currently Hot */}
                <Route path="/currently-hot-leads-svg" element={<P><CurrentlyHotSvg /></P>} />
                <Route path="/currently-hot-leads-95rm" element={<P><CurrentlyHot95rm /></P>} />
                <Route path="/currently-hot-leads-benton" element={<P><CurrentlyHotBenton /></P>} />

                {/* Recent Interest */}
                <Route path="/recent-interest-svg" element={<P><RecentInterestSvg /></P>} />
                <Route path="/recent-interest-95rm" element={<P><RecentInterest95rm /></P>} />
                <Route path="/recent-interest-benton" element={<P><RecentInterestBenton /></P>} />

                {/* Ever Been Hot */}
                <Route path="/ever-been-hot-svg" element={<P><EverBeenHotSvg /></P>} />
                <Route path="/ever-been-hot-95rm" element={<P><EverBeenHot95rm /></P>} />
                <Route path="/ever-been-hot-benton" element={<P><EverBeenHotBenton /></P>} />

                {/* Unassigned Hot */}
                <Route path="/unassigned-hot-leads-svg" element={<P><UnassignedHotSvg /></P>} />
                <Route path="/unassigned-hot-leads-95rm" element={<P><UnassignedHot95rm /></P>} />
                <Route path="/unassigned-hot-leads-benton" element={<P><UnassignedHotBenton /></P>} />

                {/* Fallback */}
                <Route path="/403" element={<Forbidden />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </DrawerProvider>
            <ToastContainer
              position="top-right"
              autoClose={3000}
              newestOnTop
              closeOnClick
              pauseOnHover
              theme="colored"
            />
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

function Forbidden() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-slate-300 dark:text-slate-600">403</h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
          You don&apos;t have permission to access this page.
        </p>
        <a href="/dashboard" className="mt-6 inline-block text-indigo-600 hover:underline">
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-slate-300 dark:text-slate-600">404</h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
          Page not found.
        </p>
        <a href="/" className="mt-6 inline-block text-indigo-600 hover:underline">
          Go Home
        </a>
      </div>
    </div>
  );
}
