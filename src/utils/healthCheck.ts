/**
 * Health check utilities for debugging deployment issues
 */

import { Environment } from "./environment";

export interface HealthCheckResult {
  status: "healthy" | "warning" | "error";
  timestamp: string;
  environment: string;
  checks: {
    name: string;
    status: "pass" | "fail" | "warning";
    message: string;
    details?: any;
  }[];
}

export const performHealthCheck = async (): Promise<HealthCheckResult> => {
  const checks = [];
  let overallStatus: "healthy" | "warning" | "error" = "healthy";

  // Environment detection check
  try {
    const env = Environment.getEnvironmentName();
    const isLocal = Environment.isLocalDevelopment();
    checks.push({
      name: "Environment Detection",
      status: "pass" as const,
      message: `Environment: ${env}, Local: ${isLocal}`,
      details: {
        hostname: window.location.hostname,
        protocol: window.location.protocol,
        port: window.location.port,
      },
    });
  } catch (error) {
    checks.push({
      name: "Environment Detection",
      status: "fail" as const,
      message: `Failed to detect environment: ${error}`,
    });
    overallStatus = "error";
  }

  // API endpoint check
  try {
    const apiUrl = Environment.getApiBaseUrl();
    checks.push({
      name: "API Configuration",
      status: "pass" as const,
      message: `API URL: ${apiUrl}`,
      details: { apiUrl },
    });

    // Only test API connection in local development
    if (Environment.isLocalDevelopment()) {
      try {
        const response = await fetch(`${apiUrl}/health`, {
          method: "GET",
          signal: AbortSignal.timeout(3000), // 3 second timeout
        });

        if (response.ok) {
          checks.push({
            name: "Backend Connectivity",
            status: "pass" as const,
            message: "Backend is responding",
            details: { status: response.status },
          });
        } else {
          checks.push({
            name: "Backend Connectivity",
            status: "warning" as const,
            message: `Backend returned ${response.status}`,
            details: { status: response.status },
          });
          if (overallStatus === "healthy") overallStatus = "warning";
        }
      } catch (error) {
        checks.push({
          name: "Backend Connectivity",
          status: "warning" as const,
          message: "Backend not available (using demo mode)",
          details: {
            error: error instanceof Error ? error.message : String(error),
          },
        });
        if (overallStatus === "healthy") overallStatus = "warning";
      }
    } else {
      checks.push({
        name: "Backend Connectivity",
        status: "pass" as const,
        message: "Production mode - backend check skipped",
      });
    }
  } catch (error) {
    checks.push({
      name: "API Configuration",
      status: "fail" as const,
      message: `API configuration error: ${error}`,
    });
    overallStatus = "error";
  }

  // Browser compatibility check
  try {
    const hasRequiredFeatures = !!(
      window.fetch &&
      window.Promise &&
      window.Map &&
      window.Set &&
      Array.prototype.includes
    );

    if (hasRequiredFeatures) {
      checks.push({
        name: "Browser Compatibility",
        status: "pass" as const,
        message: "All required browser features available",
      });
    } else {
      checks.push({
        name: "Browser Compatibility",
        status: "warning" as const,
        message: "Some browser features may not be available",
      });
      if (overallStatus === "healthy") overallStatus = "warning";
    }
  } catch (error) {
    checks.push({
      name: "Browser Compatibility",
      status: "fail" as const,
      message: `Browser compatibility check failed: ${error}`,
    });
    overallStatus = "error";
  }

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    environment: Environment.getEnvironmentName(),
    checks,
  };
};

// Expose health check globally for debugging
if (typeof window !== "undefined") {
  (window as any).healthCheck = performHealthCheck;

  // Auto-run health check in development
  if (Environment.isLocalDevelopment()) {
    console.log("🏥 Health check available at: window.healthCheck()");
  }
}

export default { performHealthCheck };
