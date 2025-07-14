import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiEnhanced as api } from "@/services/apiEnhanced";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";

interface TestResult {
  test: string;
  status: "idle" | "testing" | "success" | "error";
  message: string;
  duration?: number;
}

export const ButtonValidationTest = () => {
  const [results, setResults] = useState<TestResult[]>([
    { test: "Join Session API", status: "idle", message: "Not tested" },
    { test: "Message Access API", status: "idle", message: "Not tested" },
    { test: "Button Click Tracking", status: "idle", message: "Not tested" },
    { test: "Database Connection", status: "idle", message: "Not tested" },
  ]);

  const updateResult = (
    testName: string,
    status: TestResult["status"],
    message: string,
    duration?: number,
  ) => {
    setResults((prev) =>
      prev.map((result) =>
        result.test === testName
          ? { ...result, status, message, duration }
          : result,
      ),
    );
  };

  const testJoinSessionAPI = async () => {
    updateResult(
      "Join Session API",
      "testing",
      "Testing session join validation...",
    );
    const startTime = Date.now();

    try {
      const result = await api.validateSessionJoin("test-request-123");
      const duration = Date.now() - startTime;

      if (result.success) {
        updateResult(
          "Join Session API",
          "success",
          `✅ ${result.message}`,
          duration,
        );
        toast.success("Join Session API working correctly");
      } else {
        updateResult(
          "Join Session API",
          "error",
          `❌ Validation failed: ${result.message}`,
          duration,
        );
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      updateResult(
        "Join Session API",
        "error",
        `❌ API Error: ${error}`,
        duration,
      );
    }
  };

  const testMessageAccessAPI = async () => {
    updateResult(
      "Message Access API",
      "testing",
      "Testing message access validation...",
    );
    const startTime = Date.now();

    try {
      const result = await api.validateMessageAccess(
        "test-request-123",
        "test-user-456",
      );
      const duration = Date.now() - startTime;

      if (result.success) {
        updateResult(
          "Message Access API",
          "success",
          `✅ ${result.message}`,
          duration,
        );
        toast.success("Message API working correctly");
      } else {
        updateResult(
          "Message Access API",
          "error",
          `❌ Validation failed: ${result.message}`,
          duration,
        );
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      updateResult(
        "Message Access API",
        "error",
        `❌ API Error: ${error}`,
        duration,
      );
    }
  };

  const testButtonTracking = async () => {
    updateResult(
      "Button Click Tracking",
      "testing",
      "Testing analytics tracking...",
    );
    const startTime = Date.now();

    try {
      await api.trackButtonClick(
        "join_session",
        "test-request-123",
        "test-user-456",
      );
      const duration = Date.now() - startTime;

      updateResult(
        "Button Click Tracking",
        "success",
        "✅ Button clicks tracked successfully",
        duration,
      );
      toast.success("Button tracking working correctly");
    } catch (error) {
      const duration = Date.now() - startTime;
      updateResult(
        "Button Click Tracking",
        "error",
        `❌ Tracking Error: ${error}`,
        duration,
      );
    }
  };

  const testDatabaseConnection = async () => {
    updateResult(
      "Database Connection",
      "testing",
      "Testing database operations...",
    );
    const startTime = Date.now();

    try {
      // Test getting mentorship requests to verify database connection
      const requests = await api.getMentorshipRequests({ status: "active" });
      const duration = Date.now() - startTime;

      updateResult(
        "Database Connection",
        "success",
        `✅ Database responsive - Found ${requests.length} requests`,
        duration,
      );
      toast.success("Database connection verified");
    } catch (error) {
      const duration = Date.now() - startTime;
      updateResult(
        "Database Connection",
        "error",
        `❌ Database Error: ${error}`,
        duration,
      );
    }
  };

  const runAllTests = async () => {
    await testJoinSessionAPI();
    await new Promise((resolve) => setTimeout(resolve, 500));
    await testMessageAccessAPI();
    await new Promise((resolve) => setTimeout(resolve, 500));
    await testButtonTracking();
    await new Promise((resolve) => setTimeout(resolve, 500));
    await testDatabaseConnection();
  };

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "testing":
        return <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />;
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: TestResult["status"]) => {
    switch (status) {
      case "testing":
        return <Badge variant="secondary">Testing...</Badge>;
      case "success":
        return <Badge className="bg-green-100 text-green-800">Passed</Badge>;
      case "error":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Button Functionality Validation
          <Button onClick={runAllTests} size="sm">
            Run All Tests
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {results.map((result) => (
            <div
              key={result.test}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(result.status)}
                <div>
                  <h4 className="font-medium">{result.test}</h4>
                  <p className="text-sm text-gray-600">{result.message}</p>
                  {result.duration && (
                    <p className="text-xs text-gray-400">{result.duration}ms</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(result.status)}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    switch (result.test) {
                      case "Join Session API":
                        testJoinSessionAPI();
                        break;
                      case "Message Access API":
                        testMessageAccessAPI();
                        break;
                      case "Button Click Tracking":
                        testButtonTracking();
                        break;
                      case "Database Connection":
                        testDatabaseConnection();
                        break;
                    }
                  }}
                  disabled={result.status === "testing"}
                >
                  Test
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Test Summary</h4>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">
                {results.filter((r) => r.status === "success").length}
              </p>
              <p className="text-sm text-gray-600">Passed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">
                {results.filter((r) => r.status === "error").length}
              </p>
              <p className="text-sm text-gray-600">Failed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {results.filter((r) => r.status === "testing").length}
              </p>
              <p className="text-sm text-gray-600">Running</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-600">
                {results.filter((r) => r.status === "idle").length}
              </p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ButtonValidationTest;
