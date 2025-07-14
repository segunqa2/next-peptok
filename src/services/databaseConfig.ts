// Backend Database Configuration Service
// Ensures proper database connections and operations for invitations

import { toast } from "sonner";

export interface DatabaseConfig {
  baseUrl: string;
  endpoints: {
    invitations: string[];
    users: string[];
    validation: string[];
  };
  headers: Record<string, string>;
  timeout: number;
  retryAttempts: number;
}

export interface DatabaseStatus {
  isConnected: boolean;
  lastCheck: string;
  responseTime: number;
  activeEndpoints: string[];
  failedEndpoints: string[];
}

class DatabaseConfigService {
  private config: DatabaseConfig;
  private status: DatabaseStatus;

  constructor() {
    this.config = this.initializeConfig();
    this.status = {
      isConnected: false,
      lastCheck: "",
      responseTime: 0,
      activeEndpoints: [],
      failedEndpoints: [],
    };

    // Only test database connection if API is properly configured
    if (this.isApiConfigured() && this.config.baseUrl) {
      console.log("🗃️ Testing database connection on service initialization");
      this.testDatabaseConnection();
    } else {
      const reason = this.isCloudEnvironment()
        ? "cloud environment without valid backend API URL"
        : "no API configuration";
      console.log(`🗃️ Database service disabled - ${reason}`);
      this.status.isConnected = false;
    }
  }

  private initializeConfig(): DatabaseConfig {
    const baseUrl = this.getApiBaseUrl();

    return {
      baseUrl,
      endpoints: {
        invitations: [
          "/api/team/invitations",
          "/api/invitations",
          "/team/invitations",
        ],
        users: ["/api/users", "/api/team-members", "/users"],
        validation: ["/api/validate", "/api/health/database", "/health/db"],
      },
      headers: {
        "Content-Type": "application/json",
        "X-Database-Required": "true",
        "X-No-Cache": "true",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
      timeout: 10000, // 10 seconds
      retryAttempts: 3,
    };
  }

  private isApiConfigured(): boolean {
    const envApiUrl = import.meta.env.VITE_API_URL;
    const isLocalDev = this.isLocalDevelopment();
    const isCloud = this.isCloudEnvironment();

    // In cloud environments, disable database connections unless a valid cloud API URL is provided
    if (isCloud) {
      // If no API URL or it's a localhost URL, disable database
      if (
        !envApiUrl ||
        envApiUrl.includes("localhost") ||
        envApiUrl.includes("127.0.0.1")
      ) {
        console.log(
          "🗃️ Cloud environment detected with localhost API URL - disabling database",
        );
        return false;
      }
      // Only allow if API URL is a valid remote URL
      return true;
    }

    // In production, require explicit API URL
    if (!isLocalDev && !isCloud) {
      return !!envApiUrl;
    }

    // In local development, allow if API URL is set or localhost backend is expected
    return !!envApiUrl || isLocalDev;
  }

  private isLocalDevelopment(): boolean {
    const hostname = window.location.hostname;
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0"
    );
  }

  private getApiBaseUrl(): string {
    const envApiUrl = import.meta.env.VITE_API_URL;
    const isCloud = this.isCloudEnvironment();

    if (envApiUrl) {
      // In cloud environments, reject localhost URLs
      if (
        isCloud &&
        (envApiUrl.includes("localhost") || envApiUrl.includes("127.0.0.1"))
      ) {
        console.log(
          "🗃️ Cloud environment with localhost API URL - disabling database",
        );
        return ""; // Return empty to skip database connections
      }
      return envApiUrl.replace("/api", ""); // Remove /api suffix if present
    }

    // In cloud development environment, don't try to connect to localhost
    if (isCloud) {
      console.log(
        "🗃️ Cloud environment without valid API URL - disabling database",
      );
      return ""; // Return empty to skip database connections
    }

    if (this.isLocalDevelopment()) {
      return "http://localhost:3001";
    }

    return window.location.origin;
  }

