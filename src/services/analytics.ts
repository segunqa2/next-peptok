interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  userId?: string;
  timestamp?: Date;
}

interface PageViewData {
  page: string;
  userId?: string;
  userType?: string;
  timestamp?: Date;
  referrer?: string;
}

interface UserActionData {
  action: string;
  component: string;
  metadata?: Record<string, any>;
  userId?: string;
  userType?: string;
}

interface SessionData {
  sessionId: string;
  coachId: string;
  companyId: string;
  duration: number;
  status: "completed" | "cancelled" | "no-show";
  rating?: number;
  feedback?: string;
}

interface BusinessMetric {
  metric: string;
  value: number;
  timestamp: Date;
  dimensions?: Record<string, string>;
}

class AnalyticsService {
  private isEnabled: boolean;
  private userId: string | null = null;
  private userType: string | null = null;
  private sessionId: string;

  constructor() {
    this.isEnabled =
      !import.meta.env.DEV || import.meta.env.VITE_ANALYTICS_ENABLED === "true";
    this.sessionId = this.generateSessionId();

    if (this.isEnabled) {
      console.log("📊 Analytics Service initialized");
    }
  }

  // Initialize with user context
  setUser(userId: string, userType: string, properties?: Record<string, any>) {
    this.userId = userId;
    this.userType = userType;

    if (this.isEnabled) {
      this.track("user_identified", {
        userId,
        userType,
        sessionId: this.sessionId,
        ...properties,
      });
    }
  }

  // Clear user context (on logout)
  clearUser() {
    if (this.isEnabled && this.userId) {
      this.track("user_logout", {
        userId: this.userId,
        userType: this.userType,
        sessionDuration: this.getSessionDuration(),
      });
    }

    this.userId = null;
    this.userType = null;
  }

  // Track page views
  pageView(data: PageViewData) {
    if (!this.isEnabled) return;

    const event = {
      event: "page_view",
      properties: {
        page: data.page,
        userId: data.userId || this.userId,
        userType: data.userType || this.userType,
        referrer: data.referrer || document.referrer,
        sessionId: this.sessionId,
        timestamp: data.timestamp || new Date(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      },
    };

    this.sendEvent(event);
    console.log("📄 Page View:", data.page);
  }

  // Track user actions
  trackAction(data: UserActionData) {
    if (!this.isEnabled) return;

    const event = {
      event: "user_action",
      properties: {
        action: data.action,
        component: data.component,
        userId: data.userId || this.userId,
        userType: data.userType || this.userType,
        sessionId: this.sessionId,
        timestamp: new Date(),
        ...data.metadata,
      },
    };

    this.sendEvent(event);
    console.log("🎯 User Action:", data.action, "in", data.component);
  }

  // Track business events
  track(eventName: string, properties?: Record<string, any>) {
    if (!this.isEnabled) return;

    const event = {
      event: eventName,
      properties: {
        userId: this.userId,
        userType: this.userType,
        sessionId: this.sessionId,
        timestamp: new Date(),
        ...properties,
      },
    };

    this.sendEvent(event);
    console.log("📊 Analytics Event:", eventName, properties);
  }

  // Track session data
  trackSession(data: SessionData) {
    if (!this.isEnabled) return;

    this.track("session_completed", {
      sessionId: data.sessionId,
      coachId: data.coachId,
      companyId: data.companyId,
      duration: data.duration,
      status: data.status,
      rating: data.rating,
      feedback: data.feedback,
      category: "mentorship",
    });
  }

  // Track business metrics
  trackMetric(data: BusinessMetric) {
    if (!this.isEnabled) return;

    this.track("business_metric", {
      metric: data.metric,
      value: data.value,
      timestamp: data.timestamp,
      dimensions: data.dimensions,
    });
  }

  // Track errors
  trackError(error: Error, context?: Record<string, any>) {
    if (!this.isEnabled) return;

    this.track("error_occurred", {
      errorMessage: error.message,
      errorStack: error.stack,
      errorName: error.name,
      context,
      page: window.location.pathname,
    });
  }

  // Track performance metrics
  trackPerformance(
    metric: string,
    value: number,
    context?: Record<string, any>,
  ) {
    if (!this.isEnabled) return;

    this.track("performance_metric", {
      metric,
      value,
      page: window.location.pathname,
      ...context,
    });
  }

  // Coach-specific analytics
  coach = {
    profileViewed: (coachId: string, viewerType: string) => {
      this.track("coach_profile_viewed", {
        coachId,
        viewerType,
        category: "coach_discovery",
      });
    },

    matchAccepted: (matchId: string, coachId: string) => {
      this.track("match_accepted", {
        matchId,
        coachId,
        category: "matching",
      });
    },

    matchDeclined: (matchId: string, coachId: string, reason?: string) => {
      this.track("match_declined", {
        matchId,
        coachId,
        reason,
        category: "matching",
      });
    },

    availabilityUpdated: (coachId: string, availability: any) => {
      this.track("coach_availability_updated", {
        coachId,
        availability,
        category: "coach_management",
      });
    },

    sessionCompleted: (sessionData: SessionData) => {
      this.trackSession(sessionData);
    },
  };

  // Company-specific analytics
  company = {
    requestCreated: (
      requestId: string,
      companyId: string,
      requestType: string,
    ) => {
      this.track("mentorship_request_created", {
        requestId,
        companyId,
        requestType,
        category: "company_activity",
      });
    },

    employeeInvited: (companyId: string, employeeCount: number) => {
      this.track("employee_invited", {
        companyId,
        employeeCount,
        category: "company_growth",
      });
    },

    subscriptionChanged: (
      companyId: string,
      fromPlan: string,
      toPlan: string,
    ) => {
      this.track("subscription_changed", {
        companyId,
        fromPlan,
        toPlan,
        category: "revenue",
      });
    },
  };

  // Platform-specific analytics
  platform = {
    userRegistered: (userId: string, userType: string, source: string) => {
      this.track("user_registered", {
        userId,
        userType,
        source,
        category: "acquisition",
      });
    },

    dailyActiveUsers: (count: number, date: Date) => {
      this.trackMetric({
        metric: "daily_active_users",
        value: count,
        timestamp: date,
      });
    },

    revenue: (amount: number, source: string, date: Date) => {
      this.trackMetric({
        metric: "revenue",
        value: amount,
        timestamp: date,
        dimensions: { source },
      });
    },
  };

  // Private methods
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getSessionDuration(): number {
    const sessionStart = parseInt(this.sessionId.split("_")[1]);
    return Date.now() - sessionStart;
  }

  private async sendEvent(event: AnalyticsEvent) {
    try {
      // In production, send to analytics service
      if (import.meta.env.PROD) {
        // Send to your analytics backend
        await fetch("/api/analytics", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
        });
      } else {
        // In development, just log to console
        console.log("📊 Analytics Event:", event);
      }

      // Store in localStorage for offline analytics
      this.storeEventLocally(event);
    } catch (error) {
      console.warn("Failed to send analytics event:", error);
      // Store failed events for retry
      this.storeEventLocally(event, true);
    }
  }

