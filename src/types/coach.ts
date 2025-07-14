export interface CoachingExpertise {
  id: string;
  name: string;
  category: string;
  yearsExperience: number;
  level: "beginner" | "intermediate" | "coach" | "master";
  description?: string;
}

export interface CoachAvailability {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  timezone: string;
}

export type CoachStatus = "active" | "inactive" | "busy" | "unavailable";

export interface CoachMetrics {
  averageRating: number;
  totalSessions: number;
  completionRate: number;
  successRate: number;
  responseTime: number; // in hours
  repeatClientRate: number;
}

export interface Coach {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  title?: string;
  company?: string;
  bio?: string;
  profilePicture?: string;
  location?: string;
  timezone?: string;
  languages: string[];
  hourlyRate?: number;
  currency: string;
  isVerified: boolean;
  coaching: CoachingExpertise[];
  availability: CoachAvailability[];
  maxStudents: number;
  currentStudents: number;
  status: CoachStatus;
  metrics: CoachMetrics;
  specializations: string[];
  certifications: string[];
  experience: number; // years of experience
  totalSessions: number;
  rating: number;
  avatar?: string;
  availableSlots: string[];

  // Methods
  getFullName(): string;
  isAvailable(): boolean;
  canAcceptNewStudents(): boolean;
  getMatchScore(requestedSkills: string[], requiredExperience: number): number;
  getCoachingCategories(): string[];
}

export interface CoachMatch {
  coach: Coach;
  matchScore: number;
  strengths: string[];
  matchReasons: string[];
  estimatedSuccessRate: number;
  recommendationLevel: "low" | "medium" | "high" | "excellent";
}

export interface MatchingFilters {
  coaching?: string[];
  experienceLevel?: "beginner" | "intermediate" | "coach" | "master";
  minRating?: number;
  maxHourlyRate?: number;
  languages?: string[];
  availability?: string[];
  location?: string;
  timezone?: string;
}

export interface MatchingResult {
  totalMatches: number;
  searchTime: number;
  matches: CoachMatch[];
  filters: MatchingFilters;
  suggestions: string[];
}

export interface CoachSearchFilters {
  query: string;
  coaching: string[];
  experience: string;
  rating: string;
  availability: string;
  priceRange: number[];
  location: string;
}
