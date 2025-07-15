/**
 * Enhanced API Service - Production version without demo data
 *
 * This service provides all the functionality from apiEnhanced.ts
 * but uses the backend API instead of demo data.
 */

import {
  MentorshipRequest,
  CoachingRequest,
  SubscriptionTier,
  SessionPricingTier,
  CoachSessionLimits,
  User,
} from "../types";
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
import api from "./api";
import { analytics } from "./analytics";

// User context for authorization
let currentUser: User | null = null;

export const setCurrentUser = (user: User | null) => {
  currentUser = user;

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

// Enhanced API Service Class
export class ApiService {
  // ===== AUTHENTICATION & USER MANAGEMENT =====

  async getCurrentUser(): Promise<User | null> {
    return currentUser;
  }

  async getUsers(filters?: Record<string, any>): Promise<User[]> {
    checkAuthorization(["platform_admin", "company_admin"]);
    return api.users.getUsers(filters);
  }

  async getUser(userId: string): Promise<User> {
    checkAuthorization(["platform_admin", "company_admin"], userId);
    return api.users.getUser(userId);
  }

  async updateUser(userId: string, userData: Partial<User>): Promise<User> {
    checkAuthorization(["platform_admin", "company_admin"], userId);
    return api.users.updateUser(userId, userData);
  }

  // ===== COMPANY MANAGEMENT =====

  async getCompanies(): Promise<any[]> {
    checkAuthorization(["platform_admin"]);
    return api.companies.getCompanies();
  }

  async getCompany(companyId: string): Promise<any> {
    checkAuthorization(["platform_admin", "company_admin"], companyId);
    return api.companies.getCompany(companyId);
  }

  async getCompanyDashboardMetrics(companyId?: string): Promise<any> {
    const user = checkAuthorization(["company_admin", "platform_admin"]);
    const targetCompanyId = companyId || user.companyId;

    if (!targetCompanyId) {
      throw new Error("Company ID is required");
    }

    return api.companies.getDashboardMetrics(targetCompanyId);
  }

  async getCompanyProgramStats(companyId?: string): Promise<any> {
    const user = checkAuthorization(["company_admin", "platform_admin"]);
    const targetCompanyId = companyId || user.companyId;

    if (!targetCompanyId) {
      throw new Error("Company ID is required");
    }

    return api.companies.getProgramStats(targetCompanyId);
  }

  async getCompanySessionStats(companyId?: string): Promise<any> {
    const user = checkAuthorization(["company_admin", "platform_admin"]);
    const targetCompanyId = companyId || user.companyId;

    if (!targetCompanyId) {
      throw new Error("Company ID is required");
    }

    return api.companies.getSessionStats(targetCompanyId);
  }

  // ===== COACH MANAGEMENT =====

  async getCoaches(filters?: Record<string, any>): Promise<Coach[]> {
    return api.coaches.getCoaches(filters);
  }

  async searchCoaches(searchParams: Record<string, any>): Promise<Coach[]> {
    return api.coaches.searchCoaches(searchParams);
  }

  async getCoach(coachId: string): Promise<Coach> {
    return api.coaches.getCoach(coachId);
  }

  async updateCoachProfile(coachId: string, profileData: any): Promise<any> {
    checkAuthorization(["coach", "platform_admin"], coachId);
    return api.coaches.updateCoach(coachId, profileData);
  }

  async getAllCoaches(): Promise<any[]> {
    return api.coaches.getCoaches();
  }

  // ===== SESSION MANAGEMENT =====

  async getSessions(filters?: Record<string, any>): Promise<Session[]> {
    checkAuthorization();

    // Filter sessions based on user role
    if (currentUser?.userType === "coach") {
      filters = { ...filters, coachId: currentUser.id };
    } else if (currentUser?.userType === "company_admin") {
      filters = { ...filters, companyId: currentUser.companyId };
    } else if (currentUser?.userType === "team_member") {
      filters = { ...filters, participantId: currentUser.id };
    }

    return api.sessions.getSessions(filters);
  }

  async getSession(sessionId: string): Promise<Session> {
    checkAuthorization();
    return api.sessions.getSession(sessionId);
  }

  async createSession(sessionData: Partial<Session>): Promise<Session> {
    checkAuthorization(["company_admin", "platform_admin"]);
    return api.sessions.createSession(sessionData);
  }

  async updateSession(
    sessionId: string,
    data: Partial<Session>,
  ): Promise<Session> {
    checkAuthorization(["coach", "company_admin", "platform_admin"]);
    return api.sessions.updateSession(sessionId, data);
  }

  async deleteSession(sessionId: string): Promise<void> {
    checkAuthorization(["company_admin", "platform_admin"]);
    return api.sessions.deleteSession(sessionId);
  }

  async generateSessionsForProgram(
    programId: string,
    config: any,
  ): Promise<Session[]> {
    checkAuthorization(["company_admin", "platform_admin"]);
    return api.sessions.generateSessionsForProgram(programId, config);
  }

  async getSessionsForProgram(programId: string): Promise<Session[]> {
    checkAuthorization();
    return api.sessions.getSessionsForProgram(programId);
  }

  async acceptSession(sessionId: string): Promise<Session> {
    checkAuthorization(["coach"]);
    return api.sessions.acceptSession(sessionId);
  }

  async declineSession(sessionId: string, reason?: string): Promise<Session> {
    checkAuthorization(["coach"]);
    return api.sessions.declineSession(sessionId, reason);
  }

  async getSessionsAwaitingAcceptance(): Promise<Session[]> {
    checkAuthorization(["coach"]);
    return api.sessions.getSessionsAwaitingAcceptance();
  }

  // ===== MATCHING/REQUEST MANAGEMENT =====

  async getMatchingRequests(
    filters?: Record<string, any>,
  ): Promise<MentorshipRequest[]> {
    checkAuthorization();

    // Filter requests based on user role
    if (currentUser?.userType === "company_admin") {
      filters = { ...filters, companyId: currentUser.companyId };
    } else if (currentUser?.userType === "coach") {
      filters = { ...filters, coachId: currentUser.id };
    }

    return api.matching.getMatchingRequests(filters);
  }

  async getCompanyRequests(companyId?: string): Promise<MentorshipRequest[]> {
    const user = checkAuthorization(["company_admin", "platform_admin"]);
    const targetCompanyId = companyId || user.companyId;

    if (!targetCompanyId) {
      throw new Error("Company ID is required");
    }

    return api.matching.getCompanyRequests(targetCompanyId);
  }

  async createMatchingRequest(
    data: Partial<MentorshipRequest>,
  ): Promise<MentorshipRequest> {
    checkAuthorization(["company_admin", "platform_admin"]);
    return api.matching.createMatchingRequest(data);
  }

  async updateMatchingRequest(
    id: string,
    data: Partial<MentorshipRequest>,
  ): Promise<MentorshipRequest> {
    checkAuthorization(["company_admin", "platform_admin"]);
    return api.matching.updateMatchingRequest(id, data);
  }

  // ===== PLATFORM STATISTICS =====

  async getPlatformStatistics(): Promise<any> {
    try {
      if (currentUser?.userType === "platform_admin") {
        return api.platform.getAdminStatistics();
      } else {
        return api.platform.getPublicStatistics();
      }
    } catch (error) {
      console.warn("Platform statistics unavailable:", error);
      // Return empty stats if backend is unavailable
      return {
        totalCoaches: 0,
        totalSessions: 0,
        averageRating: 0,
        totalCompanies: 0,
        totalActiveUsers: 0,
        monthlyGrowth: 0,
      };
    }
  }

  // ===== COMPATIBILITY METHODS =====
  // These methods maintain compatibility with existing code

  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    // This is a wrapper for the base API request functionality
    throw new Error("Use specific API methods instead of generic request");
  }

  // Subscription and pricing methods (placeholder until backend implements)
  async getSubscriptionTiers(): Promise<SubscriptionTier[]> {
    // Return default tiers until backend implements this
    return [
      {
        id: "starter",
        name: "Starter",
        price: 99,
        features: ["Up to 10 team members", "Basic coaching sessions"],
      },
      {
        id: "growth",
        name: "Growth",
        price: 299,
        features: ["Up to 50 team members", "Advanced analytics"],
      },
      {
        id: "enterprise",
        name: "Enterprise",
        price: 999,
        features: ["Unlimited team members", "Custom features"],
      },
    ];
  }

  async getSessionPricingTiers(): Promise<SessionPricingTier[]> {
    return [
      {
        id: "standard",
        name: "Standard",
        pricePerHour: 150,
        description: "Standard coaching sessions",
      },
      {
        id: "premium",
        name: "Premium",
        pricePerHour: 250,
        description: "Premium coaching with senior coaches",
      },
    ];
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export commonly used functions
export { setCurrentUser };

export default apiService;