  private storeEventLocally(event: AnalyticsEvent, failed = false) {
    try {
      const key = failed ? "analytics_failed_events" : "analytics_events";
      const stored = JSON.parse(localStorage.getItem(key) || "[]");
      stored.push(event);

      // Keep only last 1000 events
      if (stored.length > 1000) {
        stored.splice(0, stored.length - 1000);
      }

      localStorage.setItem(key, JSON.stringify(stored));
    } catch (error) {
      console.warn("Failed to store analytics event locally:", error);
    }
  }

  // Method to retry failed events
  async retryFailedEvents() {
    try {
      const failedEvents = JSON.parse(
        localStorage.getItem("analytics_failed_events") || "[]",
      );

      for (const event of failedEvents) {
        await this.sendEvent(event);
      }

      localStorage.removeItem("analytics_failed_events");
      console.log(`✅ Retried ${failedEvents.length} failed analytics events`);
    } catch (error) {
      console.warn("Failed to retry analytics events:", error);
    }
  }

  // Get analytics data for dashboards
  async getAnalytics(query: {
    metric: string;
    startDate: Date;
    endDate: Date;
    filters?: Record<string, any>;
    groupBy?: string;
  }) {
    try {
      const response = await fetch("/api/analytics/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(query),
      });

      if (!response.ok) throw new Error("Analytics query failed");

      return await response.json();
    } catch (error) {
      console.warn("Failed to fetch analytics data:", error);
      return this.getMockAnalyticsData(query);
    }
  }

  private getMockAnalyticsData(query: any) {
    // Return mock data for development
    const mockData = {
      page_views: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        value: Math.floor(Math.random() * 1000) + 500,
      })),
      user_registrations: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        value: Math.floor(Math.random() * 50) + 10,
      })),
      session_completions: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        value: Math.floor(Math.random() * 100) + 20,
      })),
    };

    return {
      data: mockData[query.metric as keyof typeof mockData] || [],
      total: Math.floor(Math.random() * 10000) + 1000,
    };
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();
export default analytics;
