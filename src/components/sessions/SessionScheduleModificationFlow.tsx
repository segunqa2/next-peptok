import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  Edit2,
  Save,
  X,
  RefreshCw,
  Send,
  AlertTriangle,
  CheckCircle,
  UserCheck,
  Shield,
  MessageSquare,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { Session } from "@/types/session";
import { User } from "@/types";
import { apiEnhanced } from "@/services/apiEnhanced";
import { useAuth } from "@/contexts/AuthContext";

interface SessionScheduleModificationFlowProps {
  session: Session;
  onSessionUpdated: (updatedSession: Session) => void;
  onCancel: () => void;
}

interface ScheduleModification {
  id: string;
  sessionId: string;
  originalStartTime: Date;
  originalEndTime: Date;
  newStartTime: Date;
  newEndTime: Date;
  reason: string;
  requestedBy: User;
  requestedAt: Date;
  status: "pending_coach_approval" | "approved" | "rejected" | "cancelled";
  coachResponse?: {
    approved: boolean;
    message?: string;
    respondedAt: Date;
  };
  notifications: {
    coachNotified: boolean;
    participantsNotified: boolean;
    adminNotified: boolean;
  };
}

interface ModificationRequest {
  newStartTime: Date;
  newEndTime: Date;
  reason: string;
  urgency: "low" | "medium" | "high";
  notifyImmediately: boolean;
  message?: string;
}

export const SessionScheduleModificationFlow: React.FC<
  SessionScheduleModificationFlowProps
