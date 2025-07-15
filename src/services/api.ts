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
import { Environment } from "../utils/environment";
import { API_ENDPOINTS } from "../config/api";

const API_BASE_URL = Environment.getApiBaseUrl();

// Token management
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

const getAuthHeaders = () => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  return headers;
};

// Base API request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error ${response.status}: ${error}`);
  }

  return response.json();
}

// Authentication API
export const authAPI = {
  async login(
    email: string,
    password: string,
  ): Promise<{ access_token: string; user: User }> {
    return apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  async register(
    userData: Partial<User>,
  ): Promise<{ access_token: string; user: User }> {
    return apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  async getProfile(): Promise<User> {
    return apiRequest("/auth/profile");
  },

  async logout(): Promise<void> {
    return apiRequest("/auth/logout", { method: "POST" });
  },
};

// User Management API
export const userAPI = {
  async getUsers(filters?: Record<string, any>): Promise<User[]> {
    const params = filters ? `?${new URLSearchParams(filters).toString()}` : "";
    return apiRequest(`/users${params}`);
  },

  async getUser(id: string): Promise<User> {
    return apiRequest(`/users/${id}`);
  },

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    return apiRequest(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(userData),
    });
  },

  async deleteUser(id: string): Promise<void> {
    return apiRequest(`/users/${id}`, { method: "DELETE" });
  },
};

