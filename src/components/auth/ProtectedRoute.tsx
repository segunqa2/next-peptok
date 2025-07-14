import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredUserType?: "platform_admin" | "company_admin" | "coach";
  allowedRoles?: ("platform_admin" | "company_admin" | "coach")[];
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requiredUserType,
  allowedRoles,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate(redirectTo);
        return;
      }

      // Check role permissions
      const hasRequiredType = requiredUserType
        ? user?.userType === requiredUserType
        : true;
      const hasAllowedRole = allowedRoles
        ? allowedRoles.includes(user?.userType!)
        : true;

      if (!hasRequiredType || !hasAllowedRole) {
        // Redirect to appropriate dashboard based on user type
        const userDashboard =
          user?.userType === "platform_admin"
            ? "/platform-admin"
            : user?.userType === "coach"
              ? "/coach/dashboard"
              : user?.userType === "team_member"
                ? "/team-member/dashboard"
                : "/dashboard";
        navigate(userDashboard);
        return;
      }
    }
  }, [
    isAuthenticated,
    user,
    isLoading,
    navigate,
    requiredUserType,
    allowedRoles,
    redirectTo,
  ]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  // Check role permissions for rendering
  const hasRequiredType = requiredUserType
    ? user?.userType === requiredUserType
    : true;
  const hasAllowedRole = allowedRoles
    ? allowedRoles.includes(user?.userType!)
    : true;

  if (!hasRequiredType || !hasAllowedRole) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}

export default ProtectedRoute;
