export interface MentorExpertise {
  id: string;
  category: string;
  subcategory: string;
  yearsExperience: number;
  level: "beginner" | "intermediate" | "expert" | "master";
}

export interface MentorAvailability {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  timezone: string;
}

export type MentorStatus = "active" | "inactive" | "busy" | "unavailable";

export interface MentorMetrics {
  totalSessions: number;
  averageRating: number;
  totalStudents: number;
  successRate: number;
  responseTime: number; // in hours
  completionRate: number;
}

export interface Mentor {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
  bio?: string;
  title?: string;
  company?: string;
  linkedinUrl?: string;
  expertise: MentorExpertise[];
  availability: MentorAvailability[];
  hourlyRate?: number;
  currency: string;
  status: MentorStatus;
  metrics: MentorMetrics;
  languages: string[];
  maxStudentsPerMonth: number;
  isVerified: boolean;
  joinedAt: Date;
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;

  // Helper methods
  getFullName(): string;
  isAvailable(): boolean;
  canAcceptNewStudents(): boolean;
  getExpertiseCategories(): string[];
  getMatchScore(requiredSkills: string[], goals: string[]): number;
}

export interface MentorMatch {
  mentor: Mentor;
  matchScore: number;
  strengths: string[];
  matchReasons: string[];
}

export interface MatchingFilters {
  expertise?: string[];
  experienceLevel?: "beginner" | "intermediate" | "expert" | "master";
  minRating?: number;
  maxHourlyRate?: number;
  languages?: string[];
  availability?: {
    dayOfWeek: number;
    timeSlot: string;
  };
  timezone?: string;
}

export interface MatchingResult {
  totalMatches: number;
  matches: MentorMatch[];
  filters: MatchingFilters;
  searchTime: number;
}
