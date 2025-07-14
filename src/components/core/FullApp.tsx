import React, { Suspense } from "react";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardRouter from "@/components/auth/DashboardRouter";
import { QuickNav } from "@/components/common/QuickNav";

// Critical pages - load immediately
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import NotFound from "@/pages/NotFound";

// Lazy load non-critical pages for better performance
const Pricing = React.lazy(() => import("@/pages/Pricing"));
const CoachDirectory = React.lazy(() => import("@/pages/CoachDirectory"));
const EnterpriseDashboard = React.lazy(
  () => import("@/pages/EnterpriseDashboard"),
);
const CompanyDashboard = React.lazy(() => import("@/pages/CompanyDashboard"));
const CompanyDashboardEnhanced = React.lazy(
  () => import("@/pages/CompanyDashboardEnhanced"),
);
const CoachProfile = React.lazy(() => import("@/pages/CoachProfile"));
const ForgotPassword = React.lazy(() => import("@/pages/ForgotPassword"));
const BusinessOnboarding = React.lazy(
  () => import("@/pages/onboarding/BusinessOnboarding"),
);
const CoachOnboarding = React.lazy(
  () => import("@/pages/onboarding/CoachOnboarding"),
);
const TeamMemberDashboard = React.lazy(
  () => import("@/pages/TeamMemberDashboard"),
);
const VideoConference = React.lazy(
  () => import("@/components/sessions/VideoConference"),
);
const Messages = React.lazy(() => import("@/pages/Messages"));
const CreateCoachingRequestLegacy = React.lazy(
  () => import("@/pages/mentorship/CreateMentorshipRequest"),
);
const CreateCoachingRequest = React.lazy(
  () => import("@/pages/coaching/CreateCoachingRequest"),
);
const CoachingRequestDetails = React.lazy(
  () => import("@/pages/coaching/CoachingRequestDetails"),
);
const CoachingRequestDetailsLegacy = React.lazy(
  () => import("@/pages/mentorship/MentorshipRequestDetails"),
);
const CoachMatching = React.lazy(() =>
  import("@/pages/coach/CoachMatching").then((module) => ({
    default: module.CoachMatching,
  })),
);
const CoachDashboard = React.lazy(() => import("@/pages/coach/CoachDashboard"));
const CoachSettings = React.lazy(() => import("@/pages/coach/CoachSettings"));
const Connections = React.lazy(() => import("@/pages/Connections"));
const ConnectionDetails = React.lazy(() => import("@/pages/ConnectionDetails"));
const ExpertDirectory = React.lazy(() => import("@/pages/ExpertDirectory"));
const ExpertProfile = React.lazy(() => import("@/pages/ExpertProfile"));
const EmployeeDashboard = React.lazy(() => import("@/pages/EmployeeDashboard"));
const Privacy = React.lazy(() => import("@/pages/Privacy"));
const Terms = React.lazy(() => import("@/pages/Terms"));
const PlatformAdminDashboard = React.lazy(
  () => import("@/pages/PlatformAdminDashboard"),
);
const PendingInvitations = React.lazy(
  () => import("@/pages/PendingInvitations"),
);
const PricingConfig = React.lazy(() => import("@/pages/admin/PricingConfig"));
const AnalyticsSettings = React.lazy(
  () => import("@/pages/admin/AnalyticsSettings"),
);
const MatchingSettings = React.lazy(
  () => import("@/pages/admin/MatchingSettings"),
);
const EmailSettings = React.lazy(() => import("@/pages/admin/EmailSettings"));
const PlatformSettings = React.lazy(
  () => import("@/pages/admin/PlatformSettings"),
);
const PlatformValidationDashboard = React.lazy(
  () => import("@/pages/PlatformValidationDashboard"),
);
const DataSyncTestingDashboard = React.lazy(
  () => import("@/pages/DataSyncTestingDashboard"),
);
const CoachDashboardTest = React.lazy(() =>
  import("@/components/testing/CoachDashboardTest").then((module) => ({
    default: module.CoachDashboardTest,
  })),
);

// Loading component for lazy-loaded pages
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600">Loading page...</p>
    </div>
  </div>
);

