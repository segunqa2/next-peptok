export interface Program {
  id: string;
  title: string;
  description: string;
  companyId: string;
  companyName: string;
  assignedCoachId?: string;
  assignedCoachName?: string;

  // Program Status
  status:
    | "draft"
    | "pending_coach_acceptance"
    | "in_progress"
    | "completed"
    | "cancelled";

  // Timeline Configuration
  timeline: {
    startDate: string;
    endDate: string;
    sessionFrequency: "weekly" | "bi-weekly" | "monthly" | "custom";
    hoursPerSession: number;
    totalSessions: number;
    sessionType: "video" | "audio" | "chat" | "in-person";
  };

  // Participants
  participants: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    department?: string;
  }>;

  // Goals and Objectives
  goals: Array<{
    id: string;
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
    completed: boolean;
  }>;

  // Skills and Focus Areas
  skills: string[];
  focusAreas: string[];

  // Budget and Pricing
  budget: {
    min: number;
    max: number;
    currency: string;
    totalBudget?: number;
    budgetPerSession?: number;
  };

  // Program Level
  level: "beginner" | "intermediate" | "advanced" | "mixed";

  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastModifiedBy: string;

  // Sessions (generated from timeline)
  sessions: ProgramSession[];

  // Progress tracking
  progress: {
    completedSessions: number;
    totalSessions: number;
    progressPercentage: number;
    nextSessionDate?: string;
  };

  // Coach acceptance
  coachResponse?: {
    status: "pending" | "accepted" | "rejected";
    respondedAt?: string;
    message?: string;
    proposedChanges?: Partial<Program>;
  };
}

export interface ProgramSession {
  id: string;
  programId: string;
  title: string;
  description?: string;
  sessionNumber: number;

  // Scheduling
  scheduledDate: string;
  scheduledTime: string;
  duration: number; // in minutes
  timezone: string;

  // Type and format
  type: "video" | "audio" | "chat" | "in-person";
  format: "one-on-one" | "group" | "workshop";

  // Status
  status:
    | "scheduled"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "rescheduled";

  // Participants
  participants: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    attendance?: "attended" | "missed" | "partial";
  }>;

  // Content and Materials
  agenda?: string;
  materials?: Array<{
    id: string;
    name: string;
    type: "document" | "video" | "audio" | "link";
    url: string;
  }>;

  // Coach and coaching details
  coachId: string;
  coachName: string;
  coachNotes?: string;

  // Session outcomes
  outcomes?: {
    summary: string;
    achievements: string[];
    actionItems: Array<{
      id: string;
      task: string;
      assignedTo: string;
      dueDate: string;
      status: "pending" | "in_progress" | "completed";
    }>;
    nextSessionFocus?: string;
  };

  // Feedback and ratings
  feedback?: {
    participantRatings: Array<{
      participantId: string;
      rating: number;
      comment?: string;
    }>;
    coachRating?: number;
    coachComment?: string;
  };

  // Technical details
  meetingRoom?: {
    roomId: string;
    joinUrl: string;
    recordingUrl?: string;
  };

  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ProgramTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  skills: string[];
  defaultTimeline: Program["timeline"];
  suggestedGoals: Array<{
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
  }>;
  estimatedCost: {
    min: number;
    max: number;
    currency: string;
  };
  isActive: boolean;
  createdAt: string;
}

export interface ProgramAnalytics {
  programId: string;
  metrics: {
    totalSessions: number;
    completedSessions: number;
    cancelledSessions: number;
    averageAttendance: number;
    averageRating: number;
    completionRate: number;
    progressPercentage: number;
  };
  participantMetrics: Array<{
    participantId: string;
    name: string;
    attendanceRate: number;
    averageRating: number;
    goalsCompleted: number;
    totalGoals: number;
  }>;
  timeMetrics: {
    totalHoursScheduled: number;
    totalHoursCompleted: number;
    averageSessionDuration: number;
  };
  costMetrics: {
    totalBudget: number;
    spentBudget: number;
    remainingBudget: number;
    costPerSession: number;
    costPerParticipant: number;
  };
  lastUpdated: string;
}

export type CreateProgramRequest = Omit<
  Program,
  "id" | "createdAt" | "updatedAt" | "sessions" | "progress" | "status"
> & {
  coachPreferences?: {
    preferredCoachIds?: string[];
    requiredSkills?: string[];
    maxBudgetPerHour?: number;
    preferredAvailability?: string[];
  };
};

export type UpdateProgramRequest = Partial<
  Omit<Program, "id" | "createdAt" | "companyId">
> & {
  id: string;
};