// Company Management API
export const companyAPI = {
  async getCompanies(): Promise<any[]> {
    return apiRequest("/companies");
  },

  async getCompany(id: string): Promise<any> {
    return apiRequest(`/companies/${id}`);
  },

  async getDashboardMetrics(id: string): Promise<any> {
    return apiRequest(`/companies/${id}/dashboard-metrics`);
  },

  async getProgramStats(id: string): Promise<any> {
    return apiRequest(`/companies/${id}/program-stats`);
  },

  async getSessionStats(id: string): Promise<any> {
    return apiRequest(`/companies/${id}/session-stats`);
  },

  async updateCompany(id: string, data: any): Promise<any> {
    return apiRequest(`/companies/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};

// Coach Management API
export const coachAPI = {
  async getCoaches(filters?: Record<string, any>): Promise<Coach[]> {
    const params = filters ? `?${new URLSearchParams(filters).toString()}` : "";
    return apiRequest(`/coaches${params}`);
  },

  async searchCoaches(searchParams: Record<string, any>): Promise<Coach[]> {
    const params = new URLSearchParams(searchParams).toString();
    return apiRequest(`/coaches/search?${params}`);
  },

  async getCoach(id: string): Promise<Coach> {
    return apiRequest(`/coaches/${id}`);
  },

  async updateCoach(id: string, data: Partial<Coach>): Promise<Coach> {
    return apiRequest(`/coaches/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async updateCoachStatus(id: string, status: string): Promise<Coach> {
    return apiRequest(`/coaches/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  async applyToProgram(coachId: string, programId: string): Promise<any> {
    return apiRequest(`/coaches/${coachId}/apply`, {
      method: "POST",
      body: JSON.stringify({ programId }),
    });
  },
};

// Session Management API
export const sessionAPI = {
  async getSessions(filters?: Record<string, any>): Promise<Session[]> {
    const params = filters ? `?${new URLSearchParams(filters).toString()}` : "";
    return apiRequest(`/sessions${params}`);
  },

  async getSession(id: string): Promise<Session> {
    return apiRequest(`/sessions/${id}`);
  },

  async createSession(sessionData: Partial<Session>): Promise<Session> {
    return apiRequest("/sessions", {
      method: "POST",
      body: JSON.stringify(sessionData),
    });
  },

  async updateSession(id: string, data: Partial<Session>): Promise<Session> {
    return apiRequest(`/sessions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async deleteSession(id: string): Promise<void> {
    return apiRequest(`/sessions/${id}`, { method: "DELETE" });
  },

  async generateSessionsForProgram(
    programId: string,
    config: any,
  ): Promise<Session[]> {
    return apiRequest("/sessions/generate-for-program", {
      method: "POST",
      body: JSON.stringify({ programId, ...config }),
    });
  },

  async getSessionsForProgram(programId: string): Promise<Session[]> {
    return apiRequest(`/sessions/program/${programId}`);
  },

  async acceptSession(id: string): Promise<Session> {
    return apiRequest(`/sessions/${id}/accept`, { method: "POST" });
  },

  async declineSession(id: string, reason?: string): Promise<Session> {
    return apiRequest(`/sessions/${id}/decline`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  async getSessionsAwaitingAcceptance(): Promise<Session[]> {
    return apiRequest("/sessions/coach/awaiting-acceptance");
  },
};

// Matching/Request Management API
export const matchingAPI = {
  async getMatchingRequests(
    filters?: Record<string, any>,
  ): Promise<MentorshipRequest[]> {
    const params = filters ? `?${new URLSearchParams(filters).toString()}` : "";
    return apiRequest(`/matching${params}`);
  },

  async getMatchingRequest(id: string): Promise<MentorshipRequest> {
    return apiRequest(`/matching/${id}`);
  },

  async createMatchingRequest(
    data: Partial<MentorshipRequest>,
  ): Promise<MentorshipRequest> {
    return apiRequest("/matching", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateMatchingRequest(
    id: string,
    data: Partial<MentorshipRequest>,
  ): Promise<MentorshipRequest> {
    return apiRequest(`/matching/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async deleteMatchingRequest(id: string): Promise<void> {
    return apiRequest(`/matching/${id}`, { method: "DELETE" });
  },

  async getCompanyRequests(companyId: string): Promise<MentorshipRequest[]> {
    return apiRequest(`/matching/company/${companyId}`);
  },

  async getUserRequests(userId: string): Promise<MentorshipRequest[]> {
    return apiRequest(`/matching/user/${userId}`);
  },

  async updateRequestStatus(
    id: string,
    status: string,
  ): Promise<MentorshipRequest> {
    return apiRequest(`/matching/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  async getPendingRequests(): Promise<MentorshipRequest[]> {
    return apiRequest("/matching/status/pending");
  },

  async getProcessingRequests(): Promise<MentorshipRequest[]> {
    return apiRequest("/matching/status/processing");
  },
};

// Platform Statistics API
export const platformAPI = {
  async getPublicStatistics(): Promise<any> {
    return apiRequest("/platform/statistics");
  },

  async getAdminStatistics(): Promise<any> {
    return apiRequest("/platform/admin/statistics");
  },

  async getHealthCheck(): Promise<any> {
    return apiRequest("/platform/health");
  },
};

// Program Management API (using matching endpoints)
export const programAPI = {
  async getPrograms(filters?: Record<string, any>): Promise<any[]> {
    return matchingAPI.getMatchingRequests(filters);
  },

  async getProgram(id: string): Promise<any> {
    return matchingAPI.getMatchingRequest(id);
  },

  async createProgram(data: any): Promise<any> {
    return matchingAPI.createMatchingRequest(data);
  },

  async updateProgram(id: string, data: any): Promise<any> {
    return matchingAPI.updateMatchingRequest(id, data);
  },

  async deleteProgram(id: string): Promise<void> {
    return matchingAPI.deleteMatchingRequest(id);
  },

  async getCompanyPrograms(companyId: string): Promise<any[]> {
    return matchingAPI.getCompanyRequests(companyId);
  },

  async updateProgramStatus(id: string, status: string): Promise<any> {
    return matchingAPI.updateRequestStatus(id, status);
  },

  async getPendingPrograms(): Promise<any[]> {
    return matchingAPI.getPendingRequests();
  },

  async getProcessingPrograms(): Promise<any[]> {
    return matchingAPI.getProcessingRequests();
  },

  // Program-specific session management
  async generateSessionsForProgram(
    programId: string,
    config: any,
  ): Promise<any[]> {
    return sessionAPI.generateSessionsForProgram(programId, config);
  },

  async getProgramSessions(programId: string): Promise<any[]> {
    return sessionAPI.getSessionsForProgram(programId);
  },
};

// Unified API export
export const api = {
  auth: authAPI,
  users: userAPI,
  companies: companyAPI,
  coaches: coachAPI,
  sessions: sessionAPI,
  matching: matchingAPI,
  programs: programAPI,
  platform: platformAPI,
  setAuthToken,
};

export default api;