  private isCloudEnvironment(): boolean {
    const hostname = window.location.hostname;
    // Detect cloud/remote development environments
    return (
      hostname.includes("fly.dev") ||
      hostname.includes("vercel.app") ||
      hostname.includes("netlify.app") ||
      hostname.includes("gitpod.io") ||
      hostname.includes("codespaces.dev") ||
      hostname.includes("herokuapp.com") ||
      hostname.includes("amazonaws.com") ||
      hostname.includes("surge.sh") ||
      hostname.includes("firebase.app") ||
      (!this.isLocalDevelopment() &&
        !hostname.includes("192.168.") &&
        !hostname.includes("10."))
    );
  }

  /**
   * Test database connection and identify working endpoints
   */
  async testDatabaseConnection(): Promise<DatabaseStatus> {
    // Check if API is configured first
    if (!this.isApiConfigured()) {
      console.log("🗃️ Database service not configured - running in mock mode");
      this.status = {
        isConnected: false,
        lastCheck: new Date().toISOString(),
        responseTime: 0,
        activeEndpoints: [],
        failedEndpoints: [],
      };
      return this.status;
    }

    console.log("🗃️ Testing backend database connection...");

    const startTime = performance.now();
    const activeEndpoints: string[] = [];
    const failedEndpoints: string[] = [];

    // Test validation endpoints first
    for (const endpoint of this.config.endpoints.validation) {
      try {
        const response = await this.makeRequest(endpoint, "GET");
        if (response.ok) {
          activeEndpoints.push(endpoint);
          console.log(`✅ Database validation endpoint working: ${endpoint}`);
        } else {
          failedEndpoints.push(endpoint);
        }
      } catch (error) {
        failedEndpoints.push(endpoint);
        console.warn(
          `❌ Database validation endpoint failed: ${endpoint}`,
          error,
        );
      }
    }

    // Test invitation endpoints
    for (const endpoint of this.config.endpoints.invitations) {
      try {
        const response = await this.makeRequest(endpoint, "GET");
        if (response.ok) {
          activeEndpoints.push(endpoint);
          console.log(`✅ Database invitation endpoint working: ${endpoint}`);
        } else {
          failedEndpoints.push(endpoint);
        }
      } catch (error) {
        failedEndpoints.push(endpoint);
        console.warn(
          `❌ Database invitation endpoint failed: ${endpoint}`,
          error,
        );
      }
    }

    const endTime = performance.now();
    const responseTime = endTime - startTime;

    this.status = {
      isConnected: activeEndpoints.length > 0,
      lastCheck: new Date().toISOString(),
      responseTime: Math.round(responseTime),
      activeEndpoints,
      failedEndpoints,
    };

    if (this.status.isConnected) {
      console.log(
        `✅ Backend database connected (${activeEndpoints.length} endpoints active)`,
      );
      // Only show success toast in development
      if (this.isLocalDevelopment()) {
        toast.success("🗃️ Backend database connected", {
          description: `${activeEndpoints.length} endpoints active`,
          duration: 3000,
        });
      }
    } else {
      console.log(
        "❌ Backend database connection failed - falling back to mock data",
      );
      // Only show error toast in development
      if (this.isLocalDevelopment()) {
        toast.warning("❌ Backend database unavailable", {
          description: "Using mock data instead",
          duration: 3000,
        });
      }
    }

    return this.status;
  }

  /**
   * Get optimal endpoint for a specific operation
   */
  getOptimalEndpoint(type: keyof DatabaseConfig["endpoints"]): string | null {
    const endpoints = this.config.endpoints[type];

    // Return first active endpoint
    for (const endpoint of endpoints) {
      if (this.status.activeEndpoints.includes(endpoint)) {
        return endpoint;
      }
    }

    // If no active endpoints, return first available for retry
    return endpoints[0] || null;
  }

