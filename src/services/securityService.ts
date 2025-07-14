import { analytics } from "./analytics";
import { crossBrowserSync, SYNC_CONFIGS } from "./crossBrowserSync";
// Removed: cacheInvalidation service (deleted for simplification)

interface SecuritySettings {
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecialChars: boolean;
  passwordExpiryDays: number;
  passwordHistoryCount: number;
  sessionTimeoutMinutes: number;
  maxConcurrentSessions: number;
  rememberMeDays: number;
  forceLogoutOnPasswordChange: boolean;
  twoFactorRequired: boolean;
  twoFactorMethods: string[];
  loginAttemptLimit: number;
  lockoutDurationMinutes: number;
  allowedDomains: string[];
  blockedCountries: string[];
  apiRateLimitPerMinute: number;
  apiKeyExpiryDays: number;
  requireHttps: boolean;
  auditLogRetentionDays: number;
  enableDataEncryption: boolean;
  gdprCompliant: boolean;
  lastUpdated: string;
}

interface SecurityEvent {
  id: string;
  type:
    | "login_failure"
    | "suspicious_activity"
    | "policy_violation"
    | "unauthorized_access";
  severity: "low" | "medium" | "high" | "critical";
  userId?: string;
  userEmail?: string;
  ipAddress: string;
  userAgent: string;
  description: string;
  timestamp: string;
  resolved: boolean;
}

interface AuditLogEntry {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  details?: any;
}

class SecurityService {
  private static instance: SecurityService;
  private settings: SecuritySettings | null = null;
  private securityEvents: SecurityEvent[] = [];
  private auditLog: AuditLogEntry[] = [];

  public static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  // Security Settings Management
  async getSecuritySettings(): Promise<SecuritySettings> {
    try {
      // Try to get from cross-browser sync first
      const syncedData = crossBrowserSync.get(SYNC_CONFIGS.SECURITY_SETTINGS);
      if (syncedData) {
        this.settings = syncedData;
        return syncedData;
      }

      // Fallback to localStorage or default
      const stored = localStorage.getItem("peptok_security_settings");
      if (stored) {
        this.settings = JSON.parse(stored);
        return this.settings;
      }

      // Return default settings
      const defaultSettings: SecuritySettings = {
        passwordMinLength: 8,
        passwordRequireUppercase: true,
        passwordRequireLowercase: true,
        passwordRequireNumbers: true,
        passwordRequireSpecialChars: false,
        passwordExpiryDays: 90,
        passwordHistoryCount: 5,
        sessionTimeoutMinutes: 30,
        maxConcurrentSessions: 3,
        rememberMeDays: 30,
        forceLogoutOnPasswordChange: true,
        twoFactorRequired: false,
        twoFactorMethods: ["email", "sms"],
        loginAttemptLimit: 5,
        lockoutDurationMinutes: 15,
        allowedDomains: [],
        blockedCountries: [],
        apiRateLimitPerMinute: 60,
        apiKeyExpiryDays: 365,
        requireHttps: true,
        auditLogRetentionDays: 90,
        enableDataEncryption: true,
        gdprCompliant: true,
        lastUpdated: new Date().toISOString(),
      };

      this.settings = defaultSettings;
      return defaultSettings;
    } catch (error) {
      console.error("Failed to get security settings:", error);
      throw error;
    }
  }

  async updateSecuritySettings(settings: SecuritySettings): Promise<void> {
    try {
      // Update timestamp
      settings.lastUpdated = new Date().toISOString();

      // Save to localStorage
      localStorage.setItem(
        "peptok_security_settings",
        JSON.stringify(settings),
      );

      // Sync across browsers
      crossBrowserSync.save(SYNC_CONFIGS.SECURITY_SETTINGS, settings, {
        id: "platform_admin",
        name: "Platform Admin",
      });

      // Invalidate cache
      // Note: Cache invalidation removed for simplification

      // Update instance
      this.settings = settings;

      // Track analytics
      analytics.track("security_settings_updated", {
        settingsCount: Object.keys(settings).length,
        passwordPolicyEnabled: settings.passwordMinLength > 0,
        twoFactorRequired: settings.twoFactorRequired,
        gdprCompliant: settings.gdprCompliant,
      });

      // Log audit entry
      this.logSecurityEvent({
        type: "policy_violation",
        severity: "low",
        description: "Security settings updated",
        ipAddress: this.getCurrentIPAddress(),
        userAgent: navigator.userAgent,
      });
    } catch (error) {
      console.error("Failed to update security settings:", error);
      throw error;
    }
  }

  // Password Validation
  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    if (!this.settings) {
      throw new Error("Security settings not loaded");
    }

    const errors: string[] = [];

    if (password.length < this.settings.passwordMinLength) {
      errors.push(
        `Password must be at least ${this.settings.passwordMinLength} characters long`,
      );
    }

    if (this.settings.passwordRequireUppercase && !/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }

    if (this.settings.passwordRequireLowercase && !/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }

    if (this.settings.passwordRequireNumbers && !/\d/.test(password)) {
      errors.push("Password must contain at least one number");
    }

    if (
      this.settings.passwordRequireSpecialChars &&
      !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    ) {
      errors.push("Password must contain at least one special character");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Session Management
  isSessionValid(sessionStartTime: Date): boolean {
    if (!this.settings) return true;

    const now = new Date();
    const sessionDuration = now.getTime() - sessionStartTime.getTime();
    const maxDuration = this.settings.sessionTimeoutMinutes * 60 * 1000;

    return sessionDuration < maxDuration;
  }

  // Security Event Management
  logSecurityEvent(
    event: Omit<SecurityEvent, "id" | "timestamp" | "resolved">,
  ): void {
    const securityEvent: SecurityEvent = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      resolved: false,
      ...event,
    };

    this.securityEvents.unshift(securityEvent);

    // Keep only recent events (last 1000)
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(0, 1000);
    }

