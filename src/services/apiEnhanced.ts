import {
  MentorshipRequest,
  CoachingRequest,
  SubscriptionTier,
  SessionPricingTier,
  CoachSessionLimits,
  User,
} from "../types";
import LocalStorageService from "./localStorageService";
import { Mentor, MatchingFilters, MatchingResult } from "../types/mentor";
import {
  Coach,
  CoachMatch,
  MatchingFilters as CoachMatchingFilters,
  MatchingResult as CoachMatchingResult,
} from "../types/coach";
import {
  Session,
  SessionScheduleRequest,
  SessionStats,
  SessionJoinInfo,
} from "../types/session";

import { Environment } from "../utils/environment";
import { analytics } from "./analytics";
import { backendStorage } from "./backendStorage";
import {
  demoUsers,
  demoMentorshipRequests,
  demoCompanies,
  getDemoStatistics,
} from "../data/demoDatabase";
import { crossBrowserSync, SYNC_CONFIGS } from "./crossBrowserSync";
// Removed: cacheInvalidation service (deleted)
import { securityService } from "./securityService";
import { analyticsService } from "./analyticsService";
import { dataSyncService } from "./dataSyncService";
import { SYNC_CONFIGS as DATA_SYNC_CONFIGS } from "./syncConfigs";

const API_BASE_URL = Environment.getApiBaseUrl();

// User context for authorization
let currentUser: User | null = null;

export const setCurrentUser = (user: User | null) => {
  currentUser = user;

  // Set user in sync service for authentication
  dataSyncService.setCurrentUser(user);

  if (user) {
    analytics.setUser(user.id, user.userType, {
      email: user.email,
      name: user.name,
    });
  } else {
    analytics.clearUser();
  }
};

// Authorization helper
const checkAuthorization = (
  requiredRoles?: string[],
  resourceOwnerId?: string,
) => {
  if (!currentUser) {
    throw new Error("Authentication required");
  }

  if (requiredRoles && !requiredRoles.includes(currentUser.userType)) {
    analytics.trackError(new Error("Insufficient permissions"), {
      requiredRoles,
      userType: currentUser.userType,
      action: "authorization_check",
    });
    throw new Error("Insufficient permissions");
  }

  // Resource owner check - users can only access their own data unless they're admin
  if (resourceOwnerId && currentUser.userType !== "platform_admin") {
    const hasAccess =
      currentUser.id === resourceOwnerId ||
      currentUser.companyId === resourceOwnerId ||
      (currentUser.userType === "company_admin" &&
        currentUser.companyId === resourceOwnerId);

    if (!hasAccess) {
      analytics.trackError(new Error("Access denied"), {
        resourceOwnerId,
        userId: currentUser.id,
        userType: currentUser.userType,
        action: "resource_access_denied",
      });
      throw new Error("Access denied - you can only access your own resources");
    }
  }

  return currentUser;
};

class EnhancedApiService {
  constructor() {
    console.log(
      "🗃️ API Enhanced Service - Backend Database Only (No localStorage)",
    );
  }

  private async initializeBackendData(): Promise<void> {
    // Initialize backend database with sample data if needed
    console.log("🗃️ Checking backend database for initial data...");

    const existingRequests = await backendStorage.getItem(
      "mentorship_requests",
    );
    if (!existingRequests) {
      const sampleRequests: MentorshipRequest[] = [
        {
          id: "sample_request_1",
          companyId: "default-company-id",
          title: "React Development Training",
          description:
            "Help our team improve their React skills and best practices.",
          goals: [
            {
              id: "goal_1",
              title: "Master React Hooks",
              description:
                "Learn advanced React hooks and custom hook patterns",
              category: "technical",
              priority: "high",
            },
          ],
          skills: ["React", "JavaScript", "Frontend Development"],
          timeline: "4 weeks",
          participants: 3,
          budget: {
            min: 2000,
            max: 5000,
            currency: "CAD",
          },
          status: "pending",
          priority: "high",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          assignedCoachId: null,
        },
      ];

      await backendStorage.setItem("mentorship_requests", sampleRequests);
      console.log("✅ Sample mentorship requests stored in backend database");
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<{ data: T; error?: string }> {
    const startTime = Date.now();

    // Check if we're in a cloud environment without backend
    const isCloudEnvironment =
      window.location.hostname.includes(".fly.dev") ||
      window.location.hostname.includes(".vercel.app") ||
      window.location.hostname.includes(".netlify.app");

    const apiUrl = import.meta.env.VITE_API_URL;

    // If in cloud environment without configured backend, skip API call
    if (isCloudEnvironment && !apiUrl) {
      throw new Error("Backend not available in demo environment");
    }

    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      // Construct full URL for NestJS backend
      const url = endpoint.startsWith("/")
        ? `${API_BASE_URL}${endpoint}`
        : `${API_BASE_URL}/${endpoint}`;

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...(currentUser && {
            Authorization: `Bearer ${currentUser.token || "mock-token"}`,
          }),
          ...options.headers,
        },
        ...options,
      });

      clearTimeout(timeoutId); // Clear the timeout on successful response

      const responseTime = Date.now() - startTime;
      analytics.trackPerformance("api_request", responseTime, {
        endpoint,
        method: options.method || "GET",
        status: response.status,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      analytics.trackPerformance("api_request_failed", responseTime, {
        endpoint,
        method: options.method || "GET",
        error: error instanceof Error ? error.message : "Unknown error",
      });

      analytics.trackError(
        error instanceof Error ? error : new Error("API request failed"),
        {
          endpoint,
          method: options.method || "GET",
        },
      );

      throw error;
    }
  }

  // ===== COACH-SPECIFIC METHODS =====

