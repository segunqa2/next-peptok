export type SessionStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export type SessionType = "video" | "audio" | "chat" | "screen_share";

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

export interface Session {
  id: string;
  mentorshipRequestId: string;
  mentorId: string;
  title: string;
  description: string;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  status: SessionStatus;
  type: SessionType;
  participants: SessionParticipant[];
  meetingUrl?: string;
  agoraChannelName?: string;
  agoraToken?: string;
  recording?: SessionRecording;
  notes: SessionNotes[];
  goals: SessionGoal[];
  feedback: SessionFeedback[];
  isRecordingEnabled: boolean;
  isTranscriptionEnabled: boolean;
  cancellationReason?: string;
  rescheduleCount: number;
  createdAt: Date;
  updatedAt: Date;
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
