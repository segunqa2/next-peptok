/**
 * Environment detection utilities
 */

export const Environment = {
  // Check if running in local development
  isLocalDevelopment(): boolean {
    const hostname = window.location.hostname;
    const port = window.location.port;

    // Explicit local development indicators
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      port === "3000" ||
      port === "5173" || // Vite default port
      port === "8080" // Dev server port
    ) {
      return true;
    }

    // Cloud/deployed environment indicators
    if (
      hostname.includes(".fly.dev") ||
      hostname.includes(".vercel.app") ||
      hostname.includes(".netlify.app") ||
      hostname.includes(".herokuapp.com") ||
      hostname.includes(".amazonaws.com") ||
      window.location.protocol === "https:"
    ) {
      return false;
    }

    // Default to local development if unsure and on HTTP
    return window.location.protocol === "http:";
  },

  // Check if running in production/deployed environment
  isProduction(): boolean {
    return !this.isLocalDevelopment();
  },

  // Get the appropriate API base URL
  getApiBaseUrl(): string {
    const envApiUrl =
      import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;

    if (envApiUrl) {
      return envApiUrl;
    }

    // Default to NestJS backend in development
    if (this.isLocalDevelopment()) {
      return "http://localhost:3001";
    }

    // In production, assume backend is at same domain
    return `${window.location.origin}/api`;
  },

  // Check if backend should be attempted
  shouldTryBackend(): boolean {
    // Only try backend if explicitly configured with VITE_API_URL
    // This prevents unnecessary failed fetch attempts in development
    return !!import.meta.env.VITE_API_URL;
  },

  // Get environment name for logging
  getEnvironmentName(): string {
    if (this.isLocalDevelopment()) {
      return "development";
    }
    return "production";
  },
};