    // Store in localStorage
    localStorage.setItem(
      "peptok_security_events",
      JSON.stringify(this.securityEvents),
    );

    // Track high severity events
    if (event.severity === "high" || event.severity === "critical") {
      analytics.track("security_event_high_severity", {
        type: event.type,
        severity: event.severity,
        description: event.description,
      });
    }
  }

  getSecurityEvents(): SecurityEvent[] {
    if (this.securityEvents.length === 0) {
      const stored = localStorage.getItem("peptok_security_events");
      if (stored) {
        this.securityEvents = JSON.parse(stored);
      }
    }
    return this.securityEvents;
  }

  resolveSecurityEvent(eventId: string): void {
    const eventIndex = this.securityEvents.findIndex((e) => e.id === eventId);
    if (eventIndex !== -1) {
      this.securityEvents[eventIndex].resolved = true;
      localStorage.setItem(
        "peptok_security_events",
        JSON.stringify(this.securityEvents),
      );
    }
  }

  // Audit Logging
  logAuditEntry(entry: Omit<AuditLogEntry, "id" | "timestamp">): void {
    const auditEntry: AuditLogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...entry,
    };

    this.auditLog.unshift(auditEntry);

    // Apply retention policy
    if (this.settings) {
      const retentionDate = new Date();
      retentionDate.setDate(
        retentionDate.getDate() - this.settings.auditLogRetentionDays,
      );

      this.auditLog = this.auditLog.filter(
        (entry) => new Date(entry.timestamp) > retentionDate,
      );
    }

    // Keep only recent entries (last 5000)
    if (this.auditLog.length > 5000) {
      this.auditLog = this.auditLog.slice(0, 5000);
    }

    // Store in localStorage
    localStorage.setItem("peptok_audit_log", JSON.stringify(this.auditLog));
  }

  getAuditLog(filters?: {
    userId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
  }): AuditLogEntry[] {
    if (this.auditLog.length === 0) {
      const stored = localStorage.getItem("peptok_audit_log");
      if (stored) {
        this.auditLog = JSON.parse(stored);
      }
    }

    let filteredLog = this.auditLog;

    if (filters) {
      if (filters.userId) {
        filteredLog = filteredLog.filter(
          (entry) => entry.userId === filters.userId,
        );
      }
      if (filters.action) {
        filteredLog = filteredLog.filter((entry) =>
          entry.action.toLowerCase().includes(filters.action!.toLowerCase()),
        );
      }
      if (filters.startDate) {
        filteredLog = filteredLog.filter(
          (entry) => new Date(entry.timestamp) >= filters.startDate!,
        );
      }
      if (filters.endDate) {
        filteredLog = filteredLog.filter(
          (entry) => new Date(entry.timestamp) <= filters.endDate!,
        );
      }
    }

    return filteredLog;
  }

  // Access Control
  isDomainAllowed(email: string): boolean {
    if (!this.settings || this.settings.allowedDomains.length === 0) {
      return true;
    }

    const domain = email.split("@")[1];
    return this.settings.allowedDomains.includes(domain);
  }

  isCountryBlocked(countryCode: string): boolean {
    if (!this.settings) return false;
    return this.settings.blockedCountries.includes(countryCode);
  }

  // Rate Limiting
  checkRateLimit(identifier: string, action: string): boolean {
    if (!this.settings) return true;

    const key = `rate_limit_${identifier}_${action}`;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window

    const stored = localStorage.getItem(key);
    let requests: number[] = stored ? JSON.parse(stored) : [];

    // Remove old requests outside the window
    requests = requests.filter((time) => now - time < windowMs);

    // Check if limit exceeded
    if (requests.length >= this.settings.apiRateLimitPerMinute) {
      return false;
    }

    // Add current request
    requests.push(now);
    localStorage.setItem(key, JSON.stringify(requests));

    return true;
  }

  // Utility Methods
  private getCurrentIPAddress(): string {
    // In a real application, this would be obtained from the server
    return "127.0.0.1";
  }

  // Data Encryption (simulation)
  encryptData(data: any): string {
    if (!this.settings?.enableDataEncryption) {
      return JSON.stringify(data);
    }

    // In a real application, use proper encryption
    const encoded = btoa(JSON.stringify(data));
    return `encrypted:${encoded}`;
  }

  decryptData(encryptedData: string): any {
    if (!encryptedData.startsWith("encrypted:")) {
      return JSON.parse(encryptedData);
    }

    // In a real application, use proper decryption
    const encoded = encryptedData.replace("encrypted:", "");
    return JSON.parse(atob(encoded));
  }

  // Cleanup old data
  cleanupExpiredData(): void {
    if (!this.settings) return;

    const now = new Date();

    // Clean up security events
    const eventRetentionDate = new Date();
    eventRetentionDate.setDate(eventRetentionDate.getDate() - 30); // Keep events for 30 days

    this.securityEvents = this.securityEvents.filter(
      (event) => new Date(event.timestamp) > eventRetentionDate,
    );

    // Clean up audit log
    const auditRetentionDate = new Date();
    auditRetentionDate.setDate(
      auditRetentionDate.getDate() - this.settings.auditLogRetentionDays,
    );

    this.auditLog = this.auditLog.filter(
      (entry) => new Date(entry.timestamp) > auditRetentionDate,
    );

    // Update localStorage
    localStorage.setItem(
      "peptok_security_events",
      JSON.stringify(this.securityEvents),
    );
    localStorage.setItem("peptok_audit_log", JSON.stringify(this.auditLog));
  }
}

export const securityService = SecurityService.getInstance();
