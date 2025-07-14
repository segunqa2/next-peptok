import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  XCircle,
  Send,
  AlertTriangle,
  Users,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Session } from "@/types/session";
import { apiEnhanced } from "@/services/apiEnhanced";

interface SessionCancellationFlowProps {
  session: Session;
  onSessionCancelled: (cancelledSession: Session) => void;
  onCancel: () => void;
}

interface CancellationReason {
  category: string;
  description: string;
}

const CANCELLATION_REASONS: CancellationReason[] = [
  { category: "scheduling_conflict", description: "Scheduling conflict" },
  { category: "illness", description: "Illness or health issues" },
  { category: "emergency", description: "Emergency situation" },
  { category: "technical_issues", description: "Technical difficulties" },
  { category: "work_priority", description: "Work priority change" },
  { category: "personal_reasons", description: "Personal reasons" },
  {
    category: "participant_unavailable",
    description: "Participant unavailable",
  },
  { category: "other", description: "Other (please specify)" },
];

export const SessionCancellationFlow: React.FC<
  SessionCancellationFlowProps
> = ({ session, onSessionCancelled, onCancel }) => {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customReason, setCustomReason] = useState<string>("");
  const [notificationMessage, setNotificationMessage] = useState<string>("");
  const [notifyParticipants, setNotifyParticipants] = useState<boolean>(true);
  const [offerReschedule, setOfferReschedule] = useState<boolean>(false);
  const [cancelling, setCancelling] = useState<boolean>(false);

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

  const getTimeUntilSession = () => {
    const now = new Date();
    const sessionTime = new Date(session.scheduledStartTime);
    const diffMs = sessionTime.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? "s" : ""} away`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} away`;
    } else if (diffMs > 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} away`;
    } else {
      return "Session time has passed";
    }
  };

  const getCancellationImpact = () => {
    const now = new Date();
    const sessionTime = new Date(session.scheduledStartTime);
    const hoursUntil =
      (sessionTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntil < 2) {
      return {
        level: "high",
        message:
          "Last-minute cancellation may significantly impact participants",
        color: "text-red-600 bg-red-50",
      };
    } else if (hoursUntil < 24) {
      return {
        level: "medium",
        message: "Short notice cancellation may inconvenience participants",
        color: "text-orange-600 bg-orange-50",
      };
    } else {
      return {
        level: "low",
        message: "Advance notice allows participants to adjust their schedules",
        color: "text-green-600 bg-green-50",
      };
    }
  };

  const handleCancelSession = async () => {
    if (!selectedReason) {
      toast.error("Please select a reason for cancellation");
      return;
    }

    if (selectedReason === "other" && !customReason.trim()) {
      toast.error("Please provide a custom reason");
      return;
    }

    setCancelling(true);
    try {
      const reasonText =
        selectedReason === "other"
          ? customReason
          : CANCELLATION_REASONS.find((r) => r.category === selectedReason)
              ?.description || selectedReason;

      const fullReason = notificationMessage.trim()
        ? `${reasonText}. ${notificationMessage}`
        : reasonText;

      const cancelledSession = await apiEnhanced.cancelSession(
        session.id,
        fullReason,
        notifyParticipants,
      );

      // Send additional notifications if custom message provided
      if (notificationMessage.trim() || offerReschedule) {
        await sendCancellationNotifications(fullReason);
      }

      toast.success("Session cancelled successfully");
      onSessionCancelled(cancelledSession);
    } catch (error) {
      console.error("Failed to cancel session:", error);
      toast.error("Failed to cancel session. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  const sendCancellationNotifications = async (reason: string) => {
    try {
      const notificationData = {
        sessionId: session.id,
        sessionTitle: session.title,
        scheduledTime: session.scheduledStartTime,
        reason,
        customMessage: notificationMessage,
        offerReschedule,
        participantEmails: session.participants.map((p) => p.userId), // Assuming userId is email
      };

      await apiEnhanced.request("/notifications/cancellation", {
        method: "POST",
        body: JSON.stringify(notificationData),
      });

      console.log("✅ Cancellation notifications sent");
    } catch (error) {
      console.warn("Failed to send notifications:", error);
      // Don't fail the whole operation if notifications fail
    }
  };

  const impact = getCancellationImpact();

  return (
    <div className="space-y-6">
      {/* Session Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            Cancel Session
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
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {getTimeUntilSession()}
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {session.participants.length} participants
              </div>
            </div>

            {/* Cancellation Impact Warning */}
            <div className={`p-3 rounded-lg ${impact.color}`}>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">
                    {impact.level === "high"
                      ? "High Impact"
                      : impact.level === "medium"
                        ? "Medium Impact"
                        : "Low Impact"}
                  </p>
                  <p className="text-sm">{impact.message}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cancellation Form */}
      <Card>
        <CardHeader>
          <CardTitle>Cancellation Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Reason Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Reason for Cancellation *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CANCELLATION_REASONS.map((reason) => (
                  <label
                    key={reason.category}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedReason === reason.category
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="cancellation-reason"
                      value={reason.category}
                      checked={selectedReason === reason.category}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="mr-3"
                    />
                    <span className="text-sm">{reason.description}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Custom Reason */}
            {selectedReason === "other" && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Please specify the reason *
                </label>
                <Textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Please provide details about why you need to cancel..."
                  rows={2}
                />
              </div>
            )}

            {/* Additional Message */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Additional Message to Participants (Optional)
              </label>
              <Textarea
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                placeholder="Add a personal message to explain the situation or provide additional context..."
                rows={3}
              />
            </div>

            {/* Notification Options */}
            <div className="space-y-3">
              <h4 className="font-medium">Notification Options</h4>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={notifyParticipants}
                  onChange={(e) => setNotifyParticipants(e.target.checked)}
                />
                <span className="text-sm">
                  Send cancellation notifications to all participants
                </span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={offerReschedule}
                  onChange={(e) => setOfferReschedule(e.target.checked)}
                />
                <span className="text-sm">
                  Offer to reschedule to alternative times
                </span>
              </label>
            </div>

            {/* Participant Impact Summary */}
            {session.participants.length > 0 && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-medium text-sm mb-2">
                  This will affect {session.participants.length} participant
                  {session.participants.length > 1 ? "s" : ""}:
                </h4>
                <div className="text-sm text-gray-600">
                  {notifyParticipants ? (
                    <p>✓ All participants will be notified immediately</p>
                  ) : (
                    <p>⚠ Participants will NOT be automatically notified</p>
                  )}
                  {offerReschedule && (
                    <p>✓ Participants will receive rescheduling options</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel} disabled={cancelling}>
          Back
        </Button>

        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={
                  cancelling ||
                  !selectedReason ||
                  (selectedReason === "other" && !customReason.trim())
                }
              >
                {cancelling ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel Session
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Confirm Session Cancellation
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to cancel "{session.title}" scheduled
                  for {formatDateTime(session.scheduledStartTime)}?
                  {notifyParticipants && (
                    <span className="block mt-2 font-medium">
                      This will send cancellation notifications to all
                      participants.
                    </span>
                  )}
                  <span className="block mt-2 text-red-600">
                    This action cannot be undone.
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>No, Keep Session</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancelSession}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Yes, Cancel Session
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};
