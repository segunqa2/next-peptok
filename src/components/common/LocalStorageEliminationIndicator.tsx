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
  ShieldCheck,
  Database,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  HardDrive,
} from "lucide-react";
import { localStorageElimination } from "@/services/localStorageElimination";
import { toast } from "sonner";

interface LocalStorageEliminationIndicatorProps {
  className?: string;
  position?: "fixed" | "relative";
  showDetails?: boolean;
}

export function LocalStorageEliminationIndicator({
  className = "",
  position = "fixed",
  showDetails = true,
}: LocalStorageEliminationIndicatorProps) {
  const [status, setStatus] = useState({
    eliminationActive: false,
    migratedKeysCount: 0,
    backendOnlyMode: false,
  });

  const [verificationResults, setVerificationResults] = useState<{
    isClean: boolean;
    remainingKeys: string[];
    backendDataCount: number;
  } | null>(null);

  const [showPopover, setShowPopover] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Load initial status
    setStatus(localStorageElimination.getStatus());

    // Verify localStorage elimination
    verifyElimination();

    // Set up periodic status check
    const interval = setInterval(() => {
      setStatus(localStorageElimination.getStatus());
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const verifyElimination = async () => {
    try {
      const results = await localStorageElimination.verifyNoLocalStorageUsage();
      setVerificationResults(results);
    } catch (error) {
      console.error("Failed to verify localStorage elimination:", error);
    }
  };

  const handleCompleteElimination = async () => {
    setIsProcessing(true);

    try {
      const success =
        await localStorageElimination.completeLocalStorageElimination();

      if (success) {
        toast.success("✅ localStorage completely eliminated", {
          description: "All data now stored in backend database only",
          duration: 5000,
        });
        await verifyElimination();
        setStatus(localStorageElimination.getStatus());
      } else {
        toast.error("❌ Failed to eliminate all localStorage");
      }
    } catch (error) {
      toast.error("❌ Elimination process failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEmergencyRestore = async () => {
    setIsProcessing(true);

    try {
      const success = await localStorageElimination.emergencyRestore();

      if (success) {
        toast.warning("🚨 Emergency restore completed", {
          description: "Critical data temporarily restored to localStorage",
          duration: 5000,
        });
        await verifyElimination();
      } else {
        toast.error("❌ Emergency restore failed");
      }
    } catch (error) {
      toast.error("❌ Emergency restore failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = () => {
    if (isProcessing) {
      return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    }

    if (verificationResults?.isClean) {
      return <ShieldCheck className="w-4 h-4 text-green-500" />;
    }

    if (verificationResults?.remainingKeys.length > 0) {
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }

    return <HardDrive className="w-4 h-4 text-gray-500" />;
  };

  const getStatusText = () => {
    if (isProcessing) return "Processing...";

    if (verificationResults?.isClean) {
      return "Backend Only";
    }

    if (verificationResults?.remainingKeys.length > 0) {
      return `${verificationResults.remainingKeys.length} localStorage keys`;
    }

    return "Checking...";
  };

  const getStatusColor = () => {
    if (verificationResults?.isClean) return "default";
    if (verificationResults?.remainingKeys.length > 0) return "secondary";
    return "destructive";
  };

  // Show indicator if there are localStorage keys remaining or if backend-only mode is active
  if (!showDetails && verificationResults?.isClean && status.backendOnlyMode) {
    return (
      <div
        className={`${position === "fixed" ? "fixed bottom-48 right-4 z-50" : ""} ${className}`}
      >
        <Badge variant="default" className="bg-green-600 text-white shadow-lg">
          <ShieldCheck className="w-3 h-3 mr-1" />
          Backend Only
        </Badge>
      </div>
    );
  }

  return (
    <div
      className={`${position === "fixed" ? "fixed bottom-48 right-4 z-50" : ""} ${className}`}
    >
      <Popover open={showPopover} onOpenChange={setShowPopover}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`${
              verificationResults?.isClean
                ? "bg-green-50 border-green-200"
                : "bg-yellow-50 border-yellow-200"
            } shadow-lg hover:shadow-xl transition-all duration-200`}
          >
            {getStatusIcon()}
            <span className="ml-2 font-medium">{getStatusText()}</span>
            {verificationResults?.remainingKeys.length > 0 && (
              <Badge variant="destructive" className="ml-2 px-1 py-0 text-xs">
                {verificationResults.remainingKeys.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>

        {showDetails && (
          <PopoverContent className="w-96 p-0" align="end">
            <Card className="border-0 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Trash2 className="w-4 h-4" />
                  localStorage Elimination
                </CardTitle>
                <CardDescription>
                  All data storage moved to backend database
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Status Overview */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-gray-600">Mode</div>
                    <Badge variant={getStatusColor()} className="mt-1">
                      {verificationResults?.isClean
                        ? "Backend Only"
                        : "Migration Needed"}
                    </Badge>
                  </div>

                  <div>
                    <div className="font-medium text-gray-600">
                      Backend Items
                    </div>
                    <div className="mt-1 font-mono text-lg text-green-600">
                      {verificationResults?.backendDataCount || 0}
                    </div>
                  </div>

                  <div>
                    <div className="font-medium text-gray-600">Migrated</div>
                    <div className="mt-1 font-mono text-lg">
                      {status.migratedKeysCount}
                    </div>
                  </div>

                  <div>
                    <div className="font-medium text-gray-600">Remaining</div>
                    <div className="mt-1 font-mono text-lg text-red-600">
                      {verificationResults?.remainingKeys.length || 0}
                    </div>
                  </div>
                </div>

                {/* Remaining localStorage Keys */}
                {verificationResults?.remainingKeys.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-red-600">
                      Remaining localStorage Keys
                    </h4>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {verificationResults.remainingKeys.map((key) => (
                        <div
                          key={key}
                          className="flex items-center gap-2 p-2 bg-red-50 rounded text-xs"
                        >
                          <XCircle className="w-3 h-3 text-red-500" />
                          <span className="font-mono truncate">{key}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {verificationResults?.isClean && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                      <div className="text-sm">
                        <div className="font-medium text-green-800">
                          localStorage Eliminated
                        </div>
                        <div className="text-green-600 mt-1">
                          All data is now stored in and loaded from the backend
                          database only. No localStorage fallbacks are used.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 border-t">
                  {!verificationResults?.isClean && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCompleteElimination}
                      disabled={isProcessing}
                      className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3 mr-1" />
                      )}
                      Complete Elimination
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={verifyElimination}
                    disabled={isProcessing}
                  >
                    Verify
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPopover(false)}
                  >
                    Close
                  </Button>
                </div>

                {/* Emergency Controls */}
                {verificationResults?.isClean && (
                  <details className="pt-2 border-t">
                    <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                      Emergency Controls
                    </summary>
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEmergencyRestore}
                        disabled={isProcessing}
                        className="w-full text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 mr-1" />
                        )}
                        Emergency Restore
                      </Button>
                      <p className="text-xs text-gray-500 mt-1">
                        Temporarily restore critical data to localStorage
                      </p>
                    </div>
                  </details>
                )}

                {/* Storage Info */}
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-2">
                    <Database className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium text-blue-800">
                        Backend Database Storage
                      </div>
                      <div className="text-blue-600 mt-1">
                        All user data, settings, invitations, and application
                        state are now stored exclusively in the backend
                        database.
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

export default LocalStorageEliminationIndicator;
