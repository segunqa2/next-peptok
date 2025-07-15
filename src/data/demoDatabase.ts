/**
 * ⚠️  DEPRECATED: Demo database removed. Use backend API instead.
 *
 * This file has been replaced with empty stubs to maintain compatibility
 * while the codebase transitions to use the production API.
 */

console.warn(
  "⚠️  WARNING: Demo database deprecated. Please use production API instead.",
);

// Empty interfaces maintained for compatibility
export interface DemoUser {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  userType: "platform_admin" | "company_admin" | "coach" | "team_member";
  companyId?: string;
  picture: string;
  provider: string;
  bio?: string;
  skills?: string[];
  experience?: number;
  rating?: number;
  totalRatings?: number;
  hourlyRate?: number;
  joinedAt: string;
  lastActive: string;
  status: "active" | "suspended" | "inactive";
}

export interface DemoCompany {
  id: string;
  name: string;
  industry: string;
  size: string;
  adminId: string;
  employeeCount: number;
  activePrograms: number;
  totalSessions: number;
  subscriptionTier: string;
  joinedAt: string;
  status: "active" | "trial" | "suspended";
  revenue: number;
}

export interface DemoMentorshipRequest {
  id: string;
  title: string;
  description: string;
  companyId: string;
  companyName: string;
  skills: string[];
  participants: number;
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  timeline: {
    startDate: string;
    endDate: string;
    sessionFrequency: "weekly" | "bi-weekly" | "monthly";
    hoursPerSession: number;
    totalSessions: number;
  };
  priority: "high" | "medium" | "low";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  assignedCoachId?: string;
  createdAt: string;
  updatedAt: string;
  teamMembers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
  goals: Array<{
    id: string;
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
  }>;
}

export interface DemoSession {
  id: string;
  title: string;
  description: string;
  // ... other properties as needed for compatibility
}

// Empty data arrays - use API instead
export const demoUsers: DemoUser[] = [];
export const demoCompanies: DemoCompany[] = [];
export const demoMentorshipRequests: DemoMentorshipRequest[] = [];
export const demoSessions: DemoSession[] = [];

// Empty functions - use API instead
export const getDemoStatistics = () => ({
  totalCoaches: 0,
  totalSessions: 0,
  averageRating: 0,
  totalCompanies: 0,
  totalActiveUsers: 0,
  monthlyGrowth: 0,
});

export const getDemoCoaches = () => [];
export const getDemoTeamMembers = () => [];
export const getDemoConnections = () => [];
export const getDemoPrograms = () => [];

// Migration notice
export const MIGRATION_NOTICE = `
⚠️  DEMO DATA DEPRECATED

This demo database has been removed. Please update your code to use:

1. Production API endpoints in src/services/api.ts
2. Backend-nestjs PostgreSQL database
3. Real authentication through authService.ts

Remove any imports from this file and replace with API calls.
`;

console.log(MIGRATION_NOTICE);
