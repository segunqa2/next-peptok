import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export function CoachDashboardTest() {
  const { user, login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [testResult, setTestResult] = useState<{
    status: "idle" | "testing" | "success" | "error";
    message: string;
  }>({ status: "idle", message: "" });

  const testCoachLogin = async () => {
    setTestResult({ status: "testing", message: "Testing coach login..." });

    try {
      // Login as demo coach
      const result = await login("coach@leadership.com", "leadership123");

      if (result.success) {
        setTestResult({
          status: "success",
          message:
            "Coach login successful! User should be redirected to coach dashboard.",
        });

        // Wait a moment then navigate to coach dashboard
        setTimeout(() => {
          navigate("/coach/dashboard");
        }, 1000);
      } else {
        setTestResult({
          status: "error",
          message: `Login failed: ${result.error}`,
        });
      }
    } catch (error) {
      setTestResult({
        status: "error",
        message: `Login error: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  };

  const goToCoachDashboard = () => {
    navigate("/coach/dashboard");
  };

  const goToCoachSettings = () => {
    navigate("/coach/settings");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Coach Dashboard & Settings Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p>
              <strong>Authentication Status:</strong>{" "}
              {isAuthenticated ? "Authenticated" : "Not authenticated"}
            </p>
            <p>
              <strong>User Type:</strong> {user?.userType || "None"}
            </p>
            <p>
              <strong>User Name:</strong> {user?.name || "None"}
            </p>
            <p>
              <strong>Loading:</strong> {isLoading ? "Yes" : "No"}
            </p>
          </div>

          {testResult.status !== "idle" && (
            <Alert>
              <div className="flex items-center space-x-2">
                {testResult.status === "testing" && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {testResult.status === "success" && (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
                {testResult.status === "error" && (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription>{testResult.message}</AlertDescription>
              </div>
            </Alert>
          )}

          <div className="flex flex-col space-y-2">
            {!isAuthenticated && (
              <Button
                onClick={testCoachLogin}
                disabled={testResult.status === "testing"}
              >
                {testResult.status === "testing"
                  ? "Testing..."
                  : "Test Coach Login"}
              </Button>
            )}

            {isAuthenticated && user?.userType === "coach" && (
              <>
                <Button onClick={goToCoachDashboard}>
                  Go to Coach Dashboard
                </Button>
                <Button variant="outline" onClick={goToCoachSettings}>
                  Go to Coach Settings
                </Button>
              </>
            )}
          </div>

          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <strong>Test Instructions:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Click "Test Coach Login" to login as a demo coach</li>
              <li>Should automatically redirect to coach dashboard</li>
              <li>Test navigation between dashboard and settings</li>
              <li>Check if all functionality works correctly</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
