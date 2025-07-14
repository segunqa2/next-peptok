import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { databaseConfig } from "@/services/databaseConfig";

export function DatabaseServiceTest() {
  const [testResults, setTestResults] = useState<{
    isCloudEnvironment: boolean;
    hasValidApiUrl: boolean;
    apiUrl: string;
    baseUrl: string;
    isApiConfigured: boolean;
    isDatabaseReady: boolean;
    status: any;
  }>({
    isCloudEnvironment: false,
    hasValidApiUrl: false,
    apiUrl: "",
    baseUrl: "",
    isApiConfigured: false,
    isDatabaseReady: false,
    status: {},
  });

  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const runTests = () => {
      try {
        const hostname = window.location.hostname;
        const envApiUrl = import.meta.env.VITE_API_URL || "";

        const isCloudEnvironment =
          hostname.includes("fly.dev") ||
          hostname.includes("vercel.app") ||
          hostname.includes("netlify.app") ||
          hostname.includes("gitpod.io") ||
          hostname.includes("codespaces.dev") ||
          hostname.includes("herokuapp.com") ||
          hostname.includes("amazonaws.com");

        const hasValidApiUrl =
          envApiUrl &&
          !envApiUrl.includes("localhost") &&
          !envApiUrl.includes("127.0.0.1");

        const config = databaseConfig.getConfig();
        const status = databaseConfig.getDatabaseStatus();
        const isDatabaseReady = databaseConfig.isDatabaseReady();

        setTestResults({
          isCloudEnvironment,
          hasValidApiUrl,
          apiUrl: envApiUrl,
          baseUrl: config.baseUrl,
          isApiConfigured: !!config.baseUrl,
          isDatabaseReady,
          status,
        });

        console.log("🧪 Database Service Test Results:", {
          isCloudEnvironment,
          hasValidApiUrl,
          apiUrl: envApiUrl,
          baseUrl: config.baseUrl,
          hostname,
          isDatabaseReady,
          status,
        });
      } catch (error) {
        setFetchError(error instanceof Error ? error.message : "Unknown error");
        console.error("❌ Database service test error:", error);
      }
    };

    runTests();
  }, []);

  const testConnection = async () => {
    try {
      setFetchError(null);
      const newStatus = await databaseConfig.refreshDatabaseConnection();
      setTestResults((prev) => ({ ...prev, status: newStatus }));
      console.log("✅ Connection test completed:", newStatus);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setFetchError(errorMessage);
      console.error("❌ Connection test failed:", error);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Database Service Test Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Cloud Environment:</strong>
            <Badge
              variant={
                testResults.isCloudEnvironment ? "destructive" : "default"
              }
            >
              {testResults.isCloudEnvironment ? "Yes" : "No"}
            </Badge>
          </div>

          <div>
            <strong>Valid API URL:</strong>
            <Badge
              variant={testResults.hasValidApiUrl ? "default" : "destructive"}
            >
              {testResults.hasValidApiUrl ? "Yes" : "No"}
            </Badge>
          </div>

          <div className="col-span-2">
            <strong>API URL:</strong>
            <code className="block p-2 bg-gray-100 rounded text-sm">
              {testResults.apiUrl || "Not set"}
            </code>
          </div>

          <div className="col-span-2">
            <strong>Base URL:</strong>
            <code className="block p-2 bg-gray-100 rounded text-sm">
              {testResults.baseUrl || "Not configured"}
            </code>
          </div>

          <div>
            <strong>API Configured:</strong>
            <Badge
              variant={testResults.isApiConfigured ? "default" : "destructive"}
            >
              {testResults.isApiConfigured ? "Yes" : "No"}
            </Badge>
          </div>

          <div>
            <strong>Database Ready:</strong>
            <Badge
              variant={testResults.isDatabaseReady ? "default" : "destructive"}
            >
              {testResults.isDatabaseReady ? "Yes" : "No"}
            </Badge>
          </div>
        </div>

        <div>
          <strong>Database Status:</strong>
          <pre className="p-2 bg-gray-100 rounded text-xs overflow-auto">
            {JSON.stringify(testResults.status, null, 2)}
          </pre>
        </div>

        {fetchError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <strong className="text-red-700">Fetch Error:</strong>
            <div className="text-red-600 text-sm mt-1">{fetchError}</div>
          </div>
        )}

        <Button
          onClick={testConnection}
          disabled={
            testResults.isCloudEnvironment && !testResults.hasValidApiUrl
          }
          className="w-full"
        >
          Test Database Connection
        </Button>

        <div className="text-sm text-gray-600">
          {testResults.isCloudEnvironment && !testResults.hasValidApiUrl ? (
            <p>
              🌍 Running in cloud environment without valid API URL. Database
              connections are disabled to prevent fetch errors.
            </p>
          ) : (
            <p>
              💻 Local or properly configured environment. Database connections
              are enabled.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default DatabaseServiceTest;
