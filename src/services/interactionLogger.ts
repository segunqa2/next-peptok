/**
 * Service to log all user interactions with coaching programs to ensure
 * backend persistence and tracking of user activities
 */

import { apiEnhanced } from "./apiEnhanced";
import { analytics } from "./analytics";

export interface UserInteraction {
  userId: string;
  userType: "company_admin" | "coach" | "participant";
  action: string;
  resourceType:
    | "coaching_program"
    | "session"
    | "match_request"
    | "user_profile";
  resourceId: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

class InteractionLogger {
  private pendingLogs: UserInteraction[] = [];
  private batchSize = 10;
  private flushInterval = 5000; // 5 seconds

  constructor() {
    // Periodically flush pending logs to backend
    setInterval(() => {
      this.flushLogs();
    }, this.flushInterval);

    // Flush on page unload
    window.addEventListener("beforeunload", () => {
      this.flushLogs(true);
    });
  }

  /**
   * Log a user interaction with a coaching program
   */
  async logInteraction(interaction: Omit<UserInteraction, "timestamp">) {
    const fullInteraction: UserInteraction = {
      ...interaction,
      timestamp: new Date().toISOString(),
    };

    console.log("🔄 Logging interaction:", fullInteraction);

    // Add to pending batch
    this.pendingLogs.push(fullInteraction);

    // Also track in analytics for immediate feedback
    analytics.trackAction({
      action: interaction.action,
      component: "interaction_logger",
      metadata: {
        resourceType: interaction.resourceType,
        resourceId: interaction.resourceId,
        userType: interaction.userType,
        ...interaction.metadata,
      },
    });

    // Flush immediately for critical actions
    const criticalActions = [
      "program_created",
      "match_accepted",
      "match_declined",
      "session_completed",
    ];
    if (criticalActions.includes(interaction.action)) {
      await this.flushLogs();
    }

    // Auto-flush when batch is full
    if (this.pendingLogs.length >= this.batchSize) {
      await this.flushLogs();
    }
  }

  /**
   * Flush pending logs to backend
   */
  private async flushLogs(isUnloading = false) {
    if (this.pendingLogs.length === 0) return;

    const logsToSend = [...this.pendingLogs];
    this.pendingLogs = [];

    try {
      if (isUnloading) {
        // Use sendBeacon for page unload to ensure delivery
        const data = JSON.stringify({ interactions: logsToSend });
        navigator.sendBeacon("/api/v1/interactions/batch", data);
      } else {
        // Regular API call
        await apiEnhanced.logUserInteractions(logsToSend);
      }

      console.log(`✅ Flushed ${logsToSend.length} interactions to backend`);
    } catch (error) {
      console.error("❌ Failed to flush interactions:", error);
      // Re-add failed logs to retry later
      this.pendingLogs.unshift(...logsToSend);
    }
  }

  /**
   * Log coaching program creation
   */
  async logProgramCreation(
    userId: string,
    programId: string,
    programData: any,
  ) {
    await this.logInteraction({
      userId,
      userType: "company_admin",
      action: "program_created",
      resourceType: "coaching_program",
      resourceId: programId,
      metadata: {
        title: programData.title,
        participantCount: programData.teamMembers?.length || 0,
        goals: programData.goals?.length || 0,
        budget: programData.budget,
        timeline: programData.timeline,
        communicationChannel: programData.communicationChannel?.type,
      },
    });
  }

  /**
   * Log coaching program updates
   */
  async logProgramUpdate(
    userId: string,
    userType: string,
    programId: string,
    changes: any,
  ) {
    await this.logInteraction({
      userId,
      userType: userType as any,
      action: "program_updated",
      resourceType: "coaching_program",
      resourceId: programId,
      metadata: {
        changes: Object.keys(changes),
        ...changes,
      },
    });
  }

  /**
   * Log match request actions
   */
  async logMatchAction(
    userId: string,
    userType: string,
    matchId: string,
    action: "accepted" | "declined",
    reason?: string,
  ) {
    await this.logInteraction({
      userId,
      userType: userType as any,
      action: `match_${action}`,
      resourceType: "match_request",
      resourceId: matchId,
      metadata: {
        reason: reason || null,
      },
    });
  }

  /**
   * Log session interactions
   */
  async logSessionAction(
    userId: string,
    userType: string,
    sessionId: string,
    action: string,
    metadata: any = {},
  ) {
    await this.logInteraction({
      userId,
      userType: userType as any,
      action: `session_${action}`,
      resourceType: "session",
      resourceId: sessionId,
      metadata,
    });
  }

  /**
   * Log participant interactions
   */
  async logParticipantAction(
    userId: string,
    programId: string,
    action: string,
    metadata: any = {},
  ) {
    await this.logInteraction({
      userId,
      userType: "participant",
      action: `participant_${action}`,
      resourceType: "coaching_program",
      resourceId: programId,
      metadata,
    });
  }

  /**
   * Get interaction statistics
   */
  getPendingCount(): number {
    return this.pendingLogs.length;
  }

  /**
   * Force flush all pending logs
   */
  async forceFLush(): Promise<void> {
    await this.flushLogs();
  }
}

// Export singleton instance
export const interactionLogger = new InteractionLogger();

// Convenience functions
export const logProgramCreation =
  interactionLogger.logProgramCreation.bind(interactionLogger);
export const logProgramUpdate =
  interactionLogger.logProgramUpdate.bind(interactionLogger);
export const logMatchAction =
  interactionLogger.logMatchAction.bind(interactionLogger);
export const logSessionAction =
  interactionLogger.logSessionAction.bind(interactionLogger);
export const logParticipantAction =
  interactionLogger.logParticipantAction.bind(interactionLogger);
