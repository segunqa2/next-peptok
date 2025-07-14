import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Users,
  Star,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  sessionRecommendationEngine,
  ScheduleRecommendation,
  RecommendationRequest,
} from "@/services/sessionRecommendationEngine";

interface SessionRecommendationsProps {
  mentorshipRequestId: string;
  coachId: string;
  onSessionBooked?: (sessionId: string) => void;
}

export const SessionRecommendations: React.FC<SessionRecommendationsProps> = ({
  mentorshipRequestId,
  coachId,
  onSessionBooked,
}) => {
  const [recommendations, setRecommendations] = useState<
    ScheduleRecommendation[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [bookingSessionId, setBookingSessionId] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<
    Partial<RecommendationRequest>
  >({
    preferredDuration: 60,
    urgency: "soon",
    sessionType: "video",
  });

  useEffect(() => {
    loadRecommendations();
  }, [mentorshipRequestId, coachId]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const request: RecommendationRequest = {
        mentorshipRequestId,
        coachId,
        preferredDuration: preferences.preferredDuration || 60,
        urgency: preferences.urgency || "soon",
        sessionType: preferences.sessionType || "video",
        preferredTimeFrames: {
          startDate: new Date(),
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
          preferredDays: [1, 2, 3, 4, 5], // Monday to Friday
          preferredHours: { start: 9, end: 17 }, // 9 AM to 5 PM
        },
      };

      const newRecommendations =
        await sessionRecommendationEngine.getRecommendations(request);
      setRecommendations(newRecommendations);

      if (newRecommendations.length === 0) {
        toast.info(
          "No available time slots found. Try adjusting your preferences.",
        );
      } else {
        toast.success(
          `Found ${newRecommendations.length} recommended time slots`,
        );
      }
    } catch (error) {
      console.error("Failed to load recommendations:", error);
      toast.error("Failed to load session recommendations");
    } finally {
      setLoading(false);
    }
  };

  const handleBookSession = async (recommendation: ScheduleRecommendation) => {
    const sessionId = `${recommendation.timeSlot.coachId}-${recommendation.timeSlot.startTime.getTime()}`;
    setBookingSessionId(sessionId);

    try {
      const session = await sessionRecommendationEngine.bookRecommendedSession(
        recommendation,
        {
          mentorshipRequestId,
          mentorId: coachId,
          title: "Coaching Session",
          description: "Recommended coaching session",
          type: preferences.sessionType || "video",
          participants: [coachId], // Add mentees from program
        },
      );

      toast.success("Session booked successfully!");
      onSessionBooked?.(session.id);

      // Refresh recommendations to remove booked slot
      loadRecommendations();
    } catch (error) {
      console.error("Failed to book session:", error);
      toast.error("Failed to book session. Please try again.");
    } finally {
      setBookingSessionId(null);
    }
  };

  const formatDateTime = (date: Date) => {
    return {
      date: date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    };
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50";
    if (score >= 60) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getAvailabilityBadge = (level: string) => {
    const variants = {
      high: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-red-100 text-red-800",
    };
    return variants[level as keyof typeof variants] || variants.medium;
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Session Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Duration:</label>
              <select
                value={preferences.preferredDuration}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    preferredDuration: Number(e.target.value),
                  })
                }
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Urgency:</label>
              <select
                value={preferences.urgency}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    urgency: e.target.value as
                      | "immediate"
                      | "soon"
                      | "flexible",
                  })
                }
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="immediate">Immediate (next 24h)</option>
                <option value="soon">Soon (next 3 days)</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Type:</label>
              <select
                value={preferences.sessionType}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    sessionType: e.target.value as "video" | "audio" | "chat",
                  })
                }
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="video">Video Call</option>
                <option value="audio">Audio Call</option>
                <option value="chat">Chat Session</option>
              </select>
            </div>

            <Button
              onClick={loadRecommendations}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations List */}
      {loading ? (
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              <span>Finding the best time slots for you...</span>
            </div>
          </CardContent>
        </Card>
      ) : recommendations.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">
              No recommendations available
            </h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your preferences or selecting a different time
              frame.
            </p>
            <Button onClick={loadRecommendations} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {recommendations.map((recommendation, index) => {
            const { date, time } = formatDateTime(
              recommendation.timeSlot.startTime,
            );
            const endTime = formatDateTime(
              recommendation.timeSlot.endTime,
            ).time;
            const sessionId = `${recommendation.timeSlot.coachId}-${recommendation.timeSlot.startTime.getTime()}`;
            const isBooking = bookingSessionId === sessionId;

            return (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-lg">{date}</h4>
                        <Badge className={getScoreColor(recommendation.score)}>
                          {recommendation.score}% match
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 mb-3 text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            {time} - {endTime}
                          </span>
                        </div>
                        <Badge
                          className={getAvailabilityBadge(
                            recommendation.coachAvailability,
                          )}
                        >
                          {recommendation.coachAvailability} availability
                        </Badge>
                        <Badge variant="outline">
                          {recommendation.programFit} fit
                        </Badge>
                      </div>

                      {recommendation.reasoning.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-600 mb-1">
                            Why this time works:
                          </p>
                          <ul className="text-sm space-y-1">
                            {recommendation.reasoning.map((reason, i) => (
                              <li key={i} className="flex items-center gap-2">
                                <CheckCircle className="w-3 h-3 text-green-500" />
                                {reason}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="ml-4">
                      <Button
                        onClick={() => handleBookSession(recommendation)}
                        disabled={isBooking}
                        className="min-w-[100px]"
                      >
                        {isBooking ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Booking...
                          </>
                        ) : (
                          <>
                            <Calendar className="w-4 h-4 mr-2" />
                            Book Session
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
