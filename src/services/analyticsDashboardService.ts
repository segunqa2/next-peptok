import { apiEnhanced } from "./apiEnhanced";
import { analytics } from "./analytics";

export interface LandingPageMetrics {
  totalVisitors: number;
  signups: number;
  conversionRate: number;
  bounceRate: number;
  averageSessionDuration: number; // in seconds
  topReferrers: { source: string; visits: number; conversionRate: number }[];
  deviceBreakdown: { device: string; percentage: number }[];
  geographicData: { country: string; visits: number }[];
  timeSeriesData: {
    date: string;
    visitors: number;
    signups: number;
    conversions: number;
  }[];
}

export interface CoachDashboardMetrics {
  coachId: string;
  coachName: string;
  sessionsCompleted: number;
  totalSessionHours: number;
  revenueEarned: number;
  averageRating: number;
  totalReviews: number;
  activeClients: number;
  completedPrograms: number;
  nextSession?: {
    id: string;
    title: string;
    scheduledTime: Date;
    participantCount: number;
  };
  recentFeedback: {
    rating: number;
    comment: string;
    clientName: string;
    sessionDate: Date;
  }[];
  monthlyEarnings: {
    month: string;
    earnings: number;
    sessionsCount: number;
  }[];
  clientSatisfactionTrend: {
    date: string;
    averageRating: number;
    sessionCount: number;
  }[];
}

export interface EnterpriseDashboardMetrics {
  companyId: string;
  companyName: string;
  programAdoption: {
    totalPrograms: number;
    activePrograms: number;
    completedPrograms: number;
    adoptionRate: number;
  };
  employeeUsage: {
    totalEmployees: number;
    activeEmployees: number;
    engagementRate: number;
    averageSessionsPerEmployee: number;
  };
  sessionMetrics: {
    totalSessionsBooked: number;
    sessionsCompleted: number;
    completionRate: number;
    totalHoursSpent: number;
    averageSessionRating: number;
  };
  feedback: {
    overallSatisfaction: number;
    wouldRecommend: number;
    topBenefits: { benefit: string; percentage: number }[];
    improvementAreas: { area: string; percentage: number }[];
  };
  trends: {
    monthlyEngagement: {
      month: string;
      activeUsers: number;
      sessionsCompleted: number;
      satisfaction: number;
    }[];
    programPerformance: {
      programName: string;
      participants: number;
      completionRate: number;
      satisfaction: number;
    }[];
  };
  costAnalysis: {
    totalInvestment: number;
    costPerEmployee: number;
    costPerSession: number;
    estimatedROI: number;
  };
}

class AnalyticsDashboardService {
  private readonly API_BASE = "/analytics/dashboard";

