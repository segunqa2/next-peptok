import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Calendar,
  Clock,
  Edit2,
  Save,
  X,
  RefreshCw,
  Send,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Session } from "@/types/session";
import { apiEnhanced } from "@/services/apiEnhanced";
import { SessionRecommendations } from "./SessionRecommendations";

interface ScheduleUpdateFlowProps {
  session: Session;
  onSessionUpdated: (updatedSession: Session) => void;
  onCancel: () => void;
}

interface RescheduleNotification {
  recipientEmails: string[];
  message: string;
  notifyCoach: boolean;
  notifyParticipants: boolean;
  includeNewTimeSlots: boolean;
}

export const ScheduleUpdateFlow: React.FC<ScheduleUpdateFlowProps> = ({
  session,
  onSessionUpdated,
  onCancel,
}) => {
  const [editMode, setEditMode] = useState<"details" | "reschedule" | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);

  // Form state for session details
  const [sessionDetails, setSessionDetails] = useState({
    title: session.title,
    description: session.description,
    type: session.type,
  });

  // Form state for rescheduling
  const [rescheduleData, setRescheduleData] = useState({
    newStartTime: session.scheduledStartTime,
    newEndTime: session.scheduledEndTime,
    reason: "",
  });

  // Notification preferences
  const [notification, setNotification] = useState<RescheduleNotification>({
    recipientEmails: [],
    message: "",
    notifyCoach: true,
    notifyParticipants: true,
    includeNewTimeSlots: true,
  });

  useEffect(() => {
    // Extract participant emails for notifications
    const emails = session.participants
      .map((p) => p.userId) // Assuming userId is email or we need to resolve it
      .filter(Boolean);
    setNotification((prev) => ({ ...prev, recipientEmails: emails }));
  }, [session]);

  const handleUpdateSessionDetails = async () => {
    setSaving(true);
    try {
      const updatedSession = await apiEnhanced.updateSession(session.id, {
        title: sessionDetails.title,
        description: sessionDetails.description,
        type: sessionDetails.type,
      });

      toast.success("Session details updated successfully");
      onSessionUpdated(updatedSession);
      setEditMode(null);
    } catch (error) {
      console.error("Failed to update session:", error);
      toast.error("Failed to update session details");
    } finally {
      setSaving(false);
    }
  };

  const handleRescheduleSession = async () => {
    if (!rescheduleData.reason.trim()) {
      toast.error("Please provide a reason for rescheduling");
      return;
    }

    setSaving(true);
    try {
      // Update session timing
      const updatedSession = await apiEnhanced.updateSession(session.id, {
        scheduledStartTime: rescheduleData.newStartTime,
        scheduledEndTime: rescheduleData.newEndTime,
        rescheduleCount: session.rescheduleCount + 1,
        updatedAt: new Date(),
      });

      // Send notifications
      await sendRescheduleNotifications(updatedSession, rescheduleData.reason);

      toast.success("Session rescheduled and notifications sent");
      onSessionUpdated(updatedSession);
      setEditMode(null);
    } catch (error) {
      console.error("Failed to reschedule session:", error);
      toast.error("Failed to reschedule session");
    } finally {
      setSaving(false);
    }
  };

  const sendRescheduleNotifications = async (
    updatedSession: Session,
    reason: string,
  ) => {
    try {
      const notificationData = {
        sessionId: updatedSession.id,
        oldStartTime: session.scheduledStartTime,
        newStartTime: updatedSession.scheduledStartTime,
        reason,
        customMessage: notification.message,
        recipients: {
          coach: notification.notifyCoach,
          participants: notification.notifyParticipants,
        },
      };

      await apiEnhanced.request("/notifications/reschedule", {
        method: "POST",
        body: JSON.stringify(notificationData),
      });

      console.log("✅ Reschedule notifications sent");
    } catch (error) {
      console.warn("Failed to send notifications:", error);
      // Don't fail the whole operation if notifications fail
    }
  };

  const handleTimeSlotSelection = (startTime: Date, endTime: Date) => {
    setRescheduleData({
      ...rescheduleData,
      newStartTime: startTime,
      newEndTime: endTime,
    });
    setShowRecommendations(false);
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

  return (
    <div className="space-y-6">
      {/* Current Session Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Update Session
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
              <Badge variant="outline">{session.type}</Badge>
              <Badge variant="secondary">
                {session.participants.length} participants
              </Badge>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setEditMode("details")}
                disabled={saving}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Details
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditMode("reschedule")}
                disabled={saving}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reschedule
              </Button>
              <Button variant="ghost" onClick={onCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Session Details */}
      {editMode === "details" && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Session Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <Input
                  value={sessionDetails.title}
                  onChange={(e) =>
                    setSessionDetails({
                      ...sessionDetails,
                      title: e.target.value,
                    })
                  }
                  placeholder="Session title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <Textarea
                  value={sessionDetails.description}
                  onChange={(e) =>
                    setSessionDetails({
                      ...sessionDetails,
                      description: e.target.value,
                    })
                  }
                  placeholder="Session description"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={sessionDetails.type}
                  onChange={(e) =>
                    setSessionDetails({
                      ...sessionDetails,
                      type: e.target.value as "video" | "audio" | "chat",
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="video">Video Call</option>
                  <option value="audio">Audio Call</option>
                  <option value="chat">Chat Session</option>
                </select>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleUpdateSessionDetails} disabled={saving}>
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditMode(null)}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reschedule Session */}
      {editMode === "reschedule" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reschedule Session</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      New Start Time
                    </label>
                    <Input
                      type="datetime-local"
                      value={formatDateTimeInput(rescheduleData.newStartTime)}
                      onChange={(e) =>
                        setRescheduleData({
                          ...rescheduleData,
                          newStartTime: parseDateTimeInput(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      New End Time
                    </label>
                    <Input
                      type="datetime-local"
                      value={formatDateTimeInput(rescheduleData.newEndTime)}
                      onChange={(e) =>
                        setRescheduleData({
                          ...rescheduleData,
                          newEndTime: parseDateTimeInput(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Reason for Rescheduling *
                  </label>
                  <Textarea
                    value={rescheduleData.reason}
                    onChange={(e) =>
                      setRescheduleData({
                        ...rescheduleData,
                        reason: e.target.value,
                      })
                    }
                    placeholder="Please explain why you need to reschedule this session..."
                    rows={2}
                  />
                </div>

                <div>
                  <Button
                    variant="outline"
                    onClick={() => setShowRecommendations(!showRecommendations)}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    {showRecommendations
                      ? "Hide Recommendations"
                      : "Get Time Recommendations"}
                  </Button>
                </div>

                {/* Notification Settings */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Notification Settings</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={notification.notifyCoach}
                        onChange={(e) =>
                          setNotification({
                            ...notification,
                            notifyCoach: e.target.checked,
                          })
                        }
                      />
                      <span className="text-sm">Notify coach</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={notification.notifyParticipants}
                        onChange={(e) =>
                          setNotification({
                            ...notification,
                            notifyParticipants: e.target.checked,
                          })
                        }
                      />
                      <span className="text-sm">Notify all participants</span>
                    </label>
                  </div>

                  <div className="mt-3">
                    <label className="block text-sm font-medium mb-1">
                      Additional Message (Optional)
                    </label>
                    <Textarea
                      value={notification.message}
                      onChange={(e) =>
                        setNotification({
                          ...notification,
                          message: e.target.value,
                        })
                      }
                      placeholder="Add a personal message to the notification..."
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        disabled={saving || !rescheduleData.reason.trim()}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Reschedule & Notify
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-orange-500" />
                          Confirm Reschedule
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This will update the session time and send
                          notifications to{" "}
                          {notification.notifyCoach &&
                          notification.notifyParticipants
                            ? "all participants"
                            : notification.notifyCoach
                              ? "the coach"
                              : "participants"}
                          . Are you sure you want to proceed?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRescheduleSession}>
                          Yes, Reschedule
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <Button
                    variant="outline"
                    onClick={() => setEditMode(null)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time Recommendations */}
          {showRecommendations && (
            <SessionRecommendations
              mentorshipRequestId={session.mentorshipRequestId}
              coachId={session.mentorId}
              onSessionBooked={(sessionId) => {
                toast.info(
                  "New session created. Please coordinate with participants.",
                );
                setShowRecommendations(false);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};
