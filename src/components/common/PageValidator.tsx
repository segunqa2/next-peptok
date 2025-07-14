import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Shield,
  Navigation,
  Link,
  Settings,
} from "lucide-react";

interface ValidationResult {
  category: string;
  status: "pass" | "warning" | "fail";
  message: string;
  action?: () => void;
}

export function PageValidator() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show validator for admin users or in development
    const shouldShow =
      user?.userType === "platform_admin" ||
      import.meta.env.DEV ||
      location.search.includes("validate=true");

    setIsVisible(shouldShow);

    if (shouldShow) {
      runValidation();
    }
  }, [location.pathname, user]);

  const runValidation = () => {
    const validationResults: ValidationResult[] = [];

    // Authentication check
    if (isAuthenticated) {
      validationResults.push({
        category: "Authentication",
        status: "pass",
        message: `Authenticated as ${user?.userType || "user"}`,
      });
    } else {
      validationResults.push({
        category: "Authentication",
        status: "fail",
        message: "Not authenticated",
        action: () => navigate("/login"),
      });
    }

    // User role and permissions
    if (user) {
      const hasValidRole = [
        "platform_admin",
        "company_admin",
        "coach",
        "team_member",
      ].includes(user.userType);
      validationResults.push({
        category: "Authorization",
        status: hasValidRole ? "pass" : "fail",
        message: hasValidRole
          ? `Valid role: ${user.userType}`
          : `Invalid role: ${user.userType}`,
      });

      // Company context for company_admin
      if (user.userType === "company_admin") {
        validationResults.push({
          category: "Company Context",
          status: user.companyId ? "pass" : "fail",
          message: user.companyId
            ? `Company ID: ${user.companyId}`
            : "Missing company ID",
        });
      }
    }

    // Route validation
    const currentPath = location.pathname;
    const knownRoutes = [
      "/",
      "/login",
      "/signup",
      "/dashboard",
      "/platform-admin",
      "/coach/dashboard",
      "/team-member/dashboard",
      "/coaches",
      "/connections",
      "/mentorship/new",
      "/mentorship/requests/",
      "/analytics",
      "/messages",
      "/terms",
      "/privacy",
      "/admin/pricing-config",
      "/admin/security-settings",
      "/admin/analytics-settings",
      "/invitation/accept",
      "/invitations",
    ];

    const isKnownRoute = knownRoutes.some(
      (route) =>
        currentPath === route ||
        (route.endsWith("/") && currentPath.startsWith(route)),
    );

    validationResults.push({
      category: "Routing",
      status: isKnownRoute ? "pass" : "warning",
      message: isKnownRoute ? "Valid route" : `Unknown route: ${currentPath}`,
    });

    // Check for broken links (basic validation)
    const brokenElements = document.querySelectorAll(
      'a[href="#"], button:disabled:not([aria-label*="waiting"]):not([aria-label*="loading"])',
    );

    if (brokenElements.length > 0) {
      validationResults.push({
        category: "Page Elements",
        status: "warning",
        message: `Found ${brokenElements.length} potentially broken links/buttons`,
      });
    } else {
      validationResults.push({
        category: "Page Elements",
        status: "pass",
        message: "No obvious broken elements detected",
      });
    }

    // API connectivity (basic check)
    const hasApiErrors = document.querySelector('[data-error="api"]');
    validationResults.push({
      category: "API Connectivity",
      status: hasApiErrors ? "warning" : "pass",
      message: hasApiErrors
        ? "API connectivity issues detected"
        : "API connectivity appears normal",
    });

    // Page-specific validations
    if (currentPath.includes("/mentorship/requests/")) {
      const hasErrorState = document.querySelector('[data-error="true"]');
      validationResults.push({
        category: "Page Content",
        status: hasErrorState ? "fail" : "pass",
        message: hasErrorState
          ? "Page showing error state"
          : "Page content loaded successfully",
      });
    }

    setResults(validationResults);
  };

  const getStatusIcon = (status: ValidationResult["status"]) => {
    switch (status) {
      case "pass":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case "fail":
        return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: ValidationResult["status"]) => {
    switch (status) {
      case "pass":
        return "bg-green-100 text-green-800 border-green-300";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "fail":
        return "bg-red-100 text-red-800 border-red-300";
    }
  };

  if (!isVisible) {
    return null;
  }

  const failCount = results.filter((r) => r.status === "fail").length;
  const warningCount = results.filter((r) => r.status === "warning").length;
  const passCount = results.filter((r) => r.status === "pass").length;

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-96 overflow-y-auto z-50 border-l-4 border-l-blue-500 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="w-5 h-5 text-blue-600" />
            Page Validator
          </CardTitle>
          <div className="flex gap-1">
            <Badge className="bg-green-100 text-green-800 text-xs">
              {passCount}
            </Badge>
            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
              {warningCount}
            </Badge>
            <Badge className="bg-red-100 text-red-800 text-xs">
              {failCount}
            </Badge>
          </div>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">
            {location.pathname}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsVisible(false)}
            className="h-6 px-2 text-xs"
          >
            Hide
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {results.map((result, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-2 rounded-lg border"
          >
            {getStatusIcon(result.status)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{result.category}</span>
                <Badge className={`${getStatusColor(result.status)} text-xs`}>
                  {result.status}
                </Badge>
              </div>
              <p className="text-xs text-gray-600 mt-1">{result.message}</p>
              {result.action && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={result.action}
                  className="mt-2 h-6 px-2 text-xs"
                >
                  Fix
                </Button>
              )}
            </div>
          </div>
        ))}

        <div className="text-xs text-gray-500 text-center pt-2 border-t">
          Page validation complete • {results.length} checks
        </div>
      </CardContent>
    </Card>
  );
}