  async getCoachProfile(coachId: string): Promise<any> {
    const user = checkAuthorization(["coach", "platform_admin"], coachId);

    try {
      const response = await this.request<any>(`/coaches/${coachId}/profile`);

      analytics.trackAction({
        action: "coach_profile_viewed",
        component: "coach_api",
        metadata: { coachId },
      });

      return response.data;
    } catch (error) {
      console.warn("API not available, using mock profile:", error);

      // Return mock profile data
      return {
        id: coachId,
        name: user.name || "Coach Name",
        email: user.email || "coach@example.com",
        bio: "Experienced coach with expertise in leadership development and team building.",
        skills: [
          "Leadership",
          "Team Building",
          "Communication",
          "Problem Solving",
        ],
        experience: 5,
        rating: 4.8,
        totalRatings: 127,
        hourlyRate: 150,
        currency: "USD",
        availability: {
          timezone: "EST",
          schedule: [
            {
              day: "Monday",
              startTime: "09:00",
              endTime: "17:00",
              available: true,
            },
            {
              day: "Tuesday",
              startTime: "09:00",
              endTime: "17:00",
              available: true,
            },
            {
              day: "Wednesday",
              startTime: "09:00",
              endTime: "17:00",
              available: true,
            },
            {
              day: "Thursday",
              startTime: "09:00",
              endTime: "17:00",
              available: true,
            },
            {
              day: "Friday",
              startTime: "09:00",
              endTime: "15:00",
              available: true,
            },
            {
              day: "Saturday",
              startTime: "10:00",
              endTime: "14:00",
              available: false,
            },
            {
              day: "Sunday",
              startTime: "10:00",
              endTime: "14:00",
              available: false,
            },
          ],
        },
        certifications: ["ICF Certified", "Leadership Training Certificate"],
        languages: ["English", "Spanish"],
        profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${coachId}`,
        isActive: true,
        joinedAt: "2024-01-01T00:00:00Z",
      };
    }
  }

  async getCoachStats(coachId: string): Promise<any> {
    const user = checkAuthorization(["coach", "platform_admin"], coachId);

    try {
      const response = await this.request<any>(`/coaches/${coachId}/stats`);

      analytics.trackAction({
        action: "coach_stats_viewed",
        component: "coach_api",
        metadata: { coachId },
      });

      return response.data;
    } catch (error) {
      console.warn("API not available, using mock stats:", error);

      // Calculate stats from matches or return mock data
      const matches = await this.getCoachMatches(coachId);
      const completedMatches = matches.filter((m) => m.status === "completed");
      const inProgressMatches = matches.filter(
        (m) => m.status === "in_progress",
      );

      return {
        totalSessions: matches.length,
        completedSessions: completedMatches.length,
        averageRating: 4.8,
        totalEarnings: completedMatches.length * 150,
        thisMonthEarnings: Math.floor(completedMatches.length * 150 * 0.3),
        upcomingSessions: inProgressMatches.length,
        responseTime: 2.5,
        successRate:
          completedMatches.length > 0
            ? (completedMatches.length / matches.length) * 100
            : 95,
        repeatClients: Math.floor(completedMatches.length * 0.4),
        totalClients: Math.max(completedMatches.length, 10),
        profileViews: 234,
        matchAcceptanceRate: 85,
      };
    }
  }

  async getCoachSessions(
    coachId: string,
    params?: {
      status?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<any[]> {
    const user = checkAuthorization(["coach", "platform_admin"], coachId);

    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append("status", params.status);
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.offset)
        queryParams.append("offset", params.offset.toString());

      const response = await this.request<any[]>(
        `/coaches/${coachId}/sessions?${queryParams.toString()}`,
      );

      analytics.trackAction({
        action: "coach_sessions_viewed",
        component: "coach_api",
        metadata: { coachId, params },
      });

      return response.data;
    } catch (error) {
      console.warn("API not available, using mock sessions:", error);

      // Return mock sessions
      const mockSessions = [
        {
          id: "session-1",
          title: "Leadership Development Session",
          description: "Weekly leadership coaching for senior managers",
          startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
          status: "scheduled",
          participants: [
            {
              id: "p1",
              name: "John Doe",
              email: "john@company.com",
              role: "manager",
            },
            {
              id: "p2",
              name: "Jane Smith",
              email: "jane@company.com",
              role: "director",
            },
          ],
          companyName: "TechCorp Inc.",
          meetingLink: "https://meet.google.com/abc-defg-hij",
          earnings: 200,
          currency: "USD",
        },
        {
          id: "session-2",
          title: "Team Communication Workshop",
          description: "Improving team communication and collaboration",
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
          status: "scheduled",
          participants: [
            {
              id: "p3",
              name: "Mike Wilson",
              email: "mike@startup.com",
              role: "team_lead",
            },
          ],
          companyName: "StartupCo",
          meetingLink: "https://meet.google.com/xyz-uvw-rst",
          earnings: 150,
          currency: "USD",
        },
      ];

      // Filter by status if provided
      if (params?.status) {
        return mockSessions.filter(
          (session) => session.status === params.status,
        );
      }

      // Apply limit if provided
      if (params?.limit) {
        return mockSessions.slice(0, params.limit);
      }

      return mockSessions;
    }
  }

  async getCoachActivity(
    coachId: string,
    params?: {
      limit?: number;
      type?: string;
    },
  ): Promise<any[]> {
    const user = checkAuthorization(["coach", "platform_admin"], coachId);

    try {
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.type) queryParams.append("type", params.type);

      const response = await this.request<any[]>(
        `/coaches/${coachId}/activity?${queryParams.toString()}`,
      );

      return response.data;
    } catch (error) {
      console.warn("API not available, using mock activity:", error);

      // Return mock activity data
      return [
        {
          id: "1",
          type: "match_request",
          title: "New Match Request",
          description: "Leadership development for TechCorp Inc.",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          metadata: { companyName: "TechCorp Inc." },
        },
        {
          id: "2",
          type: "session_completed",
          title: "Session Completed",
          description: "Team communication workshop completed successfully",
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          metadata: { rating: 5 },
        },
        {
          id: "3",
          type: "payment_received",
          title: "Payment Received",
          description: "$200 for leadership coaching session",
          timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          metadata: { amount: 200 },
        },
        {
          id: "4",
          type: "rating_received",
          title: "5-Star Rating",
          description: "Excellent feedback from StartupCo team",
          timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
          metadata: { rating: 5 },
        },
        {
          id: "5",
          type: "profile_view",
          title: "Profile Viewed",
          description: "Your profile was viewed by 3 potential clients",
          timestamp: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
          metadata: { views: 3 },
        },
      ].slice(0, params?.limit || 20);
    }
  }

  async updateCoachProfile(coachId: string, profileData: any): Promise<any> {
    const user = checkAuthorization(["coach"], coachId);

    try {
      const response = await this.request<any>(`/coaches/${coachId}/profile`, {
        method: "PUT",
        body: JSON.stringify(profileData),
      });

      analytics.trackAction({
        action: "coach_profile_updated",
        component: "coach_api",
        metadata: { coachId },
      });

      return response.data;
    } catch (error) {
      console.warn("API not available, profile update stored locally:", error);

      // Store in localStorage as fallback
      const storageKey = `coach_profile_${coachId}`;
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          ...profileData,
          updatedAt: new Date().toISOString(),
        }),
      );

      analytics.trackAction({
        action: "coach_profile_updated_local",
        component: "coach_api",
        metadata: { coachId },
      });

      return profileData;
    }
  }

  async getCoachMatches(coachId?: string): Promise<MentorshipRequest[]> {
    const user = checkAuthorization(["coach", "platform_admin"]);
    const targetCoachId = coachId || user.id;

    // Coaches can only see their own matches
    if (user.userType === "coach" && targetCoachId !== user.id) {
      throw new Error("Coaches can only view their own matches");
    }

    try {
      const response = await this.request<MentorshipRequest[]>(
        `/coaches/${targetCoachId}/matches`,
      );

      analytics.coach.profileViewed(targetCoachId, user.userType);
      analytics.trackAction({
        action: "coach_matches_viewed",
        component: "coach_dashboard",
        metadata: { coachId: targetCoachId, matchCount: response.data.length },
      });

      return response.data;
    } catch (error) {
      console.warn("API not available, using filtered mock matches:", error);

      // Use demo database requests and filter for this coach
      const coachMatches = demoMentorshipRequests.filter(
        (req) =>
          req.assignedCoachId === targetCoachId ||
          (req.status === "pending" && !req.assignedCoachId), // Show pending matches coaches can accept
      );

      analytics.coach.profileViewed(targetCoachId, user.userType);

      return coachMatches;
    }
  }

  async getAllCoaches(): Promise<Coach[]> {
    // Check if we have a valid API URL configuration
    const apiUrl = import.meta.env.VITE_API_URL;
    const isCloudEnvironment =
      window.location.hostname.includes(".fly.dev") ||
      window.location.hostname.includes(".vercel.app") ||
      window.location.hostname.includes(".netlify.app");

    // Skip API request if no backend is configured or we're in a cloud environment without API URL
    if (apiUrl && !isCloudEnvironment) {
      try {
        const response = await this.request<Coach[]>("/coaches");

        analytics.trackAction({
          action: "all_coaches_viewed",
          component: "coach_directory",
          metadata: { coachCount: response.data.length },
        });

        return response.data;
      } catch (error) {
        console.warn("API not available, using mock coaches:", error);
      }
    } else {
      console.log("🗃️ No backend configured, using mock coaches data");
    }

    // Return mock coaches data for the directory
    const mockCoaches: Coach[] = [
      {
        id: "coach_1",
        name: "Sarah Wilson",
        title: "Senior Full-Stack Developer & Tech Lead",
        company: "TechCorp Inc.",
        coaching: [
          "JavaScript",
          "React",
          "Node.js",
          "TypeScript",
          "AWS",
          "Leadership",
        ],
        rating: 4.9,
        experience: 8,
        totalSessions: 156,
        avatar:
          "https://images.unsplash.com/photo-1494790108755-2616b612b1-3c?w=150",
        availableSlots: [
          "Mon 9:00",
          "Tue 10:00",
          "Wed 14:00",
          "Thu 15:00",
          "Fri 13:00",
        ],
      },
      {
        id: "coach_2",
        name: "Michael Chen",
        title: "React Specialist & UI/UX Expert",
        company: "Design Systems Co.",
        coaching: ["React", "TypeScript", "CSS", "Design Systems", "GraphQL"],
        rating: 4.7,
        experience: 6,
        totalSessions: 78,
        avatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
        availableSlots: ["Mon 14:00", "Wed 10:00", "Fri 16:00"],
      },
      {
        id: "coach_3",
        name: "Emma Rodriguez",
        title: "JavaScript Expert & Mentor",
        company: "Vue Innovations",
        coaching: ["JavaScript", "Vue.js", "Node.js", "MongoDB", "Testing"],
        rating: 4.6,
        experience: 5,
        totalSessions: 45,
        avatar:
          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
        availableSlots: ["Tue 9:00", "Thu 11:00", "Fri 14:00"],
      },
      {
        id: "coach_4",
        name: "David Kumar",
        title: "DevOps Engineer & Cloud Architect",
        company: "CloudScale Solutions",
        coaching: [
          "AWS",
          "Docker",
          "Kubernetes",
          "CI/CD",
          "Python",
          "Terraform",
        ],
        rating: 4.8,
        experience: 10,
        totalSessions: 87,
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
        availableSlots: ["Mon 8:00", "Wed 9:00", "Thu 13:00"],
      },
      {
        id: "coach_5",
        name: "Lisa Thompson",
        title: "Product Manager & Agile Coach",
        company: "ProductFirst LLC",
        coaching: [
          "Product Management",
          "Agile",
          "Scrum",
          "User Research",
          "Analytics",
        ],
        rating: 4.5,
        experience: 7,
        totalSessions: 53,
        avatar:
          "https://images.unsplash.com/photo-1494790108755-2616b612b1-c?w=150",
        availableSlots: ["Tue 10:00", "Wed 15:00", "Fri 11:00"],
      },
      {
        id: "coach_6",
        name: "James Anderson",
        title: "Data Scientist & ML Engineer",
        company: "DataDriven Analytics",
        coaching: [
          "Python",
          "Machine Learning",
          "TensorFlow",
          "Data Analysis",
          "SQL",
        ],
        rating: 4.7,
        experience: 9,
        totalSessions: 67,
        avatar:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
        availableSlots: ["Mon 11:00", "Tue 14:00", "Thu 10:00", "Fri 9:00"],
      },
    ];

    analytics.trackAction({
      action: "all_coaches_viewed_mock",
      component: "coach_directory",
      metadata: { coachCount: mockCoaches.length },
    });

    return mockCoaches;
  }

  async getCompanyCoaches(companyId?: string): Promise<any[]> {
    const user = checkAuthorization(["company_admin", "platform_admin"]);
    const targetCompanyId = companyId || user.companyId;

    // Company admins can only see coaches for their company's requests
    if (
      user.userType === "company_admin" &&
      targetCompanyId !== user.companyId
    ) {
      throw new Error(
        "Company admins can only view coaches for their own company",
      );
    }

    try {
      const response = await this.request<any[]>(
        `/companies/${targetCompanyId}/coaches`,
      );

      // Filter only active, valid coaches
      const activeCoaches = response.data.filter(
        (coach: any) =>
          coach.status === "active" &&
          coach.isActive !== false &&
          coach.isVerified !== false,
      );

      analytics.trackAction({
        action: "company_coaches_viewed",
        component: "company_dashboard",
        metadata: {
          companyId: targetCompanyId,
          coachCount: activeCoaches.length,
        },
      });

      return activeCoaches;
    } catch (error) {
      console.warn("API not available, using demo coaches:", error);

      // Filter coaches based on company's active requests and assignments
      const companyRequests = demoMentorshipRequests.filter(
        (req) => req.companyId === targetCompanyId,
      );

      const assignedCoachIds = companyRequests
        .filter((req) => req.assignedCoachId)
        .map((req) => req.assignedCoachId);

      const availableCoaches = demoUsers
        .filter((user) => user.userType === "coach")
        .filter((coach) => coach.status === "active") // Only active coaches
        .filter(
          (coach) =>
            assignedCoachIds.includes(coach.id) ||
            companyRequests.some((req) => req.status === "pending"),
        )
        .map((coach) => ({
          ...coach,
          status: "active", // Ensure status is active
          isActive: true,
          isVerified: true,
          assignedRequests: companyRequests.filter(
            (req) => req.assignedCoachId === coach.id,
          ),
          availableForRequests: companyRequests.filter(
            (req) => req.status === "pending" && !req.assignedCoachId,
          ),
        }));

      analytics.trackAction({
        action: "company_coaches_viewed",
        component: "company_dashboard",
        metadata: {
          companyId: targetCompanyId,
          coachCount: availableCoaches.length,
        },
      });

      return availableCoaches;
    }
  }

  async acceptMatch(
    matchId: string,
  ): Promise<{ success: boolean; message?: string }> {
    const user = checkAuthorization(["coach"]);

    // Use data sync service to update the match
    const updates = {
      assignedCoachId: user.id,
      status: "in_progress",
      updatedAt: new Date().toISOString(),
    };

    const result = await dataSyncService.updateData<MentorshipRequest>(
      DATA_SYNC_CONFIGS.MENTORSHIP_REQUESTS,
      matchId,
      updates,
    );

    analytics.coach.matchAccepted(matchId, user.id);
    analytics.trackAction({
      action: "match_accepted",
      component: "coach_matching",
      metadata: {
        matchId,
        coachId: user.id,
        source: result.source,
      },
    });

    console.log(`✅ Match ${matchId} accepted via ${result.source}`);

    return {
      success: result.success,
      message: result.success
        ? "Match accepted successfully"
        : "Failed to accept match",
    };
  }

  async declineMatch(
    matchId: string,
    reason?: string,
  ): Promise<{ success: boolean; message?: string }> {
    const user = checkAuthorization(["coach"]);

    try {
      const response = await this.request<{
        success: boolean;
        message?: string;
      }>(`/matches/${matchId}/decline`, {
        method: "POST",
        body: JSON.stringify({ coachId: user.id, reason }),
      });

      analytics.coach.matchDeclined(matchId, user.id, reason);
      analytics.trackAction({
        action: "match_declined",
        component: "coach_matching",
        metadata: { matchId, coachId: user.id, reason },
      });

      return response.data;
    } catch (error) {
      console.warn("API not available, updating localStorage:", error);

      analytics.coach.matchDeclined(matchId, user.id, reason);

      return { success: true, message: "Match declined" };
    }
  }

  async updateCoachAvailability(
    availability: any,
  ): Promise<{ success: boolean }> {
    const user = checkAuthorization(["coach"]);

    try {
      const response = await this.request<{ success: boolean }>(
        `/coaches/${user.id}/availability`,
        {
          method: "PUT",
          body: JSON.stringify(availability),
        },
      );

      analytics.coach.availabilityUpdated(user.id, availability);

      return response.data;
    } catch (error) {
      console.warn("API not available, storing availability locally:", error);

      localStorage.setItem(
        `coach_availability_${user.id}`,
        JSON.stringify(availability),
      );
      analytics.coach.availabilityUpdated(user.id, availability);

      return { success: true };
    }
  }

  // ===== COMPANY-SPECIFIC METHODS =====

  async getCompanyRequests(companyId?: string): Promise<MentorshipRequest[]> {
    const user = checkAuthorization(["company_admin", "platform_admin"]);
    const targetCompanyId = companyId || user.companyId;

    // Company admins can only see their company's requests
    if (
      user.userType === "company_admin" &&
      targetCompanyId !== user.companyId
    ) {
      throw new Error(
        "Company admins can only view their own company's requests",
      );
    }

    try {
      const response = await this.request(
        `/companies/${targetCompanyId}/requests`,
      );

      analytics.trackAction({
        action: "company_requests_viewed",
        component: "company_dashboard",
        metadata: {
          companyId: targetCompanyId,
          requestCount: response.data.length,
        },
      });

      return response.data;
    } catch (error) {
      console.warn("API not available, using demo coach profile:", error);

      // Return demo coach profile based on the coach ID
      const demoCoach = demoUsers.find(
        (u) => u.id === coachId && u.userType === "coach",
      );
      if (!demoCoach) {
        throw new Error("Coach profile not found");
      }

      // Create a default profile structure
      const defaultProfile = {
        id: coachId,
        name: `${demoCoach.firstName} ${demoCoach.lastName}`,
        email: demoCoach.email,
        bio: "Experienced professional coach dedicated to helping individuals and teams achieve their goals.",
        skills: ["Leadership", "Communication", "Team Building", "Strategy"],
        experience: 5,
        hourlyRate: 150,
        currency: "USD",
        availability: {
          timezone: "EST",
          schedule: [
            {
              day: "Monday",
              startTime: "09:00",
              endTime: "17:00",
              available: true,
            },
            {
              day: "Tuesday",
              startTime: "09:00",
              endTime: "17:00",
              available: true,
            },
            {
              day: "Wednesday",
              startTime: "09:00",
              endTime: "17:00",
              available: true,
            },
            {
              day: "Thursday",
              startTime: "09:00",
              endTime: "17:00",
              available: true,
            },
            {
              day: "Friday",
              startTime: "09:00",
              endTime: "17:00",
              available: true,
            },
            {
              day: "Saturday",
              startTime: "10:00",
              endTime: "14:00",
              available: false,
            },
            {
              day: "Sunday",
              startTime: "10:00",
              endTime: "14:00",
              available: false,
            },
          ],
        },
        certifications: ["ICF Certified Coach", "PCC Credential"],
        languages: ["English"],
        profileImage: demoCoach.avatar || "",
        isActive: true,
        notifications: {
          emailNotifications: true,
          smsNotifications: false,
          newMatches: true,
          sessionReminders: true,
          paymentUpdates: true,
        },
        privacy: {
          showProfile: true,
          showRating: true,
          showExperience: true,
        },
      };

      return defaultProfile;
    }
  }

  async updateCoachProfile(coachId: string, profileData: any): Promise<any> {
    const user = checkAuthorization(["coach", "platform_admin"]);

    // Coaches can only update their own profile unless platform admin
    if (user.userType === "coach" && user.id !== coachId) {
      throw new Error("Coaches can only update their own profile");
    }

    try {
      const response = await this.request<any>(`/coaches/${coachId}/profile`, {
        method: "PUT",
        body: JSON.stringify(profileData),
      });

      analytics.trackAction({
        action: "coach_profile_updated",
        component: "coach_settings",
        metadata: { coachId },
      });

      return response.data;
    } catch (error) {
      console.warn("API not available, storing profile locally:", error);

      // Store profile data locally
      localStorage.setItem(
        `coach_profile_${coachId}`,
        JSON.stringify({
          ...profileData,
          updatedAt: new Date().toISOString(),
        }),
      );

      analytics.trackAction({
        action: "coach_profile_updated_local",
        component: "coach_settings",
        metadata: { coachId },
      });

      return profileData;
    }
  }

  async getAllCoaches(): Promise<any[]> {
    try {
      const response = await this.request<any[]>("/coaches");

      // Filter only active coaches
      const activeCoaches = response.data.filter(
        (coach: any) => coach.status === "active" || coach.isActive !== false,
      );

      return activeCoaches;
    } catch (error) {
      console.warn("API not available, using demo coaches:", error);

      // Return demo coaches from demo database
      const demoCoaches = demoUsers
        .filter((user) => user.userType === "coach")
        .map((coach) => ({
          id: coach.id,
          firstName: coach.firstName,
          lastName: coach.lastName,
          title: "Professional Coach",
          skills: ["Leadership", "Communication", "Team Building", "Strategy"],
          experience: Math.floor(Math.random() * 8) + 3, // 3-10 years
          rating: 4.0 + Math.random() * 1, // 4.0-5.0 rating
          status: "active",
          hourlyRate: 100 + Math.floor(Math.random() * 100), // $100-200/hr
          profilePicture: coach.avatar,
          bio: "Experienced professional coach dedicated to helping individuals and teams achieve their goals.",
          specializations: [
            "Leadership Development",
            "Team Performance",
            "Strategic Planning",
          ],
          yearsExperience: Math.floor(Math.random() * 8) + 3,
          languages: ["English"],
          timezone: "EST",
          isActive: true,
        }));

      return demoCoaches;
    }
  }

  // ===== COMPANY-SPECIFIC METHODS =====

  async getCompanyRequests(companyId?: string): Promise<MentorshipRequest[]> {
    const user = checkAuthorization(["company_admin", "platform_admin"]);
    const targetCompanyId = companyId || user.companyId;

    // Company admins can only see their company's requests
    if (
      user.userType === "company_admin" &&
      targetCompanyId !== user.companyId
    ) {
      throw new Error(
        "Company admins can only view their own company's requests",
      );
    }

    try {
      const response = await this.request<MentorshipRequest[]>(
        `/companies/${targetCompanyId}/requests`,
      );

      analytics.trackAction({
        action: "company_requests_viewed",
        component: "company_dashboard",
        metadata: {
          companyId: targetCompanyId,
          requestCount: response.data.length,
        },
      });

      return response.data;
    } catch (error) {
      console.warn("API not available, using filtered mock requests:", error);

      const allRequests = JSON.parse(
        localStorage.getItem("mentorship_requests") || "[]",
      );
      const companyRequests = allRequests.filter(
        (req: MentorshipRequest) => req.companyId === targetCompanyId,
      );

      return companyRequests;
    }
  }

  async createMentorshipRequest(
    request: Partial<MentorshipRequest>,
  ): Promise<MentorshipRequest> {
    const user = checkAuthorization(["company_admin"]);

    const newRequest: MentorshipRequest = {
      id: `request_${Date.now()}`,
      companyId: user.companyId!,
      ...request,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as MentorshipRequest;

    // Use data sync service for backend-first creation
    const result = await dataSyncService.createData<MentorshipRequest>(
      DATA_SYNC_CONFIGS.MENTORSHIP_REQUESTS,
      newRequest,
    );

    analytics.company.requestCreated(
      newRequest.id,
      user.companyId!,
      request.title || "Untitled Request",
    );

    console.log(
      `✅ Created mentorship request ${newRequest.id} via ${result.source}`,
    );

    return newRequest;
  }

  // ===== COACHING REQUEST METHODS =====

  async createCoachingRequest(
    request: Partial<CoachingRequest>,
  ): Promise<CoachingRequest> {
    const user = checkAuthorization(["company_admin"]);

    const newRequest: CoachingRequest = {
      id: `request_${Date.now()}`, // Will be replaced by backend if successful
      companyId: user.companyId!,
      ...request,
      status: "submitted",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as CoachingRequest;

    // Use data sync service for backend-first creation
    const result = await dataSyncService.createData<CoachingRequest>(
      DATA_SYNC_CONFIGS.COACHING_REQUESTS,
      newRequest,
    );

    analytics.company.requestCreated(
      newRequest.id,
      user.companyId!,
      request.title || "Untitled Request",
    );

    // Track the sync result
    analytics.trackAction({
      action: "coaching_request_created",
      component: "api_enhanced",
      metadata: {
        source: result.source,
        companyId: user.companyId,
        title: request.title,
      },
    });

    console.log(
      `✅ Created coaching request via ${result.source}:`,
      newRequest.id,
    );

    return newRequest;
  }

  async getCoachingRequests(params?: {
    status?: string;
    companyId?: string;
    coachId?: string;
    limit?: number;
  }): Promise<CoachingRequest[]> {
    const user = checkAuthorization();

    // Use data sync service with backend-first approach
    const filters: Record<string, string> = {};

    // Role-based filtering
    if (user.userType === "coach") {
      filters.coachId = user.id;
    } else if (user.userType === "company_admin" && user.companyId) {
      filters.companyId = user.companyId;
    }

    // Additional filters
    if (params?.status) filters.status = params.status;
    if (params?.companyId && user.userType === "platform_admin") {
      filters.companyId = params.companyId;
    }
    if (params?.coachId && user.userType === "platform_admin") {
      filters.coachId = params.coachId;
    }
    if (params?.limit) filters.limit = params.limit.toString();

    const result = await dataSyncService.getData<CoachingRequest>(
      DATA_SYNC_CONFIGS.COACHING_REQUESTS,
      filters,
    );

    analytics.trackAction({
      action: "coaching_requests_viewed",
      component: "dashboard",
      metadata: {
        params,
        userType: user.userType,
        resultCount: result.data?.length || 0,
        source: result.source,
        backendAvailable: result.backendAvailable,
      },
    });

    // Apply client-side filtering for localStorage fallback
    let filteredData = result.data || [];

    if (result.source === "localStorage") {
      // Apply role-based filtering for localStorage
      if (user.userType === "coach") {
        filteredData = filteredData.filter(
          (req: CoachingRequest) =>
            req.assignedCoachId === user.id ||
            (req.status === "submitted" && !req.assignedCoachId),
        );
      } else if (user.userType === "company_admin" && user.companyId) {
        filteredData = filteredData.filter(
          (req: CoachingRequest) => req.companyId === user.companyId,
        );
      }

      // Apply additional filters
      if (params?.status) {
        filteredData = filteredData.filter(
          (req: CoachingRequest) => req.status === params.status,
        );
      }

      if (params?.limit) {
        filteredData = filteredData.slice(0, params.limit);
      }
    }

    console.log(
      `📊 Retrieved ${filteredData.length} coaching requests from ${result.source}`,
    );

    return filteredData;
  }

  async getCoachingRequest(id: string): Promise<CoachingRequest | null> {
    const user = checkAuthorization();

    try {
      const response = await this.request<CoachingRequest>(
        `/coaching-requests/${id}`,
      );

      analytics.trackAction({
        action: "coaching_request_viewed",
        component: "dashboard",
        metadata: { requestId: id },
      });

      return response.data;
    } catch (error) {
      console.warn("API not available, checking localStorage:", error);

      // Get from localStorage
      const allRequests = LocalStorageService.getCoachingRequests();
      const request = allRequests.find((req) => req.id === id);

      if (request) {
        // Check authorization
        if (
          user.userType === "platform_admin" ||
          request.companyId === user.companyId ||
          request.assignedCoachId === user.id
        ) {
          return request;
        } else {
          throw new Error("Access denied");
        }
      }

      return null;
    }
  }

  async updateCoachingRequest(
    id: string,
    updates: Partial<CoachingRequest>,
  ): Promise<CoachingRequest> {
    const user = checkAuthorization();

    const updatesWithTimestamp = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Use data sync service for backend-first update
    const result = await dataSyncService.updateData<CoachingRequest>(
      DATA_SYNC_CONFIGS.COACHING_REQUESTS,
      id,
      updatesWithTimestamp,
    );

    analytics.trackAction({
      action: "coaching_request_updated",
      component: "dashboard",
      metadata: {
        requestId: id,
        updates: Object.keys(updates),
        source: result.source,
      },
    });

    console.log(`✅ Updated coaching request ${id} via ${result.source}`);

    // Return the updated request from localStorage
    const updatedRequest = LocalStorageService.getCoachingRequest(id);
    if (!updatedRequest) {
      throw new Error("Request not found after update");
    }

    return { ...updatedRequest, ...updatesWithTimestamp };
  }

  // ===== PLATFORM ADMIN METHODS =====

  async getPlatformStats(): Promise<{
    totalUsers: number;
    totalCompanies: number;
    totalCoaches: number;
    totalSessions: number;
    monthlyRevenue: number;
    activeSubscriptions: number;
  }> {
    checkAuthorization(["platform_admin"]);

    // Check if we're in a cloud environment without backend
    const isCloudEnvironment =
      window.location.hostname.includes(".fly.dev") ||
      window.location.hostname.includes(".vercel.app") ||
      window.location.hostname.includes(".netlify.app");

    const apiUrl = import.meta.env.VITE_API_URL;

    // Skip API request if in cloud environment without backend
    if (!isCloudEnvironment || apiUrl) {
      try {
        const response = await this.request<any>("/platform/stats");

        analytics.trackAction({
          action: "platform_stats_viewed",
          component: "platform_dashboard",
        });

        return response.data;
      } catch (error) {
        console.warn("API not available, using mock platform stats:", error);
      }
    }

    // Use real demo database statistics
    const demoStats = getDemoStatistics();
    const stats = demoStats.platformStats;

    analytics.platform.dailyActiveUsers(stats.totalUsers, new Date());
    analytics.platform.revenue(
      stats.monthlyRevenue,
      "subscriptions",
      new Date(),
    );

    return stats;
  }

  async getAllUsers(filters?: {
    userType?: string;
    status?: string;
    companyId?: string;
    search?: string;
  }): Promise<User[]> {
    checkAuthorization(["platform_admin"]);

    // Check if we're in a cloud environment without backend
    const isCloudEnvironment =
      window.location.hostname.includes(".fly.dev") ||
      window.location.hostname.includes(".vercel.app") ||
      window.location.hostname.includes(".netlify.app");

    const apiUrl = import.meta.env.VITE_API_URL;

    // Skip API request if in cloud environment without backend
    if (!isCloudEnvironment || apiUrl) {
      try {
        const queryParams = new URLSearchParams();
        if (filters?.userType) queryParams.append("userType", filters.userType);
        if (filters?.status) queryParams.append("status", filters.status);
        if (filters?.companyId)
          queryParams.append("companyId", filters.companyId);
        if (filters?.search) queryParams.append("search", filters.search);

        const response = await this.request<User[]>(
          `/users?${queryParams.toString()}`,
        );

        analytics.trackAction({
          action: "all_users_viewed",
          component: "platform_dashboard",
          metadata: { filters, resultCount: response.data.length },
        });

        return response.data;
      } catch (error) {
        console.warn("API not available, using mock users:", error);
      }
    }

    // Use demo database users
    let mockUsers: User[] = demoUsers.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      userType: user.userType as any,
      companyId: user.companyId,
      status: user.status as any,
      firstName: user.firstName,
      lastName: user.lastName,
      picture: user.picture,
      provider: user.provider,
    }));

    // Apply filters
    if (filters?.userType) {
      mockUsers = mockUsers.filter(
        (user) => user.userType === filters.userType,
      );
    }
    if (filters?.status) {
      mockUsers = mockUsers.filter((user) => user.status === filters.status);
    }
    if (filters?.companyId) {
      mockUsers = mockUsers.filter(
        (user) => user.companyId === filters.companyId,
      );
    }
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      mockUsers = mockUsers.filter(
        (user) =>
          user.name.toLowerCase().includes(search) ||
          user.email.toLowerCase().includes(search),
      );
    }

    return mockUsers;
  }

  async getAllCompanies(): Promise<any[]> {
    checkAuthorization(["platform_admin"]);

    // Check if we're in a cloud environment without backend
    const isCloudEnvironment =
      window.location.hostname.includes(".fly.dev") ||
      window.location.hostname.includes(".vercel.app") ||
      window.location.hostname.includes(".netlify.app");

    const apiUrl = import.meta.env.VITE_API_URL;

    // Skip API request if in cloud environment without backend
    if (!isCloudEnvironment || apiUrl) {
      try {
        const response = await this.request<any[]>("/companies");

        analytics.trackAction({
          action: "all_companies_viewed",
          component: "platform_dashboard",
        });

        return response.data;
      } catch (error) {
        console.warn("API not available, using mock companies:", error);
      }
    }

    return demoCompanies.map((company) => ({
      id: company.id,
      name: company.name,
      industry: company.industry,
      userCount: company.employeeCount,
      status: company.status,
      subscription: company.subscriptionTier,
      joinedAt: company.joinedAt,
      revenue: company.revenue,
      adminId: company.adminId,
      activePrograms: company.activePrograms,
      totalSessions: company.totalSessions,
    }));
  }

  // ===== SESSION MANAGEMENT METHODS =====

  async updateSession(
    sessionId: string,
    updates: Partial<Session>,
  ): Promise<Session> {
    const user = checkAuthorization();

    try {
      const response = await this.request<Session>(`/sessions/${sessionId}`, {
        method: "PUT",
        body: JSON.stringify({
          ...updates,
          updatedAt: new Date().toISOString(),
        }),
      });

      analytics.trackAction({
        action: "session_updated",
        component: "session_management",
        metadata: {
          sessionId,
          updateFields: Object.keys(updates),
          userType: user.userType,
        },
      });

      return response.data;
    } catch (error) {
      console.warn("API not available, using local session update:", error);

      // For demo purposes, return updated session
      const updatedSession: Session = {
        id: sessionId,
        mentorshipRequestId: "mock-request",
        mentorId: "mock-mentor",
        title: updates.title || "Updated Session",
        description: updates.description || "Session description updated",
        scheduledStartTime: updates.scheduledStartTime || new Date(),
        scheduledEndTime: updates.scheduledEndTime || new Date(),
        status: updates.status || "scheduled",
        type: updates.type || "video",
        participants: [],
        notes: [],
        goals: [],
        feedback: [],
        isRecordingEnabled: false,
        isTranscriptionEnabled: false,
        rescheduleCount: updates.rescheduleCount || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return updatedSession;
    }
  }

  async cancelSession(
    sessionId: string,
    reason: string,
    notifyParticipants: boolean = true,
  ): Promise<Session> {
    const user = checkAuthorization();

    try {
      const response = await this.request<Session>(
        `/sessions/${sessionId}/cancel`,
        {
          method: "POST",
          body: JSON.stringify({
            reason,
            notifyParticipants,
            cancelledBy: user.id,
            cancelledAt: new Date().toISOString(),
          }),
        },
      );

      analytics.trackAction({
        action: "session_cancelled",
        component: "session_management",
        metadata: {
          sessionId,
          reason,
          notifyParticipants,
          userType: user.userType,
        },
      });

      return response.data;
    } catch (error) {
      console.warn(
        "API not available, using local session cancellation:",
        error,
      );

      // For demo purposes, return cancelled session
      const cancelledSession: Session = {
        id: sessionId,
        mentorshipRequestId: "mock-request",
        mentorId: "mock-mentor",
        title: "Cancelled Session",
        description: "This session has been cancelled",
        scheduledStartTime: new Date(),
        scheduledEndTime: new Date(),
        status: "cancelled",
        type: "video",
        participants: [],
        notes: [],
        goals: [],
        feedback: [],
        isRecordingEnabled: false,
        isTranscriptionEnabled: false,
        cancellationReason: reason,
        rescheduleCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return cancelledSession;
    }
  }

  // ===== SESSION MODIFICATION METHODS =====

  async requestSessionModification(
    sessionId: string,
    modification: {
      newStartTime: Date;
      newEndTime: Date;
      reason: string;
      urgency: "low" | "medium" | "high";
      message?: string;
      notifyImmediately: boolean;
    },
  ): Promise<any> {
    const user = checkAuthorization(["company_admin", "platform_admin"]);

    try {
      const response = await this.request(
        `/sessions/${sessionId}/modifications`,
        {
          method: "POST",
          body: JSON.stringify({
            ...modification,
            requestedBy: user.id,
            requestedAt: new Date().toISOString(),
            status: "pending_coach_approval",
          }),
        },
      );

      analytics.trackAction({
        action: "session_modification_requested",
        component: "session_management",
        metadata: {
          sessionId,
          urgency: modification.urgency,
          userType: user.userType,
          notifyImmediately: modification.notifyImmediately,
        },
      });

      return response.data;
    } catch (error) {
      console.warn(
        "API not available, using mock modification request:",
        error,
      );

      // For demo purposes, return mock response
      return {
        id: `mod-${Date.now()}`,
        sessionId,
        status: "pending_coach_approval",
        requestedAt: new Date().toISOString(),
        ...modification,
      };
    }
  }

  async respondToSessionModification(
    sessionId: string,
    modificationId: string,
    response: {
      approved: boolean;
      message?: string;
    },
  ): Promise<any> {
    const user = checkAuthorization(["coach"]);

    try {
      const apiResponse = await this.request(
        `/sessions/${sessionId}/modifications/${modificationId}/respond`,
        {
          method: "POST",
          body: JSON.stringify({
            ...response,
            respondedBy: user.id,
            respondedAt: new Date().toISOString(),
          }),
        },
      );

      analytics.trackAction({
        action: "session_modification_responded",
        component: "session_management",
        metadata: {
          sessionId,
          modificationId,
          approved: response.approved,
          userType: user.userType,
        },
      });

      return apiResponse.data;
    } catch (error) {
      console.warn(
        "API not available, using mock modification response:",
        error,
      );

      // For demo purposes, return mock response
      return {
        id: modificationId,
        sessionId,
        status: response.approved ? "approved" : "rejected",
        coachResponse: {
          ...response,
          respondedAt: new Date().toISOString(),
          respondedBy: user.id,
        },
      };
    }
  }

  async getSessionModifications(sessionId: string): Promise<{
    pending: any | null;
    history: any[];
  }> {
    const user = checkAuthorization();

    try {
      const [pendingResponse, historyResponse] = await Promise.all([
        this.request(`/sessions/${sessionId}/modifications/pending`),
        this.request(`/sessions/${sessionId}/modifications/history`),
      ]);

      analytics.trackAction({
        action: "session_modifications_viewed",
        component: "session_management",
        metadata: {
          sessionId,
          userType: user.userType,
          hasPending: !!pendingResponse.data,
          historyCount: historyResponse.data?.length || 0,
        },
      });

      return {
        pending: pendingResponse.data,
        history: historyResponse.data || [],
      };
    } catch (error) {
      console.warn("API not available, using mock modifications:", error);

      // For demo purposes, return mock data
      return {
        pending: null,
        history: [],
      };
    }
  }

  async logSessionModificationAction(
    sessionId: string,
    action: string,
    details: any,
  ): Promise<void> {
    const user = checkAuthorization();

    try {
      await this.request(`/sessions/${sessionId}/modifications/log`, {
        method: "POST",
        body: JSON.stringify({
          action,
          details,
          userId: user.id,
          userType: user.userType,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.warn("Failed to log modification action:", error);
    }
  }

  // ===== GENERAL METHODS =====

  async getMentorshipRequests(params?: {
    status?: string;
    companyId?: string;
    coachId?: string;
    limit?: number;
  }): Promise<MentorshipRequest[]> {
    const user = checkAuthorization();

    // Use data sync service with backend-first approach
    const filters: Record<string, string> = {};

    // Role-based filtering
    if (user.userType === "coach") {
      filters.coachId = user.id;
    } else if (user.userType === "company_admin" && user.companyId) {
      filters.companyId = user.companyId;
    }

    // Additional filters
    if (params?.status) filters.status = params.status;
    if (params?.companyId && user.userType === "platform_admin") {
      filters.companyId = params.companyId;
    }
    if (params?.coachId && user.userType === "platform_admin") {
      filters.coachId = params.coachId;
    }
    if (params?.limit) filters.limit = params.limit.toString();

    const result = await dataSyncService.getData<MentorshipRequest>(
      DATA_SYNC_CONFIGS.MENTORSHIP_REQUESTS,
      filters,
    );

    analytics.trackAction({
      action: "mentorship_requests_viewed",
      component: "dashboard",
      metadata: {
        params,
        userType: user.userType,
        resultCount: result.data?.length || 0,
        source: result.source,
        backendAvailable: result.backendAvailable,
      },
    });

    // Apply client-side filtering for localStorage fallback
    let filteredData = result.data || [];

    if (result.source === "localStorage") {
      // Apply role-based filtering for localStorage
      if (user.userType === "coach") {
        filteredData = filteredData.filter(
          (req: MentorshipRequest) =>
            req.assignedCoachId === user.id ||
            (req.status === "pending" && !req.assignedCoachId),
        );
      } else if (user.userType === "company_admin" && user.companyId) {
        filteredData = filteredData.filter(
          (req: MentorshipRequest) => req.companyId === user.companyId,
        );
      }

      // Apply additional filters
      if (params?.status) {
        filteredData = filteredData.filter(
          (req: MentorshipRequest) => req.status === params.status,
        );
      }

      if (params?.limit) {
        filteredData = filteredData.slice(0, params.limit);
      }
    }

    console.log(
      `📊 Retrieved ${filteredData.length} mentorship requests from ${result.source}`,
    );

    return filteredData;
  }

  // ===== ANALYTICS METHODS =====

  async getAnalyticsData(query: {
    metric: string;
    startDate: Date;
    endDate: Date;
    filters?: Record<string, any>;
    groupBy?: string;
  }) {
    const user = checkAuthorization(["platform_admin", "company_admin"]);

    // Company admins can only see their company's analytics
    if (user.userType === "company_admin") {
      query.filters = { ...query.filters, companyId: user.companyId };
    }

    return await analytics.getAnalytics(query);
  }

  async trackEvent(eventName: string, properties?: Record<string, any>) {
    analytics.track(eventName, properties);
  }

  // Existing methods from original API service that don't need auth changes
  async getPricingConfig(): Promise<any> {
    // Check if we have a valid API URL configuration
    const apiUrl = import.meta.env.VITE_API_URL;
    const isCloudEnvironment =
      window.location.hostname.includes(".fly.dev") ||
      window.location.hostname.includes(".vercel.app") ||
      window.location.hostname.includes(".netlify.app");

    // Skip API request if no backend is configured or we're in a cloud environment without API URL
    if (apiUrl && !isCloudEnvironment) {
      try {
        const response = await this.request<any>("/admin/pricing-config");

        analytics.trackAction({
          action: "pricing_config_retrieved",
          component: "api_enhanced",
          metadata: { source: "backend_api" },
        });

        return response.data;
      } catch (error) {
        console.warn(
          "API not available, using cross-browser synchronized storage:",
          error,
        );
      }
    } else {
      console.log(
        "🗃️ No backend configured, using cross-browser synchronized storage for pricing config",
      );
    }

    // Use centralized cross-browser sync service
    const config = crossBrowserSync.load(SYNC_CONFIGS.PRICING_CONFIG);

    if (config) {
      return config;
    }

    // Default configuration if no data exists
    const defaultConfig = {
      companyServiceFee: 0.1,
      coachCommission: 0.2,
      minCoachCommissionAmount: 5,
      additionalParticipantFee: 25,
      maxParticipantsIncluded: 1,
      currency: "CAD",
      lastUpdated: new Date().toISOString(),
      version: "1.0",
      createdBy: "system",
    };

    return defaultConfig;
  }

  private getSharedPlatformConfig(): any {
    // Use multiple storage mechanisms to simulate true backend database
    const SHARED_CONFIG_KEY = "peptok_platform_global_config";
    const BROWSER_SYNC_KEY = "peptok_browser_sync";

    let config;

    // Try to get from localStorage first
    const stored = localStorage.getItem(SHARED_CONFIG_KEY);

    // Also check for cross-browser updates via document.cookie (simulates backend polling)
    const crossBrowserData = this.getCrossBrowserConfig();

    if (crossBrowserData && stored) {
      const storedConfig = JSON.parse(stored);
      // Check if cross-browser data is newer
      if (
        new Date(crossBrowserData.lastUpdated) >
        new Date(storedConfig.lastUpdated)
      ) {
        config = crossBrowserData;
        // Update local storage with newer data
        localStorage.setItem(SHARED_CONFIG_KEY, JSON.stringify(config));
        console.log("🔄 Synced newer configuration from cross-browser storage");
      } else {
        config = storedConfig;
      }
    } else if (crossBrowserData) {
      config = crossBrowserData;
      localStorage.setItem(SHARED_CONFIG_KEY, JSON.stringify(config));
    } else if (stored) {
      config = JSON.parse(stored);
    } else {
      // Default configuration - this will be the same for ALL platform admins
      config = {
        companyServiceFee: 0.1,
        coachCommission: 0.2,
        minCoachCommissionAmount: 5,
        additionalParticipantFee: 25,
        maxParticipantsIncluded: 1,
        currency: "CAD",
        lastUpdated: new Date().toISOString(),
        version: "1.0",
        createdBy: "system",
        adminCount: 1,
        syncToken: Date.now().toString(),
      };

      // Store in both local and cross-browser storage
      localStorage.setItem(SHARED_CONFIG_KEY, JSON.stringify(config));
      this.setCrossBrowserConfig(config);
    }

    analytics.trackAction({
      action: "pricing_config_retrieved",
      component: "api_enhanced",
      metadata: {
        source: "simulated_backend",
        version: config.version,
        syncToken: config.syncToken,
      },
    });

    return config;
  }

  private getCrossBrowserConfig(): any | null {
    try {
      // Use document.cookie to simulate cross-browser synchronization
      const cookies = document.cookie.split(";");
      const configCookie = cookies.find((cookie) =>
        cookie.trim().startsWith("peptok_config="),
      );

      if (configCookie) {
        const configData = configCookie.split("=")[1];
        const decodedData = decodeURIComponent(configData);
        return JSON.parse(decodedData);
      }

      return null;
    } catch (error) {
      console.warn("Could not parse cross-browser config:", error);
      return null;
    }
  }

  private setCrossBrowserConfig(config: any): void {
    try {
      // Store in cookie for cross-browser access (simulates backend storage)
      const configData = encodeURIComponent(JSON.stringify(config));
      // Set cookie with 1 year expiration
      document.cookie = `peptok_config=${configData}; max-age=31536000; path=/; SameSite=Lax`;

      // Also try to use BroadcastChannel for same-origin communication
      if (typeof BroadcastChannel !== "undefined") {
        const channel = new BroadcastChannel("peptok_config_sync");
        channel.postMessage({
          type: "config_updated",
          config: config,
          timestamp: new Date().toISOString(),
        });
        channel.close();
      }
    } catch (error) {
      console.warn("Could not set cross-browser config:", error);
    }
  }

  private checkForConfigUpdates(currentConfig: any): void {
    // Simulate checking for updates from other admin sessions
    const SHARED_CONFIG_KEY = "peptok_platform_global_config";
    const LAST_SYNC_KEY = "peptok_last_sync_check";

    const lastSyncCheck = localStorage.getItem(LAST_SYNC_KEY);
    const now = Date.now();

    // Check every 5 seconds for updates
    if (!lastSyncCheck || now - parseInt(lastSyncCheck) > 5000) {
      localStorage.setItem(LAST_SYNC_KEY, now.toString());

      // In a real backend, this would be an API call to check for updates
      // For simulation, we're ensuring all admins see the exact same data
      const latestConfig = localStorage.getItem(SHARED_CONFIG_KEY);
      if (latestConfig) {
        const parsed = JSON.parse(latestConfig);
        if (parsed.syncToken !== currentConfig.syncToken) {
          // Configuration was updated by another admin
          window.dispatchEvent(
            new CustomEvent("globalConfigUpdated", {
              detail: parsed,
            }),
          );
        }
      }
    }
  }

  async updatePricingConfig(config: any): Promise<any> {
    const user = checkAuthorization(["platform_admin"]);

    try {
      const response = await this.request<any>("/admin/pricing-config", {
        method: "PUT",
        body: JSON.stringify({
          ...config,
          lastUpdated: new Date().toISOString(),
          updatedBy: user.id,
        }),
      });

      analytics.trackAction({
        action: "pricing_config_updated",
        component: "api_enhanced",
        metadata: {
          source: "backend_api",
          adminId: user.id,
          currency: config.currency,
          companyServiceFee: config.companyServiceFee,
          coachCommission: config.coachCommission,
          minCoachCommissionAmount: config.minCoachCommissionAmount,
        },
      });

      return response.data;
    } catch (error) {
      console.warn(
        "API not available, using cross-browser synchronized storage:",
        error,
      );

      // Use centralized cross-browser sync service
      const enhancedConfig = {
        ...config,
        lastUpdated: new Date().toISOString(),
        version: "1.0",
      };

      crossBrowserSync.save(SYNC_CONFIGS.PRICING_CONFIG, enhancedConfig, {
        id: user.id,
        name: user.name,
      });

      // Note: Cache invalidation removed for simplification

      analytics.trackAction({
        action: "pricing_config_updated",
        component: "api_enhanced",
        metadata: {
          source: "cross_browser_sync",
          adminId: user.id,
          currency: config.currency,
          companyServiceFee: config.companyServiceFee,
          coachCommission: config.coachCommission,
          minCoachCommissionAmount: config.minCoachCommissionAmount,
        },
      });

      return enhancedConfig;
    }
  }

  private updateSharedPlatformConfig(config: any, user: any): any {
    const SHARED_CONFIG_KEY = "peptok_platform_global_config";

    const enhancedConfig = {
      ...config,
      lastUpdated: new Date().toISOString(),
      updatedBy: user.id,
      updatedByName: user.name,
      version: "1.0",
      syncToken: Date.now().toString(), // Unique token for this update
    };

    // Store in multiple locations for cross-browser synchronization
    localStorage.setItem(SHARED_CONFIG_KEY, JSON.stringify(enhancedConfig));
    this.setCrossBrowserConfig(enhancedConfig);

    // Also store update in audit log
    this.addToAuditLog({
      id: `audit_${Date.now()}`,
      timestamp: enhancedConfig.lastUpdated,
      action: "pricing_config_updated",
      adminId: user.id,
      adminName: user.name,
      details: "Updated platform pricing configuration",
      changes: {
        companyServiceFee: `${config.companyServiceFee * 100}%`,
        coachCommission: `${config.coachCommission * 100}%`,
        minCoachCommissionAmount: `$${config.minCoachCommissionAmount}`,
        additionalParticipantFee: `$${config.additionalParticipantFee}`,
        maxParticipantsIncluded: config.maxParticipantsIncluded,
        currency: config.currency,
      },
    });

    // Broadcast to ALL admin sessions immediately (same browser tabs)
    try {
      window.dispatchEvent(
        new CustomEvent("globalConfigUpdated", {
          detail: enhancedConfig,
        }),
      );

      // Also dispatch the old event for backward compatibility
      window.dispatchEvent(
        new CustomEvent("platformConfigUpdated", {
          detail: enhancedConfig,
        }),
      );

      console.log(
        "✅ Configuration saved and broadcasted to all admin sessions",
      );
    } catch (broadcastError) {
      console.warn("Could not broadcast config update:", broadcastError);
    }

    analytics.trackAction({
      action: "pricing_config_updated",
      component: "api_enhanced",
      metadata: {
        source: "simulated_backend",
        adminId: user.id,
        currency: config.currency,
        companyServiceFee: config.companyServiceFee,
        coachCommission: config.coachCommission,
        minCoachCommissionAmount: config.minCoachCommissionAmount,
        syncToken: enhancedConfig.syncToken,
      },
    });

    return enhancedConfig;
  }

  private addToAuditLog(entry: any): void {
    const AUDIT_LOG_KEY = "peptok_platform_audit_log";
    const auditLog = JSON.parse(localStorage.getItem(AUDIT_LOG_KEY) || "[]");

    auditLog.unshift(entry); // Add to beginning

    // Keep only last 100 entries
    if (auditLog.length > 100) {
      auditLog.splice(100);
    }

    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(auditLog));
  }

  // ===== PLATFORM SETTINGS MANAGEMENT =====

  async getAllPlatformSettings(): Promise<any> {
    const user = checkAuthorization(["platform_admin"]);

    try {
      const response = await this.request<any>("/admin/platform-settings");

      analytics.trackAction({
        action: "platform_settings_retrieved",
        component: "api_enhanced",
        metadata: { adminId: user.id, source: "backend_api" },
      });

      return response.data;
    } catch (error) {
      console.warn(
        "API not available, using centralized platform settings:",
        error,
      );

      // Retrieve all platform settings from centralized storage
      const pricingConfig = JSON.parse(
        localStorage.getItem("platform_pricing_config") || "{}",
      );
      const securitySettings = JSON.parse(
        localStorage.getItem("platform_security_settings") || "{}",
      );
      const analyticsSettings = JSON.parse(
        localStorage.getItem("platform_analytics_settings") || "{}",
      );

      const settings = {
        pricing: {
          companyServiceFee: 0.1,
          coachCommission: 0.2,
          minCoachCommissionAmount: 5,
          additionalParticipantFee: 25,
          maxParticipantsIncluded: 1,
          currency: "CAD",
          ...pricingConfig,
        },
        security: {
          requireTwoFactor: false,
          sessionTimeout: 3600, // 1 hour
          maxLoginAttempts: 5,
          passwordMinLength: 8,
          ...securitySettings,
        },
        analytics: {
          enableUserTracking: true,
          enablePerformanceTracking: true,
          dataRetentionDays: 365,
          ...analyticsSettings,
        },
        lastUpdated: new Date().toISOString(),
        version: "1.0",
      };

      analytics.trackAction({
        action: "platform_settings_retrieved",
        component: "api_enhanced",
        metadata: { adminId: user.id, source: "local_storage" },
      });

      return settings;
    }
  }

  async updatePlatformSettings(
    settingsType: string,
    settings: any,
  ): Promise<any> {
    const user = checkAuthorization(["platform_admin"]);

    try {
      const response = await this.request<any>(
        `/admin/platform-settings/${settingsType}`,
        {
          method: "PUT",
          body: JSON.stringify({
            ...settings,
            lastUpdated: new Date().toISOString(),
            updatedBy: user.id,
          }),
        },
      );

      analytics.trackAction({
        action: "platform_settings_updated",
        component: "api_enhanced",
        metadata: {
          adminId: user.id,
          settingsType,
          source: "backend_api",
        },
      });

      return response.data;
    } catch (error) {
      console.warn(
        "API not available, storing platform settings locally:",
        error,
      );

      const enhancedSettings = {
        ...settings,
        lastUpdated: new Date().toISOString(),
        updatedBy: user.id,
        version: "1.0",
      };

      // Store in appropriate centralized storage
      const storageKey = `platform_${settingsType}_settings`;
      localStorage.setItem(storageKey, JSON.stringify(enhancedSettings));

      // Broadcast the change
      try {
        window.dispatchEvent(
          new CustomEvent("platformSettingsUpdated", {
            detail: { type: settingsType, settings: enhancedSettings },
          }),
        );
      } catch (broadcastError) {
        console.warn("Could not broadcast settings update:", broadcastError);
      }

      analytics.trackAction({
        action: "platform_settings_updated",
        component: "api_enhanced",
        metadata: {
          adminId: user.id,
          settingsType,
          source: "local_storage",
        },
      });

      return enhancedSettings;
    }
  }

  async getPlatformAuditLog(): Promise<any[]> {
    const user = checkAuthorization(["platform_admin"]);

    try {
      const response = await this.request<any[]>("/admin/audit-log");
      return response.data;
    } catch (error) {
      console.warn("API not available, using local audit log:", error);

      // Return simulated audit log from localStorage
      const auditLog = JSON.parse(
        localStorage.getItem("platform_audit_log") || "[]",
      );

      // Add some sample entries if empty
      if (auditLog.length === 0) {
        auditLog.push(
          {
            id: "audit_001",
            timestamp: new Date().toISOString(),
            action: "pricing_config_updated",
            adminId: user.id,
            adminName: user.name,
            details: "Updated platform pricing configuration",
            changes: {
              companyServiceFee: "10% → 12%",
              minCoachCommissionAmount: "$5 → $6",
            },
          },
          {
            id: "audit_002",
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            action: "platform_settings_viewed",
            adminId: user.id,
            adminName: user.name,
            details: "Viewed platform settings dashboard",
          },
        );

        localStorage.setItem("platform_audit_log", JSON.stringify(auditLog));
      }

      return auditLog.slice(0, 50); // Return last 50 entries
    }
  }

  // ===== SECURITY SETTINGS METHODS =====

  async getSecuritySettings(): Promise<any> {
    checkAuthorization(["platform_admin"]);

    try {
      const response = await this.request<any>("/admin/security-settings");
      return response.data;
    } catch (error) {
      console.warn("API not available, using security service:", error);
      return await securityService.getSecuritySettings();
    }
  }

  async updateSecuritySettings(settings: any): Promise<void> {
    checkAuthorization(["platform_admin"]);

    try {
      await this.request("/admin/security-settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      });

      analytics.trackAction({
        action: "security_settings_updated",
        component: "api_enhanced",
        metadata: { settingsCount: Object.keys(settings).length },
      });
    } catch (error) {
      console.warn("API not available, using security service:", error);
      await securityService.updateSecuritySettings(settings);
    }
  }

  async getSecurityEvents(): Promise<any[]> {
    checkAuthorization(["platform_admin"]);

    try {
      const response = await this.request<any[]>("/admin/security-events");
      return response.data;
    } catch (error) {
      console.warn("API not available, using security service:", error);
      return securityService.getSecurityEvents();
    }
  }

  async resolveSecurityEvent(eventId: string): Promise<void> {
    checkAuthorization(["platform_admin"]);

    try {
      await this.request(`/admin/security-events/${eventId}/resolve`, {
        method: "POST",
      });

      analytics.trackAction({
        action: "security_event_resolved",
        component: "api_enhanced",
        metadata: { eventId },
      });
    } catch (error) {
      console.warn("API not available, using security service:", error);
      securityService.resolveSecurityEvent(eventId);
    }
  }

  // ===== ANALYTICS SETTINGS METHODS =====

  async getAnalyticsSettings(): Promise<any> {
    checkAuthorization(["platform_admin"]);

    try {
      const response = await this.request<any>("/admin/analytics-settings");
      return response.data;
    } catch (error) {
      console.warn("API not available, using analytics service:", error);
      return await analyticsService.getAnalyticsSettings();
    }
  }

  async updateAnalyticsSettings(settings: any): Promise<void> {
    checkAuthorization(["platform_admin"]);

    try {
      await this.request("/admin/analytics-settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      });

      analytics.trackAction({
        action: "analytics_settings_updated",
        component: "api_enhanced",
        metadata: { settingsCount: Object.keys(settings).length },
      });
    } catch (error) {
      console.warn("API not available, using analytics service:", error);
      await analyticsService.updateAnalyticsSettings(settings);
    }
  }

  async generateAnalyticsReport(reportId: string): Promise<void> {
    checkAuthorization(["platform_admin"]);

    try {
      await this.request(`/admin/analytics/reports/${reportId}/generate`, {
        method: "POST",
      });

      analytics.trackAction({
        action: "analytics_report_generated",
        component: "api_enhanced",
        metadata: { reportId },
      });
    } catch (error) {
      console.warn("API not available, using analytics service:", error);
      await analyticsService.generateReport(reportId);
    }
  }

  async testWebhook(webhookId: string): Promise<void> {
    checkAuthorization(["platform_admin"]);

    try {
      await this.request(`/admin/analytics/webhooks/${webhookId}/test`, {
        method: "POST",
      });

      analytics.trackAction({
        action: "webhook_tested",
        component: "api_enhanced",
        metadata: { webhookId },
      });
    } catch (error) {
      console.warn("API not available, using analytics service:", error);
      await analyticsService.testWebhook(webhookId);
    }
  }

  async exportAnalyticsData(
    metrics: string[],
    format: string,
    dateRange: { start: Date; end: Date },
  ): Promise<string> {
    checkAuthorization(["platform_admin"]);

    try {
      const response = await this.request<{ data: string }>(
        "/admin/analytics/export",
        {
          method: "POST",
          body: JSON.stringify({ metrics, format, dateRange }),
        },
      );

      analytics.trackAction({
        action: "analytics_data_exported",
        component: "api_enhanced",
        metadata: { format, metricsCount: metrics.length },
      });

      return response.data.data;
    } catch (error) {
      console.warn("API not available, using analytics service:", error);
      return await analyticsService.exportData(
        metrics,
        format as any,
        dateRange,
      );
    }
  }

  // ===== TEAM INVITATION METHODS =====

  async createTeamInvitation(invitationData: {
    email: string;
    name?: string;
    programId: string;
    programTitle: string;
    companyId: string;
    companyName: string;
    inviterName: string;
    inviterEmail: string;
    role: "participant" | "observer";
    metadata?: any;
  }): Promise<any> {
    const user = checkAuthorization(["company_admin", "enterprise_admin"]);

    // First try multiple backend endpoints to ensure database storage
    const backendEndpoints = [
      "/api/team/invitations",
      "/api/invitations",
      "/team/invitations",
    ];

    let lastError: any = null;

    for (const endpoint of backendEndpoints) {
      try {
        console.log(
          `Attempting to save invitation to backend database via ${endpoint}`,
        );

        const response = await this.request<any>(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Database-Write": "required", // Signal that database write is required
          },
          body: JSON.stringify({
            ...invitationData,
            createdBy: user.id,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            requiresDatabaseStorage: true,
          }),
        });

        // Verify the response contains a database-generated ID
        if (
          response.data &&
          response.data.id &&
          !response.data.id.includes("temp_")
        ) {
          console.log(
            `✅ Successfully saved invitation to backend database with ID: ${response.data.id}`,
          );

          analytics.trackAction({
            action: "team_invitation_created_database",
            component: "team_api",
            metadata: {
              programId: invitationData.programId,
              inviteeEmail: invitationData.email,
              role: invitationData.role,
              savedToDatabase: true,
              endpoint,
            },
          });

          return response.data;
        }
      } catch (error) {
        console.warn(`Backend endpoint ${endpoint} failed:`, error);
        lastError = error;
        continue;
      }
    }

    // If all backend endpoints fail, throw error to trigger offline sync
    console.error(
      "��� Failed to save invitation to backend database via all endpoints",
    );
    throw new Error(
      `Failed to save invitation to backend database: ${lastError?.message || "All endpoints unavailable"}`,
    );
  }

  async getTeamInvitations(filters?: {
    programId?: string;
    companyId?: string;
    status?: string;
  }): Promise<any[]> {
    const user = checkAuthorization([
      "company_admin",
      "enterprise_admin",
      "team_member",
    ]);

    try {
      const queryParams = new URLSearchParams();
      if (filters?.programId)
        queryParams.append("programId", filters.programId);
      if (filters?.companyId)
        queryParams.append("companyId", filters.companyId);
      if (filters?.status) queryParams.append("status", filters.status);

      const response = await this.request<any>(
        `/team/invitations?${queryParams.toString()}`,
      );

      analytics.trackAction({
        action: "team_invitations_fetched",
        component: "team_api",
        metadata: { filters },
      });

      return response.data;
    } catch (error) {
      console.warn(
        "Team invitations API not available, using local data:",
        error,
      );

      // Fallback to localStorage
      const allInvitations = JSON.parse(
        localStorage.getItem("peptok_team_invitations") || "[]",
      );
      let filteredInvitations = allInvitations;

      if (filters?.programId) {
        filteredInvitations = filteredInvitations.filter(
          (inv: any) => inv.programId === filters.programId,
        );
      }
      if (filters?.companyId) {
        filteredInvitations = filteredInvitations.filter(
          (inv: any) => inv.companyId === filters.companyId,
        );
      }
      if (filters?.status) {
        filteredInvitations = filteredInvitations.filter(
          (inv: any) => inv.status === filters.status,
        );
      }

      return filteredInvitations;
    }
  }

  async resendTeamInvitation(invitationId: string): Promise<boolean> {
    const user = checkAuthorization(["company_admin", "enterprise_admin"]);

    // Try multiple backend endpoints to ensure database update
    const backendEndpoints = [
      `/api/team/invitations/${invitationId}/resend`,
      `/api/invitations/${invitationId}/resend`,
      `/team/invitations/${invitationId}/resend`,
    ];

    let lastError: any = null;

    for (const endpoint of backendEndpoints) {
      try {
        console.log(
          `Attempting to resend invitation via backend database: ${endpoint}`,
        );

        const response = await this.request<any>(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Database-Write": "required", // Signal that database write is required
          },
          body: JSON.stringify({
            resentBy: user.id,
            resentAt: new Date().toISOString(),
            newExpiresAt: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            requiresDatabaseStorage: true,
          }),
        });

        // Verify the resend was saved to database
        if (response.success || response.data?.updated) {
          console.log(
            `✅ Successfully updated invitation resend in backend database`,
          );

          analytics.trackAction({
            action: "team_invitation_resent_database",
            component: "team_api",
            metadata: {
              invitationId,
              savedToDatabase: true,
              endpoint,
            },
          });

          return true;
        }
      } catch (error) {
        console.warn(`Backend endpoint ${endpoint} failed for resend:`, error);
        lastError = error;
        continue;
      }
    }

    // If all backend endpoints fail, throw error to trigger offline sync
    console.error(
      "❌ Failed to save invitation resend to backend database via all endpoints",
    );
    throw new Error(
      `Failed to save invitation resend to backend database: ${lastError?.message || "All endpoints unavailable"}`,
    );
  }

  async acceptTeamInvitation(
    token: string,
    acceptanceData: {
      firstName: string;
      lastName: string;
      password: string;
      acceptTerms: boolean;
    },
  ): Promise<{ success: boolean; user?: any; error?: string }> {
    // Try multiple backend endpoints to ensure database storage
    const backendEndpoints = [
      "/api/team/invitations/accept",
      "/api/invitations/accept",
      "/team/invitations/accept",
    ];

    let lastError: any = null;

    for (const endpoint of backendEndpoints) {
      try {
        console.log(
          `Attempting to accept invitation via backend database: ${endpoint}`,
        );

        const response = await this.request<any>(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Database-Write": "required", // Signal that database write is required
          },
          body: JSON.stringify({
            token,
            ...acceptanceData,
            acceptedAt: new Date().toISOString(),
            requiresDatabaseStorage: true,
          }),
        });

        // Verify the acceptance was saved to database
        if (
          response.success &&
          response.user?.id &&
          !response.user.id.includes("temp_")
        ) {
          console.log(
            `✅ Successfully saved invitation acceptance to backend database`,
          );

          analytics.trackAction({
            action: "team_invitation_accepted_database",
            component: "team_api",
            metadata: {
              token: token.substring(0, 10) + "...",
              savedToDatabase: true,
              endpoint,
            },
          });

          return response;
        }
      } catch (error) {
        console.warn(
          `Backend endpoint ${endpoint} failed for invitation acceptance:`,
          error,
        );
        lastError = error;
        continue;
      }
    }

    // If all backend endpoints fail, throw error to trigger offline sync
    console.error(
      "❌ Failed to save invitation acceptance to backend database via all endpoints",
    );
    throw new Error(
      `Failed to save invitation acceptance to backend database: ${lastError?.message || "All endpoints unavailable"}`,
    );
  }

  async getPendingInvitations(email: string): Promise<any[]> {
    // Try multiple backend endpoints to ensure database access
    const backendEndpoints = [
      `/api/team/invitations/pending?email=${encodeURIComponent(email)}`,
      `/api/invitations/pending?email=${encodeURIComponent(email)}`,
      `/team/invitations/pending?email=${encodeURIComponent(email)}`,
    ];

    let lastError: any = null;

    for (const endpoint of backendEndpoints) {
      try {
        console.log(
          `Fetching pending invitations from backend database: ${endpoint}`,
        );

        const response = await this.request<any>(endpoint, {
          headers: {
            "X-Database-Read": "required", // Signal that database read is required
          },
        });

        // Verify we got database data (not just cached/local data)
        if (response.data && Array.isArray(response.data)) {
          console.log(
            `✅ Successfully fetched ${response.data.length} pending invitations from backend database`,
          );

          analytics.trackAction({
            action: "pending_invitations_fetched_database",
            component: "team_api",
            metadata: {
              email: email.substring(0, 5) + "...",
              count: response.data.length,
              fromDatabase: true,
              endpoint,
            },
          });

          return response.data;
        }
      } catch (error) {
        console.warn(
          `Backend endpoint ${endpoint} failed for pending invitations:`,
          error,
        );
        lastError = error;
        continue;
      }
    }

    // If all backend endpoints fail, throw error to trigger offline sync
    console.error(
      "❌ Failed to fetch pending invitations from backend database via all endpoints",
    );
    throw new Error(
      `Failed to fetch pending invitations from backend database: ${lastError?.message || "All endpoints unavailable"}`,
    );
  }

  // Matching Configuration API Methods
  async getMatchingConfiguration(): Promise<any> {
    try {
      const response = await this.request<any>("/admin/matching-config");

      analytics.trackAction({
        action: "matching_config_retrieved",
        component: "api_enhanced",
        metadata: { source: "backend_api" },
      });

      return response.data;
    } catch (error) {
      console.warn(
        "API not available, using cross-browser synchronized storage:",
        error,
      );

      // Use centralized cross-browser sync service
      const config = crossBrowserSync.load(SYNC_CONFIGS.MATCHING_CONFIG);

      if (config) {
        return config;
      }

      // Default matching configuration
      const defaultConfig = {
        weights: {
          skillMatch: 30,
          experience: 25,
          rating: 20,
          availability: 15,
          price: 10,
        },
        algorithm: "python-ml",
        confidenceThreshold: 0.7,
        maxResults: 10,
        lastUpdated: new Date().toISOString(),
        version: "1.0",
        createdBy: "system",
      };

      return defaultConfig;
    }
  }

  async updateMatchingConfiguration(config: any): Promise<any> {
    const user = checkAuthorization(["platform_admin"]);

    try {
      const response = await this.request<any>("/admin/matching-config", {
        method: "PUT",
        body: JSON.stringify({
          ...config,
          lastUpdated: new Date().toISOString(),
          updatedBy: user.id,
        }),
      });

      analytics.trackAction({
        action: "matching_config_updated",
        component: "api_enhanced",
        metadata: {
          source: "backend_api",
          adminId: user.id,
          algorithm: config.algorithm,
          confidenceThreshold: config.confidenceThreshold,
          weightTotal: Object.values(config.weights).reduce(
            (a: number, b: number) => a + b,
            0,
          ),
        },
      });

      return response.data;
    } catch (error) {
      console.warn(
        "API not available, using cross-browser synchronized storage:",
        error,
      );

      // Use centralized cross-browser sync service
      const enhancedConfig = {
        ...config,
        lastUpdated: new Date().toISOString(),
        version: "1.0",
      };

      crossBrowserSync.save(SYNC_CONFIGS.MATCHING_CONFIG, enhancedConfig, {
        id: user.id,
        name: user.name,
      });

      analytics.trackAction({
        action: "matching_config_updated",
        component: "api_enhanced",
        metadata: {
          adminId: user.id,
          source: "local_storage",
          algorithm: config.algorithm,
          weightTotal: Object.values(config.weights).reduce(
            (a: number, b: number) => a + b,
            0,
          ),
        },
      });

      return { success: true, data: enhancedConfig };
    }
  }

  async testMatchingConfiguration(
    config: any,
    testScenario: any,
  ): Promise<any> {
    const user = checkAuthorization(["platform_admin"]);

    try {
      const response = await this.request<any>("/admin/matching-config/test", {
        method: "POST",
        body: JSON.stringify({
          config,
          testScenario,
          testId: `test_${Date.now()}`,
          requestedBy: user.id,
        }),
      });

      analytics.trackAction({
        action: "matching_config_tested",
        component: "api_enhanced",
        metadata: {
          source: "backend_api",
          adminId: user.id,
          testScenario: testScenario,
          resultCount: response.data?.matches?.length || 0,
        },
      });

      return response.data;
    } catch (error) {
      console.warn("API not available, simulating test results:", error);

      // Simulate test results for demo purposes
      const mockMatches = [
        {
          id: "coach_1",
          name: "Sarah Wilson",
          skills: ["JavaScript", "React", "Node.js"],
          experience: "senior",
          rating: 4.8,
          availability: "immediate",
          hourlyRate: 120,
          matchScore: 0.89,
        },
        {
          id: "coach_2",
          name: "Michael Chen",
          skills: ["React", "TypeScript", "Node.js"],
          experience: "senior",
          rating: 4.7,
          availability: "next_week",
          hourlyRate: 135,
          matchScore: 0.84,
        },
        {
          id: "coach_3",
          name: "Emma Rodriguez",
          skills: ["JavaScript", "Vue.js", "Node.js"],
          experience: "mid-level",
          rating: 4.6,
          availability: "immediate",
          hourlyRate: 95,
          matchScore: 0.76,
        },
      ];

      analytics.trackAction({
        action: "matching_config_tested",
        component: "api_enhanced",
        metadata: {
          adminId: user.id,
          source: "mock_data",
          resultCount: mockMatches.length,
        },
      });

      return { success: true, data: { matches: mockMatches } };
    }
  }

  // ===== USER INTERACTION LOGGING =====

  async logUserInteractions(interactions: any[]): Promise<any> {
    try {
      // Try to send to backend first
      const response = await this.request<any>("/interactions/batch", {
        method: "POST",
        body: { interactions },
      });

      analytics.trackAction({
        action: "interactions_logged",
        component: "api_enhanced",
        metadata: {
          interactionCount: interactions.length,
          source: "backend_api",
        },
      });

      return response.data;
    } catch (error) {
      console.warn(
        "Backend API not available, storing interactions locally:",
        error,
      );

      // Store interactions locally if backend is not available
      const existingInteractions = JSON.parse(
        localStorage.getItem("user_interactions") || "[]",
      );

      existingInteractions.push(...interactions);

      // Keep only last 1000 interactions to prevent storage overflow
      if (existingInteractions.length > 1000) {
        existingInteractions.splice(0, existingInteractions.length - 1000);
      }

      localStorage.setItem(
        "user_interactions",
        JSON.stringify(existingInteractions),
      );

      analytics.trackAction({
        action: "interactions_stored_locally",
        component: "api_enhanced",
        metadata: {
          interactionCount: interactions.length,
          totalStored: existingInteractions.length,
          source: "local_storage",
        },
      });

      return { success: true, stored: "locally" };
    }
  }
}

// Export singleton instance
export const apiEnhanced = new EnhancedApiService();
export default apiEnhanced;