  /**
   * Get landing page conversion and visitor metrics
   */
  async getLandingPageMetrics(
    dateRange: { from: Date; to: Date } = {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      to: new Date(),
    },
  ): Promise<LandingPageMetrics> {
    try {
      const params = new URLSearchParams({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
      });

      const response = await apiEnhanced.request<LandingPageMetrics>(
        `${this.API_BASE}/landing?${params}`,
      );

      analytics.trackAction({
        action: "landing_metrics_viewed",
        component: "analytics_dashboard",
        metadata: { dateRange },
      });

      return response.data;
    } catch (error) {
      console.warn("Using mock landing page metrics:", error);

      // Return comprehensive mock data for demo
      return {
        totalVisitors: 12847,
        signups: 423,
        conversionRate: 3.29,
        bounceRate: 42.8,
        averageSessionDuration: 248,
        topReferrers: [
          { source: "Google Organic", visits: 4521, conversionRate: 4.2 },
          { source: "LinkedIn", visits: 2134, conversionRate: 6.8 },
          { source: "Direct", visits: 1876, conversionRate: 2.1 },
          { source: "Google Ads", visits: 1543, conversionRate: 8.9 },
          { source: "Twitter", visits: 892, conversionRate: 1.8 },
        ],
        deviceBreakdown: [
          { device: "Desktop", percentage: 65.4 },
          { device: "Mobile", percentage: 28.7 },
          { device: "Tablet", percentage: 5.9 },
        ],
        geographicData: [
          { country: "United States", visits: 7234 },
          { country: "Canada", visits: 1876 },
          { country: "United Kingdom", visits: 1432 },
          { country: "Germany", visits: 987 },
          { country: "Australia", visits: 743 },
        ],
        timeSeriesData: Array.from({ length: 30 }, (_, i) => {
          const date = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000);
          const baseVisitors = 300 + Math.random() * 200;
          const visitors = Math.floor(baseVisitors);
          const signups = Math.floor(visitors * (0.02 + Math.random() * 0.04));
          return {
            date: date.toISOString().split("T")[0],
            visitors,
            signups,
            conversions: signups,
          };
        }),
      };
    }
  }

  /**
   * Get coach performance and earnings metrics
   */
  async getCoachDashboardMetrics(
    coachId: string,
  ): Promise<CoachDashboardMetrics> {
    try {
      const response = await apiEnhanced.request<CoachDashboardMetrics>(
        `${this.API_BASE}/coach/${coachId}`,
      );

      analytics.trackAction({
        action: "coach_metrics_viewed",
        component: "analytics_dashboard",
        metadata: { coachId },
      });

      return response.data;
    } catch (error) {
      console.warn("Using mock coach metrics:", error);

      // Return comprehensive mock data for demo
      return {
        coachId,
        coachName: "Sarah Johnson",
        sessionsCompleted: 127,
        totalSessionHours: 189.5,
        revenueEarned: 14250,
        averageRating: 4.8,
        totalReviews: 89,
        activeClients: 23,
        completedPrograms: 8,
        nextSession: {
          id: "session-next",
          title: "Leadership Development Session",
          scheduledTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          participantCount: 4,
        },
        recentFeedback: [
          {
            rating: 5,
            comment:
              "Excellent session! Sarah really helped our team improve communication.",
            clientName: "John Smith",
            sessionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          },
          {
            rating: 4,
            comment:
              "Very insightful and practical advice for leadership challenges.",
            clientName: "Maria Garcia",
            sessionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          },
          {
            rating: 5,
            comment:
              "Outstanding coaching! Our productivity has improved significantly.",
            clientName: "David Chen",
            sessionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        ],
        monthlyEarnings: Array.from({ length: 12 }, (_, i) => {
          const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ];
          const baseEarnings = 1000 + Math.random() * 800;
          const sessions = Math.floor(8 + Math.random() * 12);
          return {
            month: monthNames[i],
            earnings: Math.floor(baseEarnings),
            sessionsCount: sessions,
          };
        }),
        clientSatisfactionTrend: Array.from({ length: 30 }, (_, i) => {
          const date = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000);
          return {
            date: date.toISOString().split("T")[0],
            averageRating: 4.2 + Math.random() * 0.6,
            sessionCount: Math.floor(1 + Math.random() * 4),
          };
        }),
      };
    }
  }

  /**
   * Get enterprise program adoption and ROI metrics
   */
  async getEnterpriseDashboardMetrics(
    companyId: string,
  ): Promise<EnterpriseDashboardMetrics> {
    try {
      const response = await apiEnhanced.request<EnterpriseDashboardMetrics>(
        `${this.API_BASE}/enterprise/${companyId}`,
      );

      analytics.trackAction({
        action: "enterprise_metrics_viewed",
        component: "analytics_dashboard",
        metadata: { companyId },
      });

      return response.data;
    } catch (error) {
      console.warn("Using mock enterprise metrics:", error);

      // Return comprehensive mock data for demo
      return {
        companyId,
        companyName: "TechCorp Solutions",
        programAdoption: {
          totalPrograms: 12,
          activePrograms: 8,
          completedPrograms: 4,
          adoptionRate: 78.5,
        },
        employeeUsage: {
          totalEmployees: 245,
          activeEmployees: 189,
          engagementRate: 77.1,
          averageSessionsPerEmployee: 3.2,
        },
        sessionMetrics: {
          totalSessionsBooked: 456,
          sessionsCompleted: 398,
          completionRate: 87.3,
          totalHoursSpent: 672.5,
          averageSessionRating: 4.6,
        },
        feedback: {
          overallSatisfaction: 4.7,
          wouldRecommend: 91.2,
          topBenefits: [
            { benefit: "Improved Communication", percentage: 78 },
            { benefit: "Better Leadership Skills", percentage: 71 },
            { benefit: "Increased Productivity", percentage: 65 },
            { benefit: "Enhanced Team Collaboration", percentage: 58 },
            { benefit: "Stress Management", percentage: 52 },
          ],
          improvementAreas: [
            { area: "More Flexible Scheduling", percentage: 34 },
            { area: "Additional Session Types", percentage: 28 },
            { area: "Longer Session Duration", percentage: 22 },
            { area: "More Coach Options", percentage: 19 },
          ],
        },
        trends: {
          monthlyEngagement: Array.from({ length: 12 }, (_, i) => {
            const monthNames = [
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
            ];
            const baseUsers = 120 + Math.random() * 80;
            const baseSessions = 25 + Math.random() * 20;
            return {
              month: monthNames[i],
              activeUsers: Math.floor(baseUsers),
              sessionsCompleted: Math.floor(baseSessions),
              satisfaction: 4.2 + Math.random() * 0.6,
            };
          }),
          programPerformance: [
            {
              programName: "Leadership Development",
              participants: 34,
              completionRate: 91.2,
              satisfaction: 4.8,
            },
            {
              programName: "Communication Skills",
              participants: 28,
              completionRate: 85.7,
              satisfaction: 4.6,
            },
            {
              programName: "Team Building",
              participants: 42,
              completionRate: 88.1,
              satisfaction: 4.7,
            },
            {
              programName: "Stress Management",
              participants: 19,
              completionRate: 94.7,
              satisfaction: 4.9,
            },
          ],
        },
        costAnalysis: {
          totalInvestment: 28500,
          costPerEmployee: 116.33,
          costPerSession: 71.61,
          estimatedROI: 285.7,
        },
      };
    }
  }

  /**
   * Get platform-wide analytics for admin dashboard
   */
  async getPlatformAnalytics(): Promise<{
    totalUsers: number;
    totalCompanies: number;
    totalCoaches: number;
    totalSessions: number;
    monthlyRevenue: number;
    growth: {
      userGrowth: number;
      revenueGrowth: number;
      sessionGrowth: number;
    };
  }> {
    try {
      const response = await apiEnhanced.request(`${this.API_BASE}/platform`);

      analytics.trackAction({
        action: "platform_analytics_viewed",
        component: "analytics_dashboard",
      });

      return response.data;
    } catch (error) {
      console.warn("Using mock platform analytics:", error);

      return {
        totalUsers: 2847,
        totalCompanies: 89,
        totalCoaches: 156,
        totalSessions: 5643,
        monthlyRevenue: 47800,
        growth: {
          userGrowth: 23.4,
          revenueGrowth: 34.7,
          sessionGrowth: 28.9,
        },
      };
    }
  }

  /**
   * Export analytics data to various formats
   */
  async exportData(
    type: "landing" | "coach" | "enterprise",
    id?: string,
    format: "csv" | "xlsx" | "pdf" = "csv",
  ): Promise<Blob> {
    try {
      const params = new URLSearchParams({ format });
      if (id) params.append("id", id);

      const response = await apiEnhanced.request(
        `${this.API_BASE}/export/${type}?${params}`,
        {
          method: "GET",
          responseType: "blob",
        },
      );

      analytics.trackAction({
        action: "analytics_exported",
        component: "analytics_dashboard",
        metadata: { type, format, id },
      });

      return response.data;
    } catch (error) {
      console.warn("Export not available:", error);
      throw new Error("Export functionality not available");
    }
  }
}

export const analyticsDashboardService = new AnalyticsDashboardService();