  /**
   * Make database request with proper headers and error handling
   */
  async makeDatabaseRequest(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    data?: any,
  ): Promise<any> {
    console.log(`��️ Making database request: ${method} ${endpoint}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const requestOptions: RequestInit = {
        method,
        headers: {
          ...this.config.headers,
          "X-Database-Write": method !== "GET" ? "required" : "optional",
        },
        signal: controller.signal,
      };

      if (data && method !== "GET") {
        requestOptions.body = JSON.stringify(data);
      }

      const response = await fetch(endpoint, requestOptions);
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();

      // Verify database response
      if (this.isDatabaseResponse(responseData)) {
        console.log(`✅ Database request successful: ${method} ${endpoint}`);
        return responseData;
      } else {
        throw new Error("Response does not appear to be from database");
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`❌ Database request failed: ${method} ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * Verify response is from actual database (not cache/mock)
   */
  private isDatabaseResponse(data: any): boolean {
    // Check for database-specific indicators
    if (data.data && data.data.id && data.data.id.includes("temp_")) {
      return false; // Temporary/mock data
    }

    if (data.error && data.error.includes("localStorage")) {
      return false; // localStorage fallback
    }

    if (data.source === "cache" || data.source === "mock") {
      return false; // Cached or mock data
    }

    // Look for database timestamp formats
    if (data.data?.createdAt || data.data?.updatedAt) {
      const timestamp = data.data.createdAt || data.data.updatedAt;
      try {
        const date = new Date(timestamp);
        // Database timestamps should be recent and valid
        return date.getTime() > 0;
      } catch {
        return false;
      }
    }

    return true; // Assume valid if no negative indicators
  }

  /**
   * Batch operation with database guarantee
   */
  async batchDatabaseOperation(
    operations: Array<{
      endpoint: string;
      method: "GET" | "POST" | "PUT" | "DELETE";
      data?: any;
    }>,
  ): Promise<any[]> {
    console.log(
      `🗃️ Executing batch database operations (${operations.length} ops)`,
    );

    const results: any[] = [];

    for (const op of operations) {
      try {
        const result = await this.makeDatabaseRequest(
          op.endpoint,
          op.method,
          op.data,
        );
        results.push({ success: true, data: result });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    console.log(
      `✅ Batch operations completed: ${successCount}/${operations.length} successful`,
    );

    return results;
  }

  /**
   * Get current database status
   */
  getDatabaseStatus(): DatabaseStatus {
    return { ...this.status };
  }

  /**
   * Force database connection test
   */
  async refreshDatabaseConnection(): Promise<DatabaseStatus> {
    return await this.testDatabaseConnection();
  }

  /**
   * Check if database is ready for operations
   */
  isDatabaseReady(): boolean {
    return this.status.isConnected && this.status.activeEndpoints.length > 0;
  }

  /**
   * Get database configuration
   */
  getConfig(): DatabaseConfig {
    return { ...this.config };
  }

  /**
   * Update database configuration
   */
  updateConfig(updates: Partial<DatabaseConfig>): void {
    this.config = { ...this.config, ...updates };
    this.testDatabaseConnection(); // Re-test with new config
  }

  // Private helper methods

  private async makeRequest(
    endpoint: string,
    method: string,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for tests

    try {
      // Check if we have a valid base URL
      if (!this.config.baseUrl) {
        throw new Error("No API base URL configured");
      }

      // Additional check for cloud environments with localhost URLs
      if (
        this.isCloudEnvironment() &&
        this.config.baseUrl.includes("localhost")
      ) {
        throw new Error("Cannot connect to localhost from cloud environment");
      }

      const fullUrl = this.config.baseUrl + endpoint;

      const response = await fetch(fullUrl, {
        method,
        headers: this.config.headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle specific fetch errors gracefully
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          console.warn(`⏱️ Request timeout for ${endpoint}`);
        } else if (error.message.includes("fetch")) {
          console.warn(
            `��� Network error for ${endpoint}: Backend not available`,
          );
        } else {
          console.warn(`❌ Request failed for ${endpoint}:`, error.message);
        }
      }

      throw error;
    }
  }
}

// Export singleton instance
export const databaseConfig = new DatabaseConfigService();
export default databaseConfig;
