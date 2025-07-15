import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  DollarSign,
  Users,
  CheckCircle,
  X,
  AlertCircle,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { companyDashboardApi } from "@/services/companyDashboardApi";
import { useAuth } from "@/contexts/AuthContext";

interface SessionAcceptanceProps {
  refreshTrigger?: number;
}

interface PendingSession {
  id: string;
  title: string;
  description: string;
  scheduledAt: string;
  durationMinutes: number;
  coachRate: number;
  totalAmount: number;
  company: {
    id: string;
    name: string;
  };
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  objectives?: string[];
}

export function SessionAcceptance({ refreshTrigger }: SessionAcceptanceProps) {
  const { user } = useAuth();
  const [pendingSessions, setPendingSessions] = useState<PendingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [sessionToDecline, setSessionToDecline] = useState<string | null>(null);

  useEffect(() => {
    if (user?.userType === "coach") {
      loadPendingSessions();
    }
  }, [user, refreshTrigger]);

  const loadPendingSessions = async () => {
    setIsLoading(true);
    try {
      const sessions =
        await companyDashboardApi.getSessionsAwaitingAcceptance();
      setPendingSessions(sessions);
    } catch (error) {
      console.error("Error loading pending sessions:", error);
      toast.error("Failed to load pending sessions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptSession = async (sessionId: string) => {
    setActionInProgress(sessionId);
    try {
      await companyDashboardApi.acceptSession(sessionId);
      toast.success("Session accepted successfully");

      // Remove from pending sessions
      setPendingSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (error) {
      console.error("Error accepting session:", error);
      toast.error("Failed to accept session");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDeclineSession = async () => {
    if (!sessionToDecline) return;

    setActionInProgress(sessionToDecline);
    try {
      await companyDashboardApi.declineSession(sessionToDecline, declineReason);
      toast.success("Session declined");

      // Remove from pending sessions
      setPendingSessions((prev) =>
        prev.filter((s) => s.id !== sessionToDecline),
      );

      // Reset decline state
      setSessionToDecline(null);
      setDeclineReason("");
    } catch (error) {
      console.error("Error declining session:", error);
      toast.error("Failed to decline session");
    } finally {
      setActionInProgress(null);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}m`;
    }
  };

  if (user?.userType !== "coach") {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Sessions...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pendingSessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Session Requests</CardTitle>
          <CardDescription>
            New session assignments will appear here for your review
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No pending session requests at the moment
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            Pending Session Requests ({pendingSessions.length})
          </CardTitle>
          <CardDescription>
            Review and respond to session assignments from companies
          </CardDescription>
        </CardHeader>
      </Card>

      {pendingSessions.map((session) => {
        const { date, time } = formatDateTime(session.scheduledAt);
        const isActionInProgress = actionInProgress === session.id;

        return (
          <Card key={session.id} className="border-l-4 border-l-orange-500">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{session.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {session.description}
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className="text-orange-600 border-orange-600"
                >
                  Pending Response
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Session Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">
                      <strong>{date}</strong> at {time}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <span className="text-sm">
                      {formatDuration(session.durationMinutes)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-sm">
                      <strong>${session.totalAmount}</strong> total (
                      {session.coachRate}/hour)
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-purple-600" />
                    <span className="text-sm">
                      <strong>{session.company.name}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-teal-600" />
                    <span className="text-sm">
                      {session.employee.firstName} {session.employee.lastName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Objectives */}
              {session.objectives && session.objectives.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">
                    Session Objectives
                  </Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {session.objectives.map((objective, index) => (
                      <Badge key={index} variant="secondary">
                        {objective}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => handleAcceptSession(session.id)}
                  disabled={isActionInProgress}
                  className="flex-1"
                >
                  {isActionInProgress ? (
                    "Processing..."
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Accept Session
                    </>
                  )}
                </Button>

                <Dialog
                  open={sessionToDecline === session.id}
                  onOpenChange={(open) => {
                    if (!open) {
                      setSessionToDecline(null);
                      setDeclineReason("");
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={() => setSessionToDecline(session.id)}
                      disabled={isActionInProgress}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Decline
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Decline Session</DialogTitle>
                      <DialogDescription>
                        Please provide a reason for declining this session. This
                        will help the company understand and potentially
                        reschedule.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="reason">Reason for declining</Label>
                        <Textarea
                          id="reason"
                          placeholder="e.g., Schedule conflict, not my area of expertise, etc."
                          value={declineReason}
                          onChange={(e) => setDeclineReason(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSessionToDecline(null);
                          setDeclineReason("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleDeclineSession}
                        disabled={!declineReason.trim() || isActionInProgress}
                      >
                        {isActionInProgress
                          ? "Declining..."
                          : "Decline Session"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Alert>
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>
          <strong>Response Required:</strong> Please respond to session requests
          within 24 hours. Accepted sessions will be added to your schedule,
          while declined sessions will be reassigned.
        </AlertDescription>
      </Alert>
    </div>
  );
}