> = ({ session, onSessionUpdated, onCancel }) => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingModification, setPendingModification] =
    useState<ScheduleModification | null>(null);
  const [modificationHistory, setModificationHistory] = useState<
    ScheduleModification[]
  >([]);

  // Form state for modification request
  const [modificationRequest, setModificationRequest] =
    useState<ModificationRequest>({
      newStartTime: new Date(session.scheduledStartTime),
      newEndTime: new Date(session.scheduledEndTime),
      reason: "",
      urgency: "medium",
      notifyImmediately: true,
      message: "",
    });

  // Coach response state (for coaches)
  const [coachResponse, setCoachResponse] = useState({
    approved: false,
    message: "",
  });

  // Authorization check
  const canModifySchedule =
    user?.userType === "company_admin" || user?.userType === "platform_admin";
  const isCoach = user?.userType === "coach";
  const isAssignedCoach = user?.id === session.mentorId;

  useEffect(() => {
    loadModificationData();
  }, [session.id]);

  const loadModificationData = async () => {
    setLoading(true);
    try {
      // Load pending modification if exists
      const pending = await apiEnhanced.request(
        `/sessions/${session.id}/modifications/pending`,
      );
      setPendingModification(pending);

      // Load modification history
      const history = await apiEnhanced.request(
        `/sessions/${session.id}/modifications/history`,
      );
      setModificationHistory(history);
    } catch (error) {
      console.error("Failed to load modification data:", error);
    } finally {
      setLoading(false);
    }
  };

  const validateModificationTiming = (): boolean => {
    const now = new Date();
    const sessionStart = new Date(session.scheduledStartTime);
    const newSessionStart = modificationRequest.newStartTime;

    // Can't modify past sessions
    if (sessionStart < now) {
      toast.error("Cannot modify sessions that have already started or passed");
      return false;
    }

    // Minimum notice period (2 hours for non-urgent, 30 minutes for urgent)
    const minNoticeHours = modificationRequest.urgency === "high" ? 0.5 : 2;
    const minNoticeTime = new Date(
      now.getTime() + minNoticeHours * 60 * 60 * 1000,
    );

    if (
      newSessionStart < minNoticeTime &&
      modificationRequest.urgency !== "high"
    ) {
      toast.error(
        `Minimum ${minNoticeHours} hour notice required for schedule changes. Use "high" urgency for emergency changes.`,
      );
      return false;
    }

    // Validate session duration
    const duration =
      modificationRequest.newEndTime.getTime() -
      modificationRequest.newStartTime.getTime();
    if (duration <= 0) {
      toast.error("End time must be after start time");
      return false;
    }

    if (duration < 15 * 60 * 1000) {
      toast.error("Session must be at least 15 minutes long");
      return false;
    }

    return true;
  };

  const handleSubmitModificationRequest = async () => {
    if (!modificationRequest.reason.trim()) {
      toast.error("Please provide a reason for the schedule modification");
      return;
    }

    if (!validateModificationTiming()) {
      return;
    }

    setSaving(true);
    try {
      const modification: Partial<ScheduleModification> = {
        sessionId: session.id,
        originalStartTime: new Date(session.scheduledStartTime),
        originalEndTime: new Date(session.scheduledEndTime),
        newStartTime: modificationRequest.newStartTime,
        newEndTime: modificationRequest.newEndTime,
        reason: modificationRequest.reason,
        requestedBy: user!,
        requestedAt: new Date(),
        status: "pending_coach_approval",
        notifications: {
          coachNotified: modificationRequest.notifyImmediately,
          participantsNotified: false, // Will be notified after coach approval
          adminNotified: true,
        },
      };

      const createdModification = await apiEnhanced.request(
        `/sessions/${session.id}/modifications`,
        {
          method: "POST",
          body: JSON.stringify({
            modification,
            urgency: modificationRequest.urgency,
            message: modificationRequest.message,
            notifyImmediately: modificationRequest.notifyImmediately,
          }),
        },
      );

      setPendingModification(createdModification);

      // Log the modification attempt
      await apiEnhanced.request(`/sessions/${session.id}/modifications/log`, {
        method: "POST",
        body: JSON.stringify({
          action: "modification_requested",
          requestedBy: user!.id,
          details: {
            originalTime: session.scheduledStartTime,
            newTime: modificationRequest.newStartTime,
            reason: modificationRequest.reason,
            urgency: modificationRequest.urgency,
          },
        }),
      });

      toast.success("Schedule modification request sent to coach for approval");
    } catch (error) {
      console.error("Failed to submit modification request:", error);
      toast.error("Failed to submit modification request");
    } finally {
      setSaving(false);
    }
  };

  const handleCoachResponse = async (approved: boolean) => {
    if (!pendingModification) return;

    setSaving(true);
    try {
      const response = {
        modificationId: pendingModification.id,
        approved,
        message: coachResponse.message,
        respondedAt: new Date(),
      };

      await apiEnhanced.request(
        `/sessions/${session.id}/modifications/${pendingModification.id}/respond`,
        {
          method: "POST",
          body: JSON.stringify(response),
        },
      );

      if (approved) {
        // Apply the schedule changes
        const updatedSession = await apiEnhanced.updateSession(session.id, {
          scheduledStartTime: pendingModification.newStartTime,
          scheduledEndTime: pendingModification.newEndTime,
          rescheduleCount: session.rescheduleCount + 1,
          updatedAt: new Date(),
        });

        onSessionUpdated(updatedSession);

        // Notify participants about the approved change
        await apiEnhanced.request(`/notifications/schedule-change-approved`, {
          method: "POST",
          body: JSON.stringify({
            sessionId: session.id,
            modificationId: pendingModification.id,
            newStartTime: pendingModification.newStartTime,
            reason: pendingModification.reason,
            coachMessage: coachResponse.message,
          }),
        });

        toast.success(
          "Schedule modification approved and participants notified",
        );
      } else {
        toast.success("Schedule modification rejected");
      }

      // Clear pending modification
      setPendingModification(null);
      loadModificationData();
    } catch (error) {
      console.error("Failed to respond to modification:", error);
      toast.error("Failed to process coach response");
    } finally {
      setSaving(false);
    }
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(date));
  };

  const formatDateTimeInput = (date: Date) => {
    return new Date(date).toISOString().slice(0, 16);
  };

  const parseDateTimeInput = (dateTimeString: string) => {
    return new Date(dateTimeString);
  };

  // Check if session can be started (no pending modifications)
  const canStartSession =
    !pendingModification &&
    session.status === "scheduled" &&
    new Date() >= new Date(session.scheduledStartTime);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
            Loading modification data...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Status and Authorization Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Session Schedule Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-lg">{session.title}</h3>
              <p className="text-gray-600">{session.description}</p>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDateTime(session.scheduledStartTime)}
              </div>
              <Badge
                variant={
                  session.status === "scheduled" ? "default" : "secondary"
                }
              >
                {session.status}
              </Badge>
              {pendingModification && (
                <Badge
                  variant="outline"
                  className="text-orange-600 border-orange-600"
                >
                  Modification Pending
                </Badge>
              )}
            </div>

            {/* Authorization Status */}
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
              <Shield className="w-4 h-4" />
              <span className="text-sm">
                Your permissions:{" "}
                {canModifySchedule && (
                  <Badge variant="default">Can modify schedule</Badge>
                )}
                {isAssignedCoach && (
                  <Badge variant="secondary">Assigned coach</Badge>
                )}
                {!canModifySchedule && !isAssignedCoach && (
                  <Badge variant="outline">View only</Badge>
                )}
              </span>
            </div>

            {/* Session Start Restriction */}
            {pendingModification && (
              <Alert>
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  <strong>Session Start Blocked:</strong> This session cannot be
                  started until the pending schedule modification is resolved by
                  the coach.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pending Modification (for coaches to respond) */}
      {pendingModification && isAssignedCoach && (
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-orange-600" />
              Schedule Modification Request - Response Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">
                    Current Schedule
                  </h4>
                  <p className="text-sm">
                    {formatDateTime(pendingModification.originalStartTime)}
                  </p>
                  <p className="text-sm text-gray-600">
                    to {formatDateTime(pendingModification.originalEndTime)}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">
                    Requested New Schedule
                  </h4>
                  <p className="text-sm font-medium text-blue-600">
                    {formatDateTime(pendingModification.newStartTime)}
                  </p>
                  <p className="text-sm text-gray-600">
                    to {formatDateTime(pendingModification.newEndTime)}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-1">
                  Reason for Change
                </h4>
                <p className="text-sm bg-gray-50 p-2 rounded">
                  {pendingModification.reason}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-1">
                  Requested by
                </h4>
                <p className="text-sm">
                  {pendingModification.requestedBy.name} (
                  {pendingModification.requestedBy.email})
                  <span className="text-gray-500 ml-2">
                    on {formatDateTime(pendingModification.requestedAt)}
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Your Response (Optional)
                </label>
                <Textarea
                  value={coachResponse.message}
                  onChange={(e) =>
                    setCoachResponse({
                      ...coachResponse,
                      message: e.target.value,
                    })
                  }
                  placeholder="Add a message about your decision..."
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleCoachResponse(true)}
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Approve Schedule Change
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleCoachResponse(false)}
                  disabled={saving}
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject Change
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modification Request Form (for company admins) */}
      {canModifySchedule && !pendingModification && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit2 className="w-5 h-5" />
              Request Schedule Modification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    New Start Time *
                  </label>
                  <Input
                    type="datetime-local"
                    value={formatDateTimeInput(
                      modificationRequest.newStartTime,
                    )}
                    onChange={(e) =>
                      setModificationRequest({
                        ...modificationRequest,
                        newStartTime: parseDateTimeInput(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    New End Time *
                  </label>
                  <Input
                    type="datetime-local"
                    value={formatDateTimeInput(modificationRequest.newEndTime)}
                    onChange={(e) =>
                      setModificationRequest({
                        ...modificationRequest,
                        newEndTime: parseDateTimeInput(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Reason for Modification *
                </label>
                <Textarea
                  value={modificationRequest.reason}
                  onChange={(e) =>
                    setModificationRequest({
                      ...modificationRequest,
                      reason: e.target.value,
                    })
                  }
                  placeholder="Please explain why this session needs to be rescheduled..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Urgency Level
                  </label>
                  <Select
                    value={modificationRequest.urgency}
                    onValueChange={(value: "low" | "medium" | "high") =>
                      setModificationRequest({
                        ...modificationRequest,
                        urgency: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - Standard notice</SelectItem>
                      <SelectItem value="medium">
                        Medium - Needs attention
                      </SelectItem>
                      <SelectItem value="high">
                        High - Emergency change
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="notifyImmediately"
                    checked={modificationRequest.notifyImmediately}
                    onChange={(e) =>
                      setModificationRequest({
                        ...modificationRequest,
                        notifyImmediately: e.target.checked,
                      })
                    }
                  />
                  <label htmlFor="notifyImmediately" className="text-sm">
                    Notify coach immediately
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Additional Message (Optional)
                </label>
                <Textarea
                  value={modificationRequest.message}
                  onChange={(e) =>
                    setModificationRequest({
                      ...modificationRequest,
                      message: e.target.value,
                    })
                  }
                  placeholder="Any additional context for the coach..."
                  rows={2}
                />
              </div>

              <Alert>
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  The assigned coach must approve this modification before the
                  session can proceed. The session will be temporarily blocked
                  from starting until approval is received.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      disabled={saving || !modificationRequest.reason.trim()}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Submit Modification Request
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        Confirm Schedule Modification Request
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will send a modification request to the assigned
                        coach. The session will be blocked from starting until
                        the coach responds. Are you sure you want to proceed?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleSubmitModificationRequest}
                      >
                        Yes, Send Request
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modification History */}
      {modificationHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Modification History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {modificationHistory.map((mod, index) => (
                <div
                  key={mod.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-md"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={
                          mod.status === "approved"
                            ? "default"
                            : mod.status === "rejected"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {mod.status.replace("_", " ")}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {formatDateTime(mod.requestedAt)}
                      </span>
                    </div>
                    <p className="text-sm">{mod.reason}</p>
                    {mod.coachResponse?.message && (
                      <div className="mt-2 p-2 bg-white rounded border-l-2 border-blue-200">
                        <div className="flex items-center gap-1 mb-1">
                          <MessageSquare className="w-3 h-3 text-blue-600" />
                          <span className="text-xs font-medium text-blue-600">
                            Coach Response
                          </span>
                        </div>
                        <p className="text-xs text-gray-700">
                          {mod.coachResponse.message}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Modification Status (for company admin view) */}
      {pendingModification && !isAssignedCoach && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Modification Request Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-blue-600 border-blue-600"
                >
                  Awaiting Coach Approval
                </Badge>
                <span className="text-sm text-gray-600">
                  Requested {formatDateTime(pendingModification.requestedAt)}
                </span>
              </div>
              <p className="text-sm">
                The assigned coach has been notified and must approve this
                modification before the session can proceed.
              </p>

              <Alert>
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  Session start is temporarily blocked until coach approval is
                  received.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Permission Message */}
      {!canModifySchedule && !isAssignedCoach && (
        <Card>
          <CardContent className="p-6 text-center">
            <Shield className="w-8 h-8 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600">
              You don't have permission to modify this session's schedule. Only
              company administrators and platform administrators can request
              schedule changes.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
