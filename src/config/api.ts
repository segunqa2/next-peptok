/**
 * API Configuration
 *
 * This file ensures frontend and backend-nestjs endpoints match exactly.
 * All API endpoints are defined here to maintain consistency.
 */

export const API_ENDPOINTS = {
  // Authentication & Authorization
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    PROFILE: "/auth/profile",
    GOOGLE: "/auth/google",
    GOOGLE_CALLBACK: "/auth/google/callback",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
  },

  // User Management
  USERS: {
    BASE: "/users",
    BY_ID: (id: string) => `/users/${id}`,
    CREATE: "/users",
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
  },

  // Company/Organization Management
  COMPANIES: {
    BASE: "/companies",
    BY_ID: (id: string) => `/companies/${id}`,
    DASHBOARD_METRICS: (id: string) => `/companies/${id}/dashboard-metrics`,
    PROGRAM_STATS: (id: string) => `/companies/${id}/program-stats`,
    SESSION_STATS: (id: string) => `/companies/${id}/session-stats`,
  },

  // Coach Management
  COACHES: {
    BASE: "/coaches",
    SEARCH: "/coaches/search",
    BY_ID: (id: string) => `/coaches/${id}`,
    UPDATE_STATUS: (id: string) => `/coaches/${id}/status`,
    APPLY: (id: string) => `/coaches/${id}/apply`,
  },

  // Session Scheduling & Management
  SESSIONS: {
    BASE: "/sessions",
    BY_ID: (id: string) => `/sessions/${id}`,
    GENERATE_FOR_PROGRAM: "/sessions/generate-for-program",
    BY_PROGRAM: (programId: string) => `/sessions/program/${programId}`,
    ACCEPT: (id: string) => `/sessions/${id}/accept`,
    DECLINE: (id: string) => `/sessions/${id}/decline`,
    AWAITING_ACCEPTANCE: "/sessions/coach/awaiting-acceptance",
  },

  // Matching/Request Management (Programs)
  MATCHING: {
    BASE: "/matching",
    BY_ID: (id: string) => `/matching/${id}`,
    BY_COMPANY: (companyId: string) => `/matching/company/${companyId}`,
    BY_USER: (userId: string) => `/matching/user/${userId}`,
    UPDATE_STATUS: (id: string) => `/matching/${id}/status`,
    PENDING: "/matching/status/pending",
    PROCESSING: "/matching/status/processing",
  },

  // Platform Management
  PLATFORM: {
    STATISTICS: "/platform/statistics",
    ADMIN_STATISTICS: "/platform/admin/statistics",
    HEALTH: "/platform/health",
  },

  // Application Health
  ROOT: {
    HEALTH: "/health",
    WELCOME: "/",
  },
} as const;

// API Status Codes
export const API_STATUS = {
  SUCCESS: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Request timeout configuration
export const API_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// Role-based permissions mapping
export const ROLE_PERMISSIONS = {
  platform_admin: [
    "view_all_companies",
    "manage_all_users",
    "view_platform_statistics",
    "manage_platform_settings",
  ],
  company_admin: [
    "view_company_data",
    "manage_company_users",
    "create_programs",
    "manage_sessions",
  ],
  coach: [
    "view_own_sessions",
    "accept_decline_sessions",
    "update_own_profile",
    "apply_to_programs",
  ],
  team_member: ["view_own_sessions", "view_own_programs", "provide_feedback"],
} as const;

export type UserRole = keyof typeof ROLE_PERMISSIONS;
export type Permission = (typeof ROLE_PERMISSIONS)[UserRole][number];

// Helper function to check permissions
export const hasPermission = (
  userRole: UserRole,
  permission: Permission,
): boolean => {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
};

// HTTP Methods
export const HTTP_METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  PATCH: "PATCH",
  DELETE: "DELETE",
} as const;

export type HttpMethod = (typeof HTTP_METHODS)[keyof typeof HTTP_METHODS];