export const FullApp: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/coaches" element={<CoachDirectory />} />
          <Route path="/coaches/:id" element={<CoachProfile />} />

          {/* Auto-route authenticated users to their dashboard */}
          <Route path="/app" element={<DashboardRouter />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredUserType="company_admin">
                <EnterpriseDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/dashboard"
            element={
              <ProtectedRoute requiredUserType="company_admin">
                <CompanyDashboardEnhanced />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/dashboard/basic"
            element={
              <ProtectedRoute requiredUserType="company_admin">
                <CompanyDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee-dashboard"
            element={
              <ProtectedRoute requiredUserType="employee">
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/team-member-dashboard"
            element={
              <ProtectedRoute requiredUserType="team_member">
                <TeamMemberDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach-dashboard"
            element={
              <ProtectedRoute requiredUserType="coach">
                <CoachDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach/dashboard"
            element={
              <ProtectedRoute requiredUserType="coach">
                <CoachDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach-settings"
            element={
              <ProtectedRoute requiredUserType="coach">
                <CoachSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach/settings"
            element={
              <ProtectedRoute requiredUserType="coach">
                <CoachSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/platform-admin"
            element={
              <ProtectedRoute requiredUserType="platform_admin">
                <PlatformAdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Onboarding */}
          <Route path="/onboarding/business" element={<BusinessOnboarding />} />
          <Route path="/onboarding/coach" element={<CoachOnboarding />} />

          {/* Coaching */}
          <Route
            path="/coaching/new"
            element={
              <ProtectedRoute requiredUserType="company_admin">
                <CreateCoachingRequest />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coaching/requests/:id"
            element={
              <ProtectedRoute>
                <CoachingRequestDetails />
              </ProtectedRoute>
            }
          />
          {/* Legacy mentorship routes - redirect to coaching */}
          <Route
            path="/mentorship/new"
            element={
              <ProtectedRoute requiredUserType="company_admin">
                <CreateCoachingRequestLegacy />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mentorship/requests/:id"
            element={
              <ProtectedRoute>
                <CoachingRequestDetailsLegacy />
              </ProtectedRoute>
            }
          />

          {/* Coach Matching */}
          <Route
            path="/coach/matching/:coachingRequestId"
            element={
              <ProtectedRoute requiredUserType="coach">
                <CoachMatching />
              </ProtectedRoute>
            }
          />

          {/* Connections */}
          <Route
            path="/connections"
            element={
              <ProtectedRoute>
                <Connections />
              </ProtectedRoute>
            }
          />
          <Route
            path="/connections/:id"
            element={
              <ProtectedRoute>
                <ConnectionDetails />
              </ProtectedRoute>
            }
          />

          {/* Directory */}
          <Route path="/experts" element={<ExpertDirectory />} />
          <Route path="/experts/:id" element={<ExpertProfile />} />

          {/* Video Conference */}
          <Route
            path="/session/:sessionId"
            element={
              <ProtectedRoute>
                <VideoConference />
              </ProtectedRoute>
            }
          />

          {/* Messages */}
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />

          {/* Team Member Invitations */}
          <Route path="/invitations" element={<PendingInvitations />} />

          {/* Platform Admin Routes */}
          <Route
            path="/admin/pricing"
            element={
              <ProtectedRoute requiredUserType="platform_admin">
                <PricingConfig />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute requiredUserType="platform_admin">
                <AnalyticsSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/matching"
            element={
              <ProtectedRoute requiredUserType="platform_admin">
                <MatchingSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/email"
            element={
              <ProtectedRoute requiredUserType="platform_admin">
                <EmailSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/platform"
            element={
              <ProtectedRoute requiredUserType="platform_admin">
                <PlatformSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/validation"
            element={
              <ProtectedRoute requiredUserType="platform_admin">
                <PlatformValidationDashboard />
              </ProtectedRoute>
            }
          />

          {/* Public Validation Dashboard (for development/testing) */}
          <Route path="/validation" element={<PlatformValidationDashboard />} />

          {/* Data Sync Testing Dashboard (for development/debugging) */}
          <Route path="/sync-testing" element={<DataSyncTestingDashboard />} />

          {/* Coach Dashboard Testing (for development/debugging) */}
          <Route path="/test-coach" element={<CoachDashboardTest />} />

          {/* Legal Pages */}
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />

          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>

      {/* Development Quick Navigation */}
      <QuickNav />
    </BrowserRouter>
  );
};
