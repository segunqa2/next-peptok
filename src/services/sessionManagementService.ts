import { toast } from "sonner";
import api from "./api";
import { Session, SessionStats, SessionJoinInfo } from "@/types/session";
import { User } from "@/types";

/**
 * Session Schedule Management Service
 *
 * Handles the complete session lifecycle:
 * 1. System creates session schedule based on program timeline and frequency
 * 2. Admin can edit the schedule
 * 3. Coach must accept before the session is confirmed
 * 4. "Upcoming Sessions" shows saved session schedules
 * 5. "Recent Activity" shows activities that will happen next
 */
class SessionManagementService {
  /**
   * Generate session schedule for a program based on timeline and frequency
   */
  async generateSessionSchedule(
    programId: string,
    scheduleConfig: {
      startDate: string;
      endDate: string;
      sessionFrequency: "weekly" | "bi-weekly" | "monthly" | "custom";
      hoursPerSession: number;
      totalSessions: number;
      sessionType: "video" | "audio" | "chat" | "in-person";
      timeSlots?: Array<{
        dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
        startTime: string; // "09:00"
        timeZone: string;
      }>;
    },
  ): Promise<Session[]> {
    try {
      console.log("📅 Generating session schedule for program:", programId);

      const response = await api.sessions.generateSessionsForProgram(
        programId,
        scheduleConfig,
      );

      console.log(
        `✅ Generated ${response.length} sessions for program ${programId}`,
      );
      toast.success(
        `Generated ${response.length} sessions based on program timeline`,
      );

      return response;
    } catch (error: any) {
      console.error("Failed to generate session schedule:", error);
      toast.error(
        error.message ||
          "Failed to generate session schedule. Please try again.",
      );
      throw error;
    }
  }

  /**
   * Get all sessions for a program (for admin management)
   */
  async getProgramSessions(programId: string): Promise<Session[]> {
    try {
      return await api.sessions.getSessionsForProgram(programId);
    } catch (error) {
      console.error("Failed to fetch program sessions:", error);
      toast.error("Failed to load program sessions");
      return [];
    }
  }

