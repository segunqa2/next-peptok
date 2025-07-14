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
import { Progress } from "@/components/ui/progress";
import {
  Wifi,
  WifiOff,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { offlineSync, SyncStatus, SyncOperation } from "@/services/offlineSync";
import { toast } from "sonner";

interface OfflineIndicatorProps {
  className?: string;
  position?: "fixed" | "relative";
  showDetails?: boolean;
}

export function OfflineIndicator({
  className = "",
  position = "fixed",
  showDetails = true,
}: OfflineIndicatorProps) {
  const [status, setStatus] = useState<SyncStatus>(offlineSync.getStatus());
  const [pendingOps, setPendingOps] = useState<SyncOperation[]>([]);
  const [showPopover, setShowPopover] = useState(false);

  useEffect(() => {
    // Subscribe to status changes
    const unsubscribe = offlineSync.onStatusChange((newStatus) => {
      setStatus(newStatus);

      // Update pending operations
      const pending = offlineSync.getPendingOperations();
      setPendingOps(pending);
    });

    // Initial load
    const pending = offlineSync.getPendingOperations();
    setPendingOps(pending);

    return unsubscribe;
  }, []);

  const handleManualSync = async () => {
    try {
      await offlineSync.triggerSync();
      toast.success("Manual sync triggered");
    } catch (error) {
      toast.error("Manual sync failed");
    }
  };

  const handleClearQueue = () => {
    offlineSync.clearSyncQueue();
    toast.success("Sync queue cleared");
    setShowPopover(false);
  };

  const getStatusIcon = () => {
    if (!status.isOnline) {
      return <WifiOff className="w-4 h-4 text-red-500" />;
    }

    if (status.isSyncing) {
      return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    }

    if (status.pendingOperations > 0) {
      return <Clock className="w-4 h-4 text-yellow-500" />;
    }

    return <Wifi className="w-4 h-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (!status.isOnline) {
      return "Offline";
    }

    if (status.isSyncing) {
      return "Syncing...";
    }

    if (status.pendingOperations > 0) {
      return `${status.pendingOperations} pending`;
    }

    return "Online";
  };

  const getStatusColor = () => {
    if (!status.isOnline) return "destructive";
    if (status.isSyncing) return "default";
    if (status.pendingOperations > 0) return "secondary";
    return "default";
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getOperationIcon = (operation: SyncOperation) => {
    switch (operation.type) {
      case "CREATE":
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case "UPDATE":
        return <RotateCcw className="w-3 h-3 text-blue-500" />;
      case "DELETE":
        return <Trash2 className="w-3 h-3 text-red-500" />;
      default:
        return <Clock className="w-3 h-3 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600";
      case "medium":
        return "text-yellow-600";
      case "low":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  if (!showDetails && status.isOnline && status.pendingOperations === 0) {
    return null; // Hide when everything is normal
  }

  return (
    <div
      className={`${position === "fixed" ? "fixed bottom-4 right-4 z-50" : ""} ${className}`}
    >
      <Popover open={showPopover} onOpenChange={setShowPopover}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`${
              status.isOnline ? "bg-white" : "bg-red-50 border-red-200"
            } shadow-lg hover:shadow-xl transition-all duration-200`}
          >
            {getStatusIcon()}
            <span className="ml-2 font-medium">{getStatusText()}</span>
            {status.pendingOperations > 0 && (
              <Badge variant="secondary" className="ml-2 px-1 py-0 text-xs">
                {status.pendingOperations}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>

        {showDetails && (
          <PopoverContent className="w-96 p-0" align="end">
            <Card className="border-0 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  {getStatusIcon()}
                  Sync Status
                </CardTitle>
                <CardDescription>
                  {status.isOnline
                    ? "Connected to server"
                    : "Working offline - changes will sync when reconnected"}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Status Overview */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-gray-600">Status</div>
                    <Badge variant={getStatusColor()} className="mt-1">
                      {status.isOnline ? "Online" : "Offline"}
                    </Badge>
                  </div>

                  <div>
                    <div className="font-medium text-gray-600">Pending</div>
                    <div className="mt-1 font-mono text-lg">
                      {status.pendingOperations}
                    </div>
                  </div>

                  {status.lastSyncTime && (
                    <div className="col-span-2">
                      <div className="font-medium text-gray-600">Last Sync</div>
                      <div className="mt-1 text-xs text-gray-500">
                        {formatTimestamp(status.lastSyncTime)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sync Progress */}
                {status.isSyncing && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Syncing operations...</span>
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                )}

                {/* Pending Operations */}
                {pendingOps.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">
                        Pending Operations
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearQueue}
                        className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Clear
                      </Button>
                    </div>

                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {pendingOps.slice(0, 5).map((op) => (
                        <div
                          key={op.id}
                          className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs"
                        >
                          {getOperationIcon(op)}
                          <div className="flex-1">
                            <div className="font-medium truncate">
                              {op.entityType.replace("_", " ")}
                            </div>
                            <div className="text-gray-500 truncate">
                              {op.method} {op.endpoint.split("/").pop()}
                            </div>
                          </div>
                          <div
                            className={`font-medium ${getPriorityColor(op.priority)}`}
                          >
                            {op.priority}
                          </div>
                          {op.retryCount > 0 && (
                            <div className="text-red-500 font-mono">
                              {op.retryCount}/{op.maxRetries}
                            </div>
                          )}
                        </div>
                      ))}

                      {pendingOps.length > 5 && (
                        <div className="text-center text-xs text-gray-500 py-1">
                          +{pendingOps.length - 5} more operations
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManualSync}
                    disabled={!status.isOnline || status.isSyncing}
                    className="flex-1"
                  >
                    {status.isSyncing ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3 h-3 mr-1" />
                    )}
                    Sync Now
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPopover(false)}
                  >
                    Close
                  </Button>
                </div>

                {/* Offline Tips */}
                {!status.isOnline && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div className="text-sm">
                        <div className="font-medium text-blue-800">
                          Working Offline
                        </div>
                        <div className="text-blue-600 mt-1">
                          Your changes are saved locally and will sync
                          automatically when you're back online.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </PopoverContent>
        )}
      </Popover>
    </div>
  );
}

export default OfflineIndicator;
