import { User, CoachingRequest, TeamMember, Company, Session } from "@/types";

/**
 * ⚠️  DEPRECATED: Comprehensive localStorage service for Peptok application
 *
 * WARNING: This service is deprecated and should be phased out in favor of backend API calls.
 *
 * localStorage should only be used for:
 * - User preferences (theme, language)
 * - Temporary UI state
 * - Auth tokens (handled by auth service)
 *
 * All persistent data (users, programs, sessions, etc.) should come from the backend API.
 *
 * This service will be removed in a future cleanup.
 *
 * Provides type-safe storage and retrieval of all app data
 */

// Warn when this service is used
console.warn(
  "⚠���  WARNING: Using deprecated localStorage service. Please use backend API instead.",
);
export class LocalStorageService {
  private static readonly KEYS = {
    // Authentication
    USER: "peptok_user",
    TOKEN: "peptok_token",

    // Coaching Data
    COACHING_REQUESTS: "peptok_coaching_requests",
    COACHING_REQUEST_DRAFT: "peptok_coaching_request_draft",
    CURRENT_PROGRAM_ID: "peptok_current_program_id",

    // Company & Teams
    COMPANY_PROFILE: "peptok_company_profile",
    TEAM_MEMBERS: "peptok_team_members",

    // Sessions & Messaging
    SESSIONS: "peptok_sessions",
    MESSAGES: "peptok_messages",
    MESSAGE_THREADS: "peptok_message_threads",

    // Dashboard Data
    DASHBOARD_PREFERENCES: "peptok_dashboard_preferences",
    ANALYTICS_DATA: "peptok_analytics_data",
    MATCH_SCORES: "peptok_match_scores",

    // Onboarding State
    ONBOARDING_PROGRESS: "peptok_onboarding_progress",

    // App Settings
    APP_PREFERENCES: "peptok_app_preferences",
    FEATURE_FLAGS: "peptok_feature_flags",
  } as const;

  // Helper method to safely parse JSON
  private static safeJsonParse<T>(value: string | null, defaultValue: T): T {
    if (!value) return defaultValue;
    try {
      return JSON.parse(value);
    } catch {
      return defaultValue;
    }
  }

  // Helper method to safely stringify JSON
  private static safeJsonStringify(value: any): string {
    try {
      return JSON.stringify(value);
    } catch {
      return "{}";
    }
  }

  // Authentication
  static setUser(user: User): void {
    localStorage.setItem(this.KEYS.USER, this.safeJsonStringify(user));
  }

  static getUser(): User | null {
    return this.safeJsonParse(localStorage.getItem(this.KEYS.USER), null);
  }

  static setToken(token: string): void {
    localStorage.setItem(this.KEYS.TOKEN, token);
  }

  static getToken(): string | null {
    return localStorage.getItem(this.KEYS.TOKEN);
  }

  static clearAuth(): void {
    localStorage.removeItem(this.KEYS.USER);
    localStorage.removeItem(this.KEYS.TOKEN);
  }

  // Coaching Requests
  static setCoachingRequests(requests: CoachingRequest[]): void {
    localStorage.setItem(
      this.KEYS.COACHING_REQUESTS,
      this.safeJsonStringify(requests),
    );
  }

  static getCoachingRequests(): CoachingRequest[] {
    return this.safeJsonParse(
      localStorage.getItem(this.KEYS.COACHING_REQUESTS),
      [],
    );
  }

  static addCoachingRequest(request: CoachingRequest): void {
    const requests = this.getCoachingRequests();
    requests.unshift(request);
    this.setCoachingRequests(requests);
  }