  /**
   * Get upcoming sessions for the current user
   */
  async getUpcomingSessions(filters?: {
    status?: string[];
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<Session[]> {
    try {
      const defaultFilters = {
        status: ["scheduled", "confirmed"],
        startDate: new Date().toISOString(),
        limit: 10,
        ...filters,
      };

      const sessions = await api.sessions.getSessions(defaultFilters);

      // Sort by scheduled date
      return sessions.sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
      );
    } catch (error) {
      console.error("Failed to fetch upcoming sessions:", error);
      toast.error("Failed to load upcoming sessions");
      return [];
    }
  }

  /**
   * Get sessions awaiting coach acceptance
   */
  async getSessionsAwaitingCoachAcceptance(): Promise<Session[]> {
    try {
      return await api.sessions.getSessionsAwaitingAcceptance();
    } catch (error) {
      console.error("Failed to fetch sessions awaiting acceptance:", error);
      toast.error("Failed to load pending sessions");
      return [];
    }
  }

  /**
   * Update session schedule (admin only)
   */
  async updateSessionSchedule(
    sessionId: string,
    updates: {
      scheduledAt?: string;
      duration?: number;
      title?: string;
      description?: string;
      sessionType?: string;
      notes?: string;
    },
  ): Promise<Session> {
    try {
      console.log("📝 Updating session schedule:", sessionId);

      const updatedSession = await api.sessions.updateSession(
        sessionId,
        updates,
      );

      // If the session was already accepted by a coach, reset to pending acceptance
      if (
        updatedSession.status === "confirmed" &&
        (updates.scheduledAt || updates.duration)
      ) {
        await api.sessions.updateSession(sessionId, {
          status: "pending_coach_acceptance",
        });

        toast.warning(
          "Session updated. Coach must re-accept the new schedule.",
        );
      } else {
        toast.success("Session schedule updated successfully");
      }

      return updatedSession;
    } catch (error: any) {
      console.error("Failed to update session schedule:", error);
      toast.error(
        error.message || "Failed to update session schedule. Please try again.",
      );
      throw error;
    }
  }

  /**
   * Coach accepts a session
   */
  async acceptSession(sessionId: string): Promise<Session> {
    try {
      console.log("✅ Coach accepting session:", sessionId);

      const acceptedSession = await api.sessions.acceptSession(sessionId);

      toast.success("Session accepted! It's now confirmed in your schedule.");

      return acceptedSession;
    } catch (error: any) {
      console.error("Failed to accept session:", error);
      toast.error(
        error.message || "Failed to accept session. Please try again.",
      );
      throw error;
    }
  }

  /**
   * Coach declines a session
   */
  async declineSession(sessionId: string, reason?: string): Promise<Session> {
    try {
      console.log("❌ Coach declining session:", sessionId);

      const declinedSession = await api.sessions.declineSession(
        sessionId,
        reason,
      );

      toast.success("Session declined. The admin will be notified.");

      return declinedSession;
    } catch (error: any) {
      console.error("Failed to decline session:", error);
      toast.error(
        error.message || "Failed to decline session. Please try again.",
      );
      throw error;
    }
  }

  /**
   * Get recent activities (for dashboard)
   */
  async getRecentActivities(limit: number = 10): Promise<
    Array<{
      id: string;
      type:
        | "session_created"
        | "session_accepted"
        | "session_declined"
        | "session_completed"
        | "program_created";
      title: string;
      description: string;
      timestamp: string;
      status: string;
      actionRequired?: boolean;
      relatedEntityId?: string;
      relatedEntityType?: "session" | "program";
    }>
  > {
    try {
      // Get recent sessions and derive activities
      const recentSessions = await api.sessions.getSessions({
        limit: limit * 2, // Get more to filter activities
        orderBy: "updatedAt",
        order: "desc",
      });

      const activities = [];

      for (const session of recentSessions.slice(0, limit)) {
        // Determine activity type and description based on session status
        let activityType:
          | "session_created"
          | "session_accepted"
          | "session_declined"
          | "session_completed";
        let description: string;
        let actionRequired = false;

        switch (session.status) {
          case "pending_coach_acceptance":
            activityType = "session_created";
            description = `Session scheduled and awaiting coach acceptance`;
            actionRequired = true;
            break;
          case "confirmed":
            activityType = "session_accepted";
            description = `Session confirmed by coach`;
            break;
          case "declined":
            activityType = "session_declined";
            description = `Session declined by coach`;
            actionRequired = true;
            break;
          case "completed":
            activityType = "session_completed";
            description = `Session completed successfully`;
            break;
          default:
            activityType = "session_created";
            description = `Session ${session.status}`;
        }

        activities.push({
          id: `activity_${session.id}`,
          type: activityType,
          title: session.title || "Coaching Session",
          description,
          timestamp: session.updatedAt || session.createdAt,
          status: session.status,
          actionRequired,
          relatedEntityId: session.id,
          relatedEntityType: "session" as const,
        });
      }

      return activities.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
    } catch (error) {
      console.error("Failed to fetch recent activities:", error);
      return [];
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStats(filters?: {
    programId?: string;
    coachId?: string;
    companyId?: string;
    dateRange?: { start: string; end: string };
  }): Promise<SessionStats> {
    try {
      const sessions = await api.sessions.getSessions(filters);

      const totalSessions = sessions.length;
      const completedSessions = sessions.filter(
        (s) => s.status === "completed",
      ).length;
      const upcomingSessions = sessions.filter((s) =>
        ["scheduled", "confirmed"].includes(s.status),
      ).length;
      const pendingAcceptance = sessions.filter(
        (s) => s.status === "pending_coach_acceptance",
      ).length;

      return {
        totalSessions,
        completedSessions,
        upcomingSessions,
        pendingAcceptance,
        completionRate:
          totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
        averageRating: 0, // Would come from session feedback
        totalDuration: sessions.reduce(
          (sum, session) => sum + (session.duration || 60),
          0,
        ),
      };
    } catch (error) {
      console.error("Failed to fetch session statistics:", error);
      return {
        totalSessions: 0,
        completedSessions: 0,
        upcomingSessions: 0,
        pendingAcceptance: 0,
        completionRate: 0,
        averageRating: 0,
        totalDuration: 0,
      };
    }
  }

  /**
   * Cancel a session
   */
  async cancelSession(
    sessionId: string,
    reason?: string,
    notifyParticipants: boolean = true,
  ): Promise<void> {
    try {
      await api.sessions.updateSession(sessionId, {
        status: "cancelled",
        notes: reason ? `Cancelled: ${reason}` : "Session cancelled",
      });

      toast.success("Session cancelled successfully");
    } catch (error: any) {
      console.error("Failed to cancel session:", error);
      toast.error(
        error.message || "Failed to cancel session. Please try again.",
      );
      throw error;
    }
  }

  /**
   * Reschedule a session
   */
  async rescheduleSession(
    sessionId: string,
    newScheduledAt: string,
    reason?: string,
  ): Promise<Session> {
    try {
      const updatedSession = await api.sessions.updateSession(sessionId, {
        scheduledAt: newScheduledAt,
        status: "pending_coach_acceptance", // Requires re-acceptance
        notes: reason ? `Rescheduled: ${reason}` : "Session rescheduled",
      });

      toast.success("Session rescheduled. Coach must re-accept the new time.");

      return updatedSession;
    } catch (error: any) {
      console.error("Failed to reschedule session:", error);
      toast.error(
        error.message || "Failed to reschedule session. Please try again.",
      );
      throw error;
    }
  }

  /**
   * Get session join information
   */
  async getSessionJoinInfo(sessionId: string): Promise<SessionJoinInfo | null> {
    try {
      const session = await api.sessions.getSession(sessionId);

      if (!session || session.status !== "confirmed") {
        return null;
      }

      return {
        sessionId: session.id,
        meetingUrl: session.meetingUrl || "",
        accessCode: session.accessCode || "",
        dialInNumber: session.dialInNumber || "",
        startTime: session.scheduledAt,
        duration: session.duration || 60,
        participants: session.participants || [],
      };
    } catch (error) {
      console.error("Failed to get session join info:", error);
      return null;
    }
  }

  /**
   * Mark session as completed
   */
  async completeSession(
    sessionId: string,
    feedback?: {
      rating: number;
      notes: string;
      goals_achieved: boolean;
    },
  ): Promise<Session> {
    try {
      const updates: any = {
        status: "completed",
        completedAt: new Date().toISOString(),
      };

      if (feedback) {
        updates.feedback = feedback;
      }

      const completedSession = await api.sessions.updateSession(
        sessionId,
        updates,
      );

      toast.success("Session marked as completed");

      return completedSession;
    } catch (error: any) {
      console.error("Failed to complete session:", error);
      toast.error(
        error.message || "Failed to complete session. Please try again.",
      );
      throw error;
    }
  }
}

// Export singleton instance
export const sessionManagementService = new SessionManagementService();
export default sessionManagementService;
