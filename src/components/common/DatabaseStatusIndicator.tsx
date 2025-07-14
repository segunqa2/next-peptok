import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Database,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  Activity,
  RefreshCw,
  Server,
} from "lucide-react";
import { databaseConfig, DatabaseStatus } from "@/services/databaseConfig";
import { toast } from "sonner";

interface DatabaseStatusIndicatorProps {
  className?: string;
  position?: "fixed" | "relative";
  showDetails?: boolean;
}

export function DatabaseStatusIndicator({
  className = "",
  position = "fixed",
  showDetails = true,
}: DatabaseStatusIndicatorProps) {
  const [status, setStatus] = useState<DatabaseStatus>(
    databaseConfig.getDatabaseStatus(),
  );
  const [showPopover, setShowPopover] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Load initial status
    setStatus(databaseConfig.getDatabaseStatus());

    // Set up periodic status check
    const interval = setInterval(() => {
      const currentStatus = databaseConfig.getDatabaseStatus();
      setStatus(currentStatus);
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const isCloudEnvironment = () => {
    const hostname = window.location.hostname;
    return (
      hostname.includes("fly.dev") ||
      hostname.includes("vercel.app") ||
      hostname.includes("netlify.app") ||
      hostname.includes("gitpod.io") ||
      hostname.includes("codespaces.dev") ||
      hostname.includes("herokuapp.com") ||
      hostname.includes("amazonaws.com")
    );
  };

  const hasValidApiUrl = () => {
    const envApiUrl = import.meta.env.VITE_API_URL;
    return (
      envApiUrl &&
      !envApiUrl.includes("localhost") &&
      !envApiUrl.includes("127.0.0.1")
    );
  };

  const handleRefreshConnection = async () => {
    // Skip refresh in cloud environments without valid API URL
    if (isCloudEnvironment() && !hasValidApiUrl()) {
      toast.info("🌍 Cloud environment detected", {
        description:
          "Database connections disabled - no backend API configured",
        duration: 4000,
      });
      return;
    }

    setIsRefreshing(true);

    try {
      const newStatus = await databaseConfig.refreshDatabaseConnection();
      setStatus(newStatus);

      if (newStatus.isConnected) {
        toast.success("🗃️ Database connection verified", {
          description: `${newStatus.activeEndpoints.length} endpoints active`,
          duration: 3000,
        });
      } else {
        const description = isCloudEnvironment()
          ? "Cloud environment - backend API not available"
          : "Unable to connect to backend database";
        toast.warning("⚠️ Database connection unavailable", {
          description,
          duration: 5000,
        });
      }
    } catch (error) {
      const description = isCloudEnvironment()
        ? "Cloud environment - backend API not configured"
        : "Connection test failed";
      toast.warning("⚠️ Connection test failed", {
        description,
        duration: 4000,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusIcon = () => {
    if (isRefreshing) {
      return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    }

    if (!status.isConnected) {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }

    if (status.activeEndpoints.length >= 3) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }

    if (status.activeEndpoints.length > 0) {
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }

    return <Database className="w-4 h-4 text-gray-500" />;
  };

  const getStatusText = () => {
    if (isRefreshing) return "Checking...";

    if (!status.isConnected) {
      return "Database offline";
    }

    const endpointCount = status.activeEndpoints.length;
    return `${endpointCount} endpoint${endpointCount !== 1 ? "s" : ""} active`;
  };

  const getStatusColor = () => {
    if (!status.isConnected) return "destructive";
    if (status.activeEndpoints.length >= 3) return "default";
    if (status.activeEndpoints.length > 0) return "secondary";
    return "destructive";
  };

  const formatResponseTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (
    !showDetails &&
    status.isConnected &&
    status.activeEndpoints.length >= 3
  ) {
    return null; // Hide when everything is working well
  }

  return (
    <div
      className={`${position === "fixed" ? "fixed bottom-32 right-4 z-50" : ""} ${className}`}
    >
      <Popover open={showPopover} onOpenChange={setShowPopover}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`${
              status.isConnected
                ? "bg-white border-green-200"
                : "bg-red-50 border-red-200"
            } shadow-lg hover:shadow-xl transition-all duration-200`}
          >
            {getStatusIcon()}
            <span className="ml-2 font-medium">{getStatusText()}</span>
            {!status.isConnected && (
              <Badge variant="destructive" className="ml-2 px-1 py-0 text-xs">
                ⚠️
              </Badge>
            )}
          </Button>
        </PopoverTrigger>

        {showDetails && (
          <PopoverContent className="w-96 p-0" align="end">
            <Card className="border-0 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Database className="w-4 h-4" />
                  Backend Database Status
                </CardTitle>
                <CardDescription>
                  Real-time connection status to backend database for
                  invitations
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Status Overview */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-gray-600">Connection</div>
                    <Badge variant={getStatusColor()} className="mt-1">
                      {status.isConnected ? "Connected" : "Disconnected"}
                    </Badge>
                  </div>

                  <div>
                    <div className="font-medium text-gray-600">
                      Response Time
                    </div>
                    <div className="mt-1 font-mono text-lg">
                      {formatResponseTime(status.responseTime)}
                    </div>
                  </div>

                  {status.lastCheck && (
                    <div className="col-span-2">
                      <div className="font-medium text-gray-600">
                        Last Check
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {new Date(status.lastCheck).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Endpoint Status */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Database Endpoints</h4>

                  {/* Active Endpoints */}
                  {status.activeEndpoints.length > 0 && (
                    <div>
                      <div className="text-xs text-green-600 font-medium mb-1">
                        ✅ Active ({status.activeEndpoints.length})
                      </div>
                      <div className="space-y-1">
                        {status.activeEndpoints.slice(0, 3).map((endpoint) => (
                          <div
                            key={endpoint}
                            className="flex items-center gap-2 p-2 bg-green-50 rounded text-xs"
                          >
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span className="font-mono truncate">
                              {endpoint}
                            </span>
                          </div>
                        ))}
                        {status.activeEndpoints.length > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{status.activeEndpoints.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Failed Endpoints */}
                  {status.failedEndpoints.length > 0 && (
                    <div>
                      <div className="text-xs text-red-600 font-medium mb-1">
                        ❌ Failed ({status.failedEndpoints.length})
                      </div>
                      <div className="space-y-1">
                        {status.failedEndpoints.slice(0, 2).map((endpoint) => (
                          <div
                            key={endpoint}
                            className="flex items-center gap-2 p-2 bg-red-50 rounded text-xs"
                          >
                            <XCircle className="w-3 h-3 text-red-500" />
                            <span className="font-mono truncate">
                              {endpoint}
                            </span>
                          </div>
                        ))}
                        {status.failedEndpoints.length > 2 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{status.failedEndpoints.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshConnection}
                    disabled={
                      isRefreshing ||
                      (isCloudEnvironment() && !hasValidApiUrl())
                    }
                    className="flex-1"
                    title={
                      isCloudEnvironment() && !hasValidApiUrl()
                        ? "Database connections disabled in cloud environment"
                        : "Test database connection"
                    }
                  >
                    {isRefreshing ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3 mr-1" />
                    )}
                    {isCloudEnvironment() && !hasValidApiUrl()
                      ? "Disabled"
                      : "Test Connection"}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPopover(false)}
                  >
                    Close
                  </Button>
                </div>

                {/* Database Info */}
                <div
                  className={`p-3 rounded-lg border ${
                    status.isConnected
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <Server
                      className={`w-4 h-4 mt-0.5 ${
                        status.isConnected ? "text-green-600" : "text-red-600"
                      }`}
                    />
                    <div className="text-sm">
                      <div
                        className={`font-medium ${
                          status.isConnected ? "text-green-800" : "text-red-800"
                        }`}
                      >
                        {status.isConnected
                          ? "Database Connected"
                          : "Database Unavailable"}
                      </div>
                      <div
                        className={`mt-1 ${
                          status.isConnected ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {status.isConnected
                          ? "All invitations are saved to and loaded from the backend database. No localStorage fallbacks are used."
                          : isCloudEnvironment() && !hasValidApiUrl()
                            ? "Running in cloud environment without backend API. Using local data storage for demonstration purposes."
                            : "Backend database is unavailable. Invitation operations will fail until connection is restored."}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </PopoverContent>
        )}
      </Popover>
    </div>
  );
}

export default DatabaseStatusIndicator;