  static updateCoachingRequest(
    id: string,
    updates: Partial<CoachingRequest>,
  ): void {
    const requests = this.getCoachingRequests();
    const index = requests.findIndex((r) => r.id === id);
    if (index !== -1) {
      requests[index] = {
        ...requests[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.setCoachingRequests(requests);
    }
  }

  static getCoachingRequest(id: string): CoachingRequest | null {
    const requests = this.getCoachingRequests();
    return requests.find((r) => r.id === id) || null;
  }

  // Draft Management
  static setCoachingRequestDraft(draft: any): void {
    localStorage.setItem(
      this.KEYS.COACHING_REQUEST_DRAFT,
      this.safeJsonStringify(draft),
    );
  }

  static getCoachingRequestDraft(): any | null {
    return this.safeJsonParse(
      localStorage.getItem(this.KEYS.COACHING_REQUEST_DRAFT),
      null,
    );
  }

  static clearCoachingRequestDraft(): void {
    localStorage.removeItem(this.KEYS.COACHING_REQUEST_DRAFT);
    localStorage.removeItem(this.KEYS.CURRENT_PROGRAM_ID);
  }

  static setProgramId(programId: string): void {
    localStorage.setItem(this.KEYS.CURRENT_PROGRAM_ID, programId);
  }

  static getProgramId(): string | null {
    return localStorage.getItem(this.KEYS.CURRENT_PROGRAM_ID);
  }

  // Company Data
  static setCompanyProfile(company: Company): void {
    localStorage.setItem(
      this.KEYS.COMPANY_PROFILE,
      this.safeJsonStringify(company),
    );
  }

  static getCompanyProfile(): Company | null {
    return this.safeJsonParse(
      localStorage.getItem(this.KEYS.COMPANY_PROFILE),
      null,
    );
  }

  // Team Members
  static setTeamMembers(members: TeamMember[]): void {
    localStorage.setItem(
      this.KEYS.TEAM_MEMBERS,
      this.safeJsonStringify(members),
    );
  }

  static getTeamMembers(): TeamMember[] {
    return this.safeJsonParse(localStorage.getItem(this.KEYS.TEAM_MEMBERS), []);
  }

  static addTeamMember(member: TeamMember): void {
    const members = this.getTeamMembers();
    members.push(member);
    this.setTeamMembers(members);
  }

  // Sessions
  static setSessions(sessions: Session[]): void {
    localStorage.setItem(this.KEYS.SESSIONS, this.safeJsonStringify(sessions));
  }

  static getSessions(): Session[] {
    return this.safeJsonParse(localStorage.getItem(this.KEYS.SESSIONS), []);
  }

  static addSession(session: Session): void {
    const sessions = this.getSessions();
    sessions.push(session);
    this.setSessions(sessions);
  }

  // Messages
  static setMessages(messages: any[]): void {
    localStorage.setItem(this.KEYS.MESSAGES, this.safeJsonStringify(messages));
  }

  static getMessages(): any[] {
    return this.safeJsonParse(localStorage.getItem(this.KEYS.MESSAGES), []);
  }

  static addMessage(message: any): void {
    const messages = this.getMessages();
    messages.push(message);
    this.setMessages(messages);
  }

  // Dashboard Preferences
  static setDashboardPreferences(preferences: any): void {
    localStorage.setItem(
      this.KEYS.DASHBOARD_PREFERENCES,
      this.safeJsonStringify(preferences),
    );
  }

  static getDashboardPreferences(): any {
    return this.safeJsonParse(
      localStorage.getItem(this.KEYS.DASHBOARD_PREFERENCES),
      {},
    );
  }

  // Analytics Data
  static setAnalyticsData(data: any): void {
    localStorage.setItem(
      this.KEYS.ANALYTICS_DATA,
      this.safeJsonStringify(data),
    );
  }

  static getAnalyticsData(): any {
    return this.safeJsonParse(
      localStorage.getItem(this.KEYS.ANALYTICS_DATA),
      {},
    );
  }

  // Match Scores
  static setMatchScores(scores: any[]): void {
    localStorage.setItem(
      this.KEYS.MATCH_SCORES,
      this.safeJsonStringify(scores),
    );
  }

  static getMatchScores(): any[] {
    return this.safeJsonParse(localStorage.getItem(this.KEYS.MATCH_SCORES), []);
  }

  // Onboarding Progress
  static setOnboardingProgress(progress: any): void {
    localStorage.setItem(
      this.KEYS.ONBOARDING_PROGRESS,
      this.safeJsonStringify(progress),
    );
  }

  static getOnboardingProgress(): any {
    return this.safeJsonParse(
      localStorage.getItem(this.KEYS.ONBOARDING_PROGRESS),
      {},
    );
  }

  static clearOnboardingProgress(): void {
    localStorage.removeItem(this.KEYS.ONBOARDING_PROGRESS);
  }

  // App Preferences
  static setAppPreferences(preferences: any): void {
    localStorage.setItem(
      this.KEYS.APP_PREFERENCES,
      this.safeJsonStringify(preferences),
    );
  }

  static getAppPreferences(): any {
    return this.safeJsonParse(
      localStorage.getItem(this.KEYS.APP_PREFERENCES),
      {},
    );
  }

  // Feature Flags
  static setFeatureFlags(flags: any): void {
    localStorage.setItem(
      this.KEYS.FEATURE_FLAGS,
      this.safeJsonStringify(flags),
    );
  }

  static getFeatureFlags(): any {
    return this.safeJsonParse(
      localStorage.getItem(this.KEYS.FEATURE_FLAGS),
      {},
    );
  }

  // Generic Methods
  static getItem<T>(key: string, defaultValue?: T): T | null {
    const value = localStorage.getItem(key);
    if (!value) return defaultValue || null;
    return this.safeJsonParse(value, defaultValue || null);
  }

  static setItem(key: string, value: any): void {
    localStorage.setItem(key, this.safeJsonStringify(value));
  }

  static removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  // Utility Methods
  static clearAllData(): void {
    Object.values(this.KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  }

  static exportData(): any {
    const data: any = {};
    Object.entries(this.KEYS).forEach(([name, key]) => {
      const value = localStorage.getItem(key);
      if (value) {
        data[name] = this.safeJsonParse(value, null);
      }
    });
    return data;
  }

  static importData(data: any): void {
    Object.entries(data).forEach(([name, value]) => {
      const key = this.KEYS[name as keyof typeof this.KEYS];
      if (key && value !== null) {
        localStorage.setItem(key, this.safeJsonStringify(value));
      }
    });
  }

  // Legacy Support - Migrate old localStorage keys
  static migrateOldData(): void {
    const oldKeys = [
      "mentorship-request-draft",
      "current-program-id",
      "mentorship_requests",
    ];

    // Migrate old coaching request draft
    const oldDraft = localStorage.getItem("mentorship-request-draft");
    if (oldDraft) {
      localStorage.setItem(this.KEYS.COACHING_REQUEST_DRAFT, oldDraft);
      localStorage.removeItem("mentorship-request-draft");
    }

    // Migrate old program ID
    const oldProgramId = localStorage.getItem("current-program-id");
    if (oldProgramId) {
      localStorage.setItem(this.KEYS.CURRENT_PROGRAM_ID, oldProgramId);
      localStorage.removeItem("current-program-id");
    }

    // Migrate old requests
    const oldRequests = localStorage.getItem("mentorship_requests");
    if (oldRequests) {
      localStorage.setItem(this.KEYS.COACHING_REQUESTS, oldRequests);
      localStorage.removeItem("mentorship_requests");
    }
  }
}

// Initialize migration on module load
if (typeof window !== "undefined") {
  LocalStorageService.migrateOldData();
}

export default LocalStorageService;
