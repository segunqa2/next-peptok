import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Wifi,
  WifiOff,
  Database,
  Globe,
  RefreshCw,
} from "lucide-react";
import { Environment } from "@/utils/environment";
import { apiEnhanced as api } from "@/services/apiEnhanced";

interface DiagnosticResult {
  status: "success" | "warning" | "error";
  message: string;
  details?: string;
}

export function DashboardDiagnostic() {
  const [isVisible, setIsVisible] = useState(false);
  const [diagnostics, setDiagnostics] = useState<{
    environment: DiagnosticResult;
    apiConfig: DiagnosticResult;
    connectivity: DiagnosticResult;
    dataAccess: DiagnosticResult;
  } | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);

    const results = {
      environment: await checkEnvironment(),
      apiConfig: await checkApiConfiguration(),
      connectivity: await checkConnectivity(),
      dataAccess: await checkDataAccess(),
    };

    setDiagnostics(results);
    setIsRunning(false);
  };

  const checkEnvironment = async (): Promise<DiagnosticResult> => {
    const isLocal = Environment.isLocalDevelopment();
    const isProd = Environment.isProduction();

    return {
      status: "success",
      message: `Running in ${Environment.getEnvironmentName()} mode`,
      details: `Local: ${isLocal}, Production: ${isProd}, URL: ${window.location.origin}`,
    };
  };

  const checkApiConfiguration = async (): Promise<DiagnosticResult> => {
    const apiUrl = import.meta.env.VITE_API_URL;
    const baseUrl = Environment.getApiBaseUrl();

    if (!apiUrl) {
      return {
        status: "warning",
        message: "API URL not configured - using local data",
        details: `Default API URL: ${baseUrl}`,
      };
    }

    return {
      status: "success",
      message: "API URL configured",
      details: `API URL: ${apiUrl}`,
    };
  };

  const checkConnectivity = async (): Promise<DiagnosticResult> => {
    if (!navigator.onLine) {
      return {
        status: "error",
        message: "No internet connection",
        details: "Browser reports offline status",
      };
    }

    try {
      const baseUrl = Environment.getApiBaseUrl();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${baseUrl}/health`, {
        signal: controller.signal,
        mode: "no-cors", // Allow cross-origin requests for testing
      });

      clearTimeout(timeoutId);

      return {
        status: "success",
        message: "API server reachable",
        details: `Connected to ${baseUrl}`,
      };
    } catch (error) {
      return {
        status: "warning",
        message: "API server not reachable",
        details: "Using local data storage as fallback",
      };
    }
  };

  const checkDataAccess = async (): Promise<DiagnosticResult> => {
    try {
      const startTime = Date.now();
      const requests = await api.getMentorshipRequests({ status: "active" });
      const duration = Date.now() - startTime;

      return {
        status: "success",
        message: `Data loaded successfully (${duration}ms)`,
        details: `Loaded ${requests.length} mentorship requests`,
      };
    } catch (error) {
      return {
        status: "error",
        message: "Failed to load dashboard data",
        details: error.message || "Unknown error occurred",
      };
    }
  };

  const getStatusIcon = (status: DiagnosticResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: DiagnosticResult["status"]) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800 border-green-300";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "error":
        return "bg-red-100 text-red-800 border-red-300";
    }
  };

  // Show diagnostic button if there might be issues
  useEffect(() => {
    const shouldShow = !import.meta.env.VITE_API_URL || !navigator.onLine;
    setIsVisible(shouldShow);
  }, []);

  if (!isVisible && !diagnostics) {
    return null;
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Database className="w-5 h-5 text-blue-600" />
          Dashboard Diagnostics
          <Button
            variant="outline"
            size="sm"
            onClick={runDiagnostics}
            disabled={isRunning}
            className="ml-auto"
          >
            {isRunning ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {isRunning ? "Running..." : "Run Check"}
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {!diagnostics && (
          <Alert className="border-blue-200 bg-blue-50">
            <Database className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Click "Run Check" to diagnose dashboard loading issues and verify
              data connectivity.
            </AlertDescription>
          </Alert>
        )}

        {diagnostics && (
          <div className="space-y-3">
            {Object.entries(diagnostics).map(([key, result]) => (
              <div
                key={key}
                className="flex items-start gap-3 p-3 rounded-lg border"
              >
                {getStatusIcon(result.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    <Badge className={getStatusColor(result.status)}>
                      {result.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                  {result.details && (
                    <p className="text-xs text-gray-500 mt-1 font-mono">
                      {result.details}
                    </p>
                  )}
                </div>
              </div>
            ))}

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Troubleshooting Tips:
              </h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>
                  • If API is not configured, the app uses local data storage
                </li>
                <li>• Check network connection if connectivity fails</li>
                <li>• Refresh the page if data loading issues persist</li>
                <li>• Local data provides full functionality offline</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
