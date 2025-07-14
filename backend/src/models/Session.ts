export enum SessionStatus {
  SCHEDULED = "scheduled",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  NO_SHOW = "no_show",
}

export enum SessionType {
  VIDEO = "video",
  AUDIO = "audio",
  CHAT = "chat",
  SCREEN_SHARE = "screen_share",
}

export interface SessionParticipant {
  id: string;
  userId: string;
  role: "mentor" | "mentee" | "observer";
  joinedAt?: Date;
  leftAt?: Date;
  isPresent: boolean;
}

export interface SessionRecording {
  id: string;
  url: string;
  duration: number; // in seconds
  size: number; // in bytes
  transcriptUrl?: string;
  isProcessing: boolean;
  createdAt: Date;
}

export interface SessionNotes {
  id: string;
  content: string;
  authorId: string;
  authorRole: "mentor" | "mentee";
  isShared: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionGoal {
  id: string;
  description: string;
  isCompleted: boolean;
  completedAt?: Date;
  notes?: string;
}

export interface SessionFeedback {
  id: string;
  fromUserId: string;
  toUserId: string;
  rating: number; // 1-5
  feedback: string;
  isAnonymous: boolean;
  createdAt: Date;
}

export class Session {
  constructor(
    public id: string,
    public mentorshipRequestId: string,
    public mentorId: string,
    public title: string,
    public description: string,
    public scheduledStartTime: Date,
    public scheduledEndTime: Date,
    public actualStartTime?: Date,
    public actualEndTime?: Date,
    public status: SessionStatus = SessionStatus.SCHEDULED,
    public type: SessionType = SessionType.VIDEO,
    public participants: SessionParticipant[] = [],
    public meetingUrl?: string,
    public agoraChannelName?: string,
    public agoraToken?: string,
    public recording?: SessionRecording,
    public notes: SessionNotes[] = [],
    public goals: SessionGoal[] = [],
    public feedback: SessionFeedback[] = [],
    public isRecordingEnabled: boolean = true,
    public isTranscriptionEnabled: boolean = true,
    public cancellationReason?: string,
    public rescheduleCount: number = 0,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
  ) {}

  public getDuration(): number {
    if (this.actualStartTime && this.actualEndTime) {
      return Math.floor(
        (this.actualEndTime.getTime() - this.actualStartTime.getTime()) / 1000,
      );
    }
    return 0;
  }

  public getScheduledDuration(): number {
    return Math.floor(
      (this.scheduledEndTime.getTime() - this.scheduledStartTime.getTime()) /
        1000,
    );
  }

  public canStart(): boolean {
    const now = new Date();
    const startWindow = new Date(
      this.scheduledStartTime.getTime() - 15 * 60 * 1000,
    ); // 15 minutes before
    return this.status === SessionStatus.SCHEDULED && now >= startWindow;
  }

  public canJoin(userId: string): boolean {
    if (
      this.status !== SessionStatus.SCHEDULED &&
      this.status !== SessionStatus.IN_PROGRESS
    ) {
      return false;
    }

    return this.participants.some((p) => p.userId === userId);
  }

  public startSession(): void {
    if (!this.canStart()) {
      throw new Error("Session cannot be started at this time");
    }

    this.status = SessionStatus.IN_PROGRESS;
    this.actualStartTime = new Date();
    this.updatedAt = new Date();
  }

  public endSession(): void {
    if (this.status !== SessionStatus.IN_PROGRESS) {
      throw new Error("Session is not in progress");
    }

    this.status = SessionStatus.COMPLETED;
    this.actualEndTime = new Date();
    this.updatedAt = new Date();
  }

  public cancelSession(reason: string): void {
    if (this.status === SessionStatus.COMPLETED) {
      throw new Error("Cannot cancel a completed session");
    }

    this.status = SessionStatus.CANCELLED;
    this.cancellationReason = reason;
    this.updatedAt = new Date();
  }

  public reschedule(newStartTime: Date, newEndTime: Date): void {
    if (this.status !== SessionStatus.SCHEDULED) {
      throw new Error("Can only reschedule scheduled sessions");
    }

    this.scheduledStartTime = newStartTime;
    this.scheduledEndTime = newEndTime;
    this.rescheduleCount++;
    this.updatedAt = new Date();
  }

  public addParticipant(participant: SessionParticipant): void {
    const existingIndex = this.participants.findIndex(
      (p) => p.userId === participant.userId,
    );
    if (existingIndex >= 0) {
      this.participants[existingIndex] = participant;
    } else {
      this.participants.push(participant);
    }
    this.updatedAt = new Date();
  }

  public removeParticipant(userId: string): void {
    const participant = this.participants.find((p) => p.userId === userId);
    if (participant) {
      participant.isPresent = false;
      participant.leftAt = new Date();
      this.updatedAt = new Date();
    }
  }

  public addNote(
    note: Omit<SessionNotes, "id" | "createdAt" | "updatedAt">,
  ): void {
    const newNote: SessionNotes = {
      ...note,
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.notes.push(newNote);
    this.updatedAt = new Date();
  }

  public addGoal(goal: Omit<SessionGoal, "id">): void {
    const newGoal: SessionGoal = {
      ...goal,
      id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    this.goals.push(newGoal);
    this.updatedAt = new Date();
  }

  public completeGoal(goalId: string, notes?: string): void {
    const goal = this.goals.find((g) => g.id === goalId);
    if (goal) {
      goal.isCompleted = true;
      goal.completedAt = new Date();
      if (notes) goal.notes = notes;
      this.updatedAt = new Date();
    }
  }

  public addFeedback(
    feedback: Omit<SessionFeedback, "id" | "createdAt">,
  ): void {
    const newFeedback: SessionFeedback = {
      ...feedback,
      id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };
    this.feedback.push(newFeedback);
    this.updatedAt = new Date();
  }

  public getAverageRating(): number {
    if (this.feedback.length === 0) return 0;
    const sum = this.feedback.reduce((acc, f) => acc + f.rating, 0);
    return Math.round((sum / this.feedback.length) * 10) / 10;
  }

  public toJSON() {
    return {
      id: this.id,
      mentorshipRequestId: this.mentorshipRequestId,
      mentorId: this.mentorId,
      title: this.title,
      description: this.description,
      scheduledStartTime: this.scheduledStartTime,
      scheduledEndTime: this.scheduledEndTime,
      actualStartTime: this.actualStartTime,
      actualEndTime: this.actualEndTime,
      status: this.status,
      type: this.type,
      participants: this.participants,
      meetingUrl: this.meetingUrl,
      agoraChannelName: this.agoraChannelName,
      recording: this.recording,
      notes: this.notes,
      goals: this.goals,
      feedback: this.feedback,
      isRecordingEnabled: this.isRecordingEnabled,
      isTranscriptionEnabled: this.isTranscriptionEnabled,
      cancellationReason: this.cancellationReason,
      rescheduleCount: this.rescheduleCount,
      duration: this.getDuration(),
      scheduledDuration: this.getScheduledDuration(),
      averageRating: this.getAverageRating(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
