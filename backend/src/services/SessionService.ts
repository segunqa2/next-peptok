import { Session, SessionStatus, SessionType } from "../models/Session.js";
import { logger } from "../config/logger.js";

// Mock Agora token generation (replace with actual Agora implementation)
const generateAgoraToken = (channelName: string, userId: string): string => {
  // In production, use proper Agora token generation
  return `agora_token_${channelName}_${userId}_${Date.now()}`;
};

export interface SessionScheduleRequest {
  mentorshipRequestId: string;
  mentorId: string;
  title: string;
  description: string;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  type: SessionType;
  participants: string[]; // User IDs
}

export interface SessionJoinInfo {
  sessionId: string;
  agoraChannelName: string;
  agoraToken: string;
  meetingUrl: string;
  canRecord: boolean;
  canTranscribe: boolean;
}

export interface SessionStats {
  totalSessions: number;
  completedSessions: number;
  totalDuration: number; // in minutes
  averageRating: number;
  upcomingSessions: number;
}

export class SessionService {
  private sessions: Map<string, Session> = new Map();
  private activeChannels: Map<string, Set<string>> = new Map(); // channelName -> userIds

  constructor() {
    this.initializeMockSessions();
  }

  private initializeMockSessions(): void {
    // Initialize with some mock sessions for testing
    const mockSessions = [
      new Session(
        "session_1",
        "request_1",
        "mentor_1",
        "React Best Practices Discussion",
        "Deep dive into React best practices and performance optimization",
        new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // Tomorrow + 1 hour
        undefined,
        undefined,
        SessionStatus.SCHEDULED,
        SessionType.VIDEO,
        [
          { id: "p1", userId: "user_1", role: "mentee", isPresent: false },
          { id: "p2", userId: "mentor_1", role: "mentor", isPresent: false },
        ],
      ),
      new Session(
        "session_2",
        "request_2",
        "mentor_2",
        "Product Strategy Planning",
        "Discuss product roadmap and strategic planning methodologies",
        new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // 2 days ago + 1 hour
        new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000), // Started 5 mins late
        new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 65 * 60 * 1000), // Ended 5 mins over
        SessionStatus.COMPLETED,
        SessionType.VIDEO,
        [
          {
            id: "p3",
            userId: "user_2",
            role: "mentee",
            isPresent: true,
            joinedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            leftAt: new Date(
              Date.now() - 2 * 24 * 60 * 60 * 1000 + 65 * 60 * 1000,
            ),
          },
          {
            id: "p4",
            userId: "mentor_2",
            role: "mentor",
            isPresent: true,
            joinedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            leftAt: new Date(
              Date.now() - 2 * 24 * 60 * 60 * 1000 + 65 * 60 * 1000,
            ),
          },
        ],
      ),
    ];

    mockSessions.forEach((session) => this.sessions.set(session.id, session));
    logger.info(`Initialized ${mockSessions.length} mock sessions`);
  }

  public async scheduleSession(
    request: SessionScheduleRequest,
  ): Promise<Session> {
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const agoraChannelName = `channel_${sessionId}`;

      const participants = request.participants.map((userId) => ({
        id: `p_${userId}_${Date.now()}`,
        userId,
        role:
          userId === request.mentorId
            ? ("mentor" as const)
            : ("mentee" as const),
        isPresent: false,
      }));

      const session = new Session(
        sessionId,
        request.mentorshipRequestId,
        request.mentorId,
        request.title,
        request.description,
        request.scheduledStartTime,
        request.scheduledEndTime,
        undefined,
        undefined,
        SessionStatus.SCHEDULED,
        request.type,
        participants,
        `https://peptok.com/session/${sessionId}`,
        agoraChannelName,
      );

      this.sessions.set(sessionId, session);

      logger.info(
        `Scheduled session ${sessionId} for ${request.scheduledStartTime}`,
      );

      // TODO: Send notifications to participants
      await this.notifyParticipants(session, "scheduled");

      return session;
    } catch (error) {
      logger.error("Failed to schedule session:", error);
      throw new Error("Failed to schedule session");
    }
  }

  public async getSessionJoinInfo(
    sessionId: string,
    userId: string,
  ): Promise<SessionJoinInfo> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    if (!session.canJoin(userId)) {
      throw new Error("User cannot join this session");
    }

    // Generate Agora token for the user
    const agoraToken = generateAgoraToken(session.agoraChannelName!, userId);
    session.agoraToken = agoraToken;

    return {
      sessionId: session.id,
      agoraChannelName: session.agoraChannelName!,
      agoraToken,
      meetingUrl: session.meetingUrl!,
      canRecord: session.isRecordingEnabled,
      canTranscribe: session.isTranscriptionEnabled,
    };
  }

  public async joinSession(sessionId: string, userId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    if (!session.canJoin(userId)) {
      throw new Error("User cannot join this session");
    }

    // Update participant status
    const participant = session.participants.find((p) => p.userId === userId);
    if (participant) {
      participant.isPresent = true;
      participant.joinedAt = new Date();
    }

    // Track active users in channel
    if (!this.activeChannels.has(session.agoraChannelName!)) {
      this.activeChannels.set(session.agoraChannelName!, new Set());
    }
    this.activeChannels.get(session.agoraChannelName!)!.add(userId);

    // Start session if it's the first participant joining at the right time
    if (session.status === SessionStatus.SCHEDULED && session.canStart()) {
      session.startSession();
    }

    logger.info(`User ${userId} joined session ${sessionId}`);
  }

  public async leaveSession(sessionId: string, userId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    session.removeParticipant(userId);

    // Remove from active channels
    if (this.activeChannels.has(session.agoraChannelName!)) {
      this.activeChannels.get(session.agoraChannelName!)!.delete(userId);

      // End session if no participants left
      const activeUsers = this.activeChannels.get(
        session.agoraChannelName!,
      )!.size;
      if (activeUsers === 0 && session.status === SessionStatus.IN_PROGRESS) {
        session.endSession();
        await this.processSessionCompletion(session);
      }
    }

    logger.info(`User ${userId} left session ${sessionId}`);
  }

  public async startRecording(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    if (session.status !== SessionStatus.IN_PROGRESS) {
      throw new Error("Can only record active sessions");
    }

    // TODO: Integrate with actual recording service (Agora Cloud Recording)
    logger.info(`Started recording for session ${sessionId}`);
  }

  public async stopRecording(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // TODO: Stop recording and process the recording
    session.recording = {
      id: `rec_${sessionId}_${Date.now()}`,
      url: `https://recordings.peptok.com/${sessionId}.mp4`,
      duration: session.getDuration(),
      size: 104857600, // 100MB mock size
      transcriptUrl: session.isTranscriptionEnabled
        ? `https://transcripts.peptok.com/${sessionId}.txt`
        : undefined,
      isProcessing: true,
      createdAt: new Date(),
    };

    logger.info(`Stopped recording for session ${sessionId}`);
  }

  public async endSession(sessionId: string, endedBy: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    if (session.status !== SessionStatus.IN_PROGRESS) {
      throw new Error("Session is not in progress");
    }

    session.endSession();
    await this.processSessionCompletion(session);

    logger.info(`Session ${sessionId} ended by ${endedBy}`);
  }

  public async cancelSession(
    sessionId: string,
    reason: string,
    canceledBy: string,
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    session.cancelSession(reason);

    // Notify participants about cancellation
    await this.notifyParticipants(session, "cancelled", { reason, canceledBy });

    logger.info(`Session ${sessionId} canceled by ${canceledBy}: ${reason}`);
  }

  public async rescheduleSession(
    sessionId: string,
    newStartTime: Date,
    newEndTime: Date,
    rescheduledBy: string,
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const oldStartTime = session.scheduledStartTime;
    session.reschedule(newStartTime, newEndTime);

    // Notify participants about rescheduling
    await this.notifyParticipants(session, "rescheduled", {
      oldStartTime,
      newStartTime,
      rescheduledBy,
    });

    logger.info(`Session ${sessionId} rescheduled by ${rescheduledBy}`);
  }

  public async addSessionNote(
    sessionId: string,
    content: string,
    authorId: string,
    isShared: boolean = false,
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const participant = session.participants.find((p) => p.userId === authorId);
    if (!participant) {
      throw new Error("User is not a participant in this session");
    }

    session.addNote({
      content,
      authorId,
      authorRole: participant.role,
      isShared,
    });

    logger.info(`Note added to session ${sessionId} by ${authorId}`);
  }

  public async addSessionFeedback(
    sessionId: string,
    fromUserId: string,
    toUserId: string,
    rating: number,
    feedback: string,
    isAnonymous: boolean = false,
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    if (session.status !== SessionStatus.COMPLETED) {
      throw new Error("Can only add feedback to completed sessions");
    }

    session.addFeedback({
      fromUserId,
      toUserId,
      rating,
      feedback,
      isAnonymous,
    });

    logger.info(
      `Feedback added to session ${sessionId} from ${fromUserId} to ${toUserId}`,
    );
  }

  public async getSessionsByUser(
    userId: string,
    status?: SessionStatus,
  ): Promise<Session[]> {
    const userSessions = Array.from(this.sessions.values())
      .filter(
        (session) =>
          session.participants.some((p) => p.userId === userId) &&
          (status ? session.status === status : true),
      )
      .sort(
        (a, b) =>
          b.scheduledStartTime.getTime() - a.scheduledStartTime.getTime(),
      );

    return userSessions;
  }

  public async getUpcomingSessions(
    userId: string,
    limit: number = 5,
  ): Promise<Session[]> {
    const now = new Date();
    return Array.from(this.sessions.values())
      .filter(
        (session) =>
          session.participants.some((p) => p.userId === userId) &&
          session.status === SessionStatus.SCHEDULED &&
          session.scheduledStartTime > now,
      )
      .sort(
        (a, b) =>
          a.scheduledStartTime.getTime() - b.scheduledStartTime.getTime(),
      )
      .slice(0, limit);
  }

  public async getSessionStats(userId: string): Promise<SessionStats> {
    const userSessions = await this.getSessionsByUser(userId);

    const completedSessions = userSessions.filter(
      (s) => s.status === SessionStatus.COMPLETED,
    );
    const totalDuration = completedSessions.reduce(
      (sum, session) => sum + session.getDuration(),
      0,
    );
    const upcomingSessions = userSessions.filter(
      (s) =>
        s.status === SessionStatus.SCHEDULED &&
        s.scheduledStartTime > new Date(),
    ).length;

    const ratingsSum = completedSessions.reduce((sum, session) => {
      const avgRating = session.getAverageRating();
      return sum + (avgRating || 0);
    }, 0);
    const averageRating =
      completedSessions.length > 0 ? ratingsSum / completedSessions.length : 0;

    return {
      totalSessions: userSessions.length,
      completedSessions: completedSessions.length,
      totalDuration: Math.round(totalDuration / 60), // Convert to minutes
      averageRating: Math.round(averageRating * 10) / 10,
      upcomingSessions,
    };
  }

  public getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  public async getSessionHistory(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    sessions: Session[];
    total: number;
    page: number;
    limit: number;
  }> {
    const allUserSessions = await this.getSessionsByUser(
      userId,
      SessionStatus.COMPLETED,
    );
    const total = allUserSessions.length;
    const start = (page - 1) * limit;
    const sessions = allUserSessions.slice(start, start + limit);

    return { sessions, total, page, limit };
  }

  private async processSessionCompletion(session: Session): Promise<void> {
    try {
      // Stop recording if it was enabled
      if (
        session.isRecordingEnabled &&
        session.recording?.isProcessing !== false
      ) {
        await this.stopRecording(session.id);
      }

      // Update metrics for mentor
      // TODO: Update mentor metrics in database

      // Generate session summary
      // TODO: Generate AI summary of session goals and outcomes

      // Send completion notifications
      await this.notifyParticipants(session, "completed");

      logger.info(`Processed completion for session ${session.id}`);
    } catch (error) {
      logger.error(
        `Failed to process session completion for ${session.id}:`,
        error,
      );
    }
  }

  private async notifyParticipants(
    session: Session,
    eventType: "scheduled" | "cancelled" | "rescheduled" | "completed",
    metadata?: any,
  ): Promise<void> {
    // TODO: Implement actual notification system (email, in-app, etc.)
    logger.info(
      `Notifying participants about ${eventType} event for session ${session.id}`,
      metadata,
    );
  }
}

export const sessionService = new SessionService();
