import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Component that automatically redirects authenticated users to their appropriate dashboard
 * based on their user type when they visit generic routes
 */
const DashboardRouter = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect to appropriate dashboard based on user type
      switch (user.userType) {
        case "platform_admin":
          navigate("/platform-admin", { replace: true });
          break;
        case "company_admin":
          navigate("/company/dashboard/basic", { replace: true });
          break;
        case "coach":
          navigate("/coach/dashboard", { replace: true });
          break;
        case "employee":
          navigate("/employee-dashboard", { replace: true });
          break;
        case "team_member":
          navigate("/team-member-dashboard", { replace: true });
          break;
        default:
          navigate("/company/dashboard/programs", { replace: true });
          break;
      }
    } else {
      // If not authenticated, redirect to home
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Redirecting to dashboard...</p>
      </div>
    </div>
  );
};

export default DashboardRouter;
