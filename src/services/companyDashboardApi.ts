/**
 * Company Dashboard API Service
 * Handles all API calls related to company dashboard metrics and data
 */

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export interface CompanyDashboardMetrics {
  // Core metrics
  activeSessions: number;
  activeCoaching: number; // Same as active programs/requests
  goalsProgress: number; // Percentage of completed sessions vs total
  totalHours: number;

  // Additional metrics
  totalPrograms: number;
  completedPrograms: number;
  pendingPrograms: number;
  totalParticipants: number;
  averageRating: number;
  monthlySpend: number;
  completedSessions: number;
  scheduledSessions: number;

  // Engagement metrics
  engagementRate: number;
  successRate: number;
  retentionRate: number;
}

export interface ProgramStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

export interface SessionStats {
  total: number;
  scheduled: number;
  confirmed: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  noShow: number;
  totalHours: number;
}

class CompanyDashboardApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    };
  }

  /**
   * Get comprehensive dashboard metrics for a company
   */
  async getDashboardMetrics(
    companyId: string,
  ): Promise<CompanyDashboardMetrics> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/companies/${companyId}/dashboard-metrics`,
        {
          method: "GET",
          headers: this.getAuthHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch dashboard metrics: ${response.statusText}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      // Return fallback data if API fails
      return this.getFallbackMetrics();
    }
  }

  /**
   * Get program statistics for a company
   */
  async getProgramStats(companyId: string): Promise<ProgramStats> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/companies/${companyId}/program-stats`,
        {
          method: "GET",
          headers: this.getAuthHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch program stats: ${response.statusText}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching program stats:", error);
      return {
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
      };
    }
  }

  /**
   * Get session statistics for a company
   */
  async getSessionStats(companyId: string): Promise<SessionStats> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/companies/${companyId}/session-stats`,
        {
          method: "GET",
          headers: this.getAuthHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch session stats: ${response.statusText}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching session stats:", error);
      return {
        total: 0,
        scheduled: 0,
        confirmed: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0,
        noShow: 0,
        totalHours: 0,
      };
    }
  }

  /**
   * Get matching requests (coaching programs) for a company
   */
  async getCompanyPrograms(companyId: string): Promise<any[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/matching/company/${companyId}`,
        {
          method: "GET",
          headers: this.getAuthHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch company programs: ${response.statusText}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching company programs:", error);
      return [];
    }
  }

  /**
   * Get sessions for a company
   */
  async getCompanySessions(
    companyId: string,
    filters?: {
      skip?: number;
      take?: number;
      status?: string;
    },
  ): Promise<any[]> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append("companyId", companyId);

      if (filters?.skip) queryParams.append("skip", filters.skip.toString());
      if (filters?.take) queryParams.append("take", filters.take.toString());
      if (filters?.status) queryParams.append("status", filters.status);

      const response = await fetch(
        `${API_BASE_URL}/sessions?${queryParams.toString()}`,
        {
          method: "GET",
          headers: this.getAuthHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch company sessions: ${response.statusText}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching company sessions:", error);
      return [];
    }
  }

  /**
   * Generate sessions for a program
   */
  async generateSessionsForProgram(data: {
    programId: string;
    startDate: Date;
    endDate: Date;
    frequency: "weekly" | "bi-weekly" | "monthly";
    hoursPerSession: number;
    coachId: string;
    coachRate: number;
  }): Promise<any[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/sessions/generate-for-program`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          body: JSON.stringify(data),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to generate sessions: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error generating sessions for program:", error);
      throw error;
    }
  }

  /**
   * Create a new coaching program request
   */
  async createProgramRequest(data: {
    requiredSkills: string[];
    preferredIndustries?: string[];
    languages?: string[];
    preferences?: any;
    description?: string;
    goals?: string;
    priority?: "low" | "medium" | "high" | "urgent";
    maxCoaches?: number;
    deadline?: Date;
  }): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/matching`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to create program request: ${response.statusText}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating program request:", error);
      throw error;
    }
  }

  /**
   * Update a program request
   */
  async updateProgramRequest(programId: string, data: any): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/matching/${programId}`, {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to update program request: ${response.statusText}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating program request:", error);
      throw error;
    }
  }

  /**
   * Get fallback metrics when API is unavailable
   */
  private getFallbackMetrics(): CompanyDashboardMetrics {
    return {
      activeSessions: 0,
      activeCoaching: 0,
      goalsProgress: 0,
      totalHours: 0,
      totalPrograms: 0,
      completedPrograms: 0,
      pendingPrograms: 0,
      totalParticipants: 0,
      averageRating: 0,
      monthlySpend: 0,
      completedSessions: 0,
      scheduledSessions: 0,
      engagementRate: 0,
      successRate: 0,
      retentionRate: 0,
    };
  }

  /**
   * Accept a session (coach only)
   */
  async acceptSession(sessionId: string): Promise<any> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/sessions/${sessionId}/accept`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to accept session: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error accepting session:", error);
      throw error;
    }
  }

  /**
   * Decline a session (coach only)
   */
  async declineSession(sessionId: string, reason?: string): Promise<any> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/sessions/${sessionId}/decline`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ reason }),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to decline session: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error declining session:", error);
      throw error;
    }
  }

  /**
   * Get sessions awaiting coach acceptance
   */
  async getSessionsAwaitingAcceptance(): Promise<any[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/sessions/coach/awaiting-acceptance`,
        {
          method: "GET",
          headers: this.getAuthHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch sessions awaiting acceptance: ${response.statusText}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching sessions awaiting acceptance:", error);
      return [];
    }
  }

  /**
   * Check if the API is available
   */
  async checkApiHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      return response.ok;
    } catch (error) {
      console.warn("API health check failed:", error);
      return false;
    }
  }
}

export const companyDashboardApi = new CompanyDashboardApiService();
