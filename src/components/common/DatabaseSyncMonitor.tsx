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
} from "lucide-react";
import {
  databaseValidation,
  DatabaseValidationResult,
} from "@/services/databaseValidation";
import { toast } from "sonner";

interface DatabaseSyncMonitorProps {
  className?: string;
  position?: "fixed" | "relative";
  showDetails?: boolean;
}

export function DatabaseSyncMonitor({
  className = "",
  position = "fixed",
  showDetails = true,
}: DatabaseSyncMonitorProps) {
  const [validationStatus, setValidationStatus] = useState<{
    totalOperations: number;
    validatedOperations: number;
    failedOperations: number;
    lastValidation?: string;
  }>({
    totalOperations: 0,
    validatedOperations: 0,
    failedOperations: 0,
  });

  const [recentValidations, setRecentValidations] = useState<
    Array<{
      id: string;
      type: string;
      status: "success" | "warning" | "error";
      timestamp: string;
      message: string;
    }>
  >([]);

  const [showPopover, setShowPopover] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    // Load validation history from localStorage
    loadValidationHistory();

    // Set up periodic validation status check
    const interval = setInterval(() => {
      loadValidationHistory();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loadValidationHistory = () => {
    try {
      const history = localStorage.getItem("peptok_validation_history");
      if (history) {
        const parsedHistory = JSON.parse(history);
        setRecentValidations(parsedHistory.slice(-10)); // Keep last 10

        // Update status
        const totalOps = parsedHistory.length;
        const validatedOps = parsedHistory.filter(
          (v: any) => v.status === "success",
        ).length;
        const failedOps = parsedHistory.filter(
          (v: any) => v.status === "error",
        ).length;

        setValidationStatus({
          totalOperations: totalOps,
          validatedOperations: validatedOps,
          failedOperations: failedOps,
          lastValidation: parsedHistory[parsedHistory.length - 1]?.timestamp,
        });
      }
    } catch (error) {
      console.error("Failed to load validation history:", error);
    }
  };

  const addValidationResult = (
    type: string,
    result: DatabaseValidationResult,
  ) => {
    const validation = {
      id: `val_${Date.now()}`,
      type,
      status: result.isValid
        ? "success"
        : result.errors.length > 0
          ? "error"
          : "warning",
      timestamp: new Date().toISOString(),
      message: result.isValid
        ? `Database validation successful`
        : result.errors[0] || result.warnings[0] || "Unknown issue",
    };

    const history = [...recentValidations, validation];
    setRecentValidations(history.slice(-10));

    // Save to localStorage
    try {
      localStorage.setItem(
        "peptok_validation_history",
        JSON.stringify(history),
      );
    } catch (error) {
      console.error("Failed to save validation history:", error);
    }

    loadValidationHistory();
  };

  const runManualValidation = async () => {
    setIsValidating(true);

    try {
      // Get recent operations from offline sync
      const pendingOperations = JSON.parse(
        localStorage.getItem("peptok_sync_queue") || "[]",
      );

      if (pendingOperations.length === 0) {
        toast.info("No recent operations to validate");
        return;
      }

      // Validate recent invitation operations
      const invitationOps = pendingOperations
        .filter((op: any) => op.entityType.includes("invitation"))
        .slice(-5); // Last 5 operations

      if (invitationOps.length === 0) {
        toast.info("No invitation operations to validate");
        return;
      }

      const validations = invitationOps.map((op: any) => ({
        type: op.type.toLowerCase(),
        id: op.entityId || op.id,
        data: op.data,
      }));

      const results = await databaseValidation.batchValidate(validations);

      results.forEach((result, index) => {
        addValidationResult(invitationOps[index].type, result);
      });

      const successCount = results.filter((r) => r.isValid).length;
      toast.success(
        `Validated ${successCount}/${results.length} operations in database`,
      );
    } catch (error) {
      console.error("Manual validation failed:", error);
      toast.error("Manual validation failed");
    } finally {
      setIsValidating(false);
    }
  };

  const getStatusIcon = () => {
    if (isValidating) {
      return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    }

    if (validationStatus.failedOperations > 0) {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }

    if (validationStatus.validatedOperations > 0) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }

    return <Database className="w-4 h-4 text-gray-500" />;
  };

  const getStatusText = () => {
    if (isValidating) return "Validating...";

    if (validationStatus.totalOperations === 0) {
      return "No operations";
    }

    const successRate = Math.round(
      (validationStatus.validatedOperations /
        validationStatus.totalOperations) *
        100,
    );

    return `${successRate}% validated`;
  };

  const getStatusColor = () => {
    if (validationStatus.failedOperations > 0) return "destructive";
    if (validationStatus.validatedOperations > 0) return "default";
    return "secondary";
  };

  const getValidationIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case "warning":
        return <AlertTriangle className="w-3 h-3 text-yellow-500" />;
      case "error":
        return <XCircle className="w-3 h-3 text-red-500" />;
      default:
        return <Activity className="w-3 h-3 text-gray-500" />;
    }
  };

  if (!showDetails && validationStatus.totalOperations === 0) {
    return null;
  }

  return (
    <div
      className={`${position === "fixed" ? "fixed bottom-16 right-4 z-50" : ""} ${className}`}
    >
      <Popover open={showPopover} onOpenChange={setShowPopover}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="bg-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {getStatusIcon()}
            <span className="ml-2 font-medium">{getStatusText()}</span>
            {validationStatus.failedOperations > 0 && (
              <Badge variant="destructive" className="ml-2 px-1 py-0 text-xs">
                {validationStatus.failedOperations}
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
                  Database Validation
                </CardTitle>
                <CardDescription>
                  Ensures invitations and operations are saved to backend
                  database
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Status Overview */}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-gray-600">Total</div>
                    <div className="mt-1 font-mono text-lg">
                      {validationStatus.totalOperations}
                    </div>
                  </div>

                  <div>
                    <div className="font-medium text-gray-600">Validated</div>
                    <div className="mt-1 font-mono text-lg text-green-600">
                      {validationStatus.validatedOperations}
                    </div>
                  </div>

                  <div>
                    <div className="font-medium text-gray-600">Failed</div>
                    <div className="mt-1 font-mono text-lg text-red-600">
                      {validationStatus.failedOperations}
                    </div>
                  </div>
                </div>

                {/* Recent Validations */}
                {recentValidations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Recent Validations</h4>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {recentValidations.slice(-5).map((validation) => (
                        <div
                          key={validation.id}
                          className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs"
                        >
                          {getValidationIcon(validation.status)}
                          <div className="flex-1">
                            <div className="font-medium">
                              {validation.type.toUpperCase()}
                            </div>
                            <div className="text-gray-500 truncate">
                              {validation.message}
                            </div>
                          </div>
                          <div className="text-gray-400 text-xs">
                            {new Date(
                              validation.timestamp,
                            ).toLocaleTimeString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={runManualValidation}
                    disabled={isValidating}
                    className="flex-1"
                  >
                    {isValidating ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <Database className="w-3 h-3 mr-1" />
                    )}
                    Validate Now
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
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-2">
                    <Database className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium text-blue-800">
                        Database Validation
                      </div>
                      <div className="text-blue-600 mt-1">
                        Verifies that team invitations and resends are properly
                        saved to the backend database, not just localStorage.
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

export default DatabaseSyncMonitor;
