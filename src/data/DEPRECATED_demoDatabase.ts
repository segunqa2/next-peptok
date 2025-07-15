/**
 * DEPRECATED: This file contains extensive demo database content that should not be used in production.
 * All data should now come from the backend PostgreSQL database through API calls.
 *
 * This file is kept for reference only and will be removed in a future cleanup.
 *
 * Use the following instead:
 * - Backend NestJS API with PostgreSQL database
 * - companyDashboardApi for dashboard metrics
 * - Real user authentication through backend
 * - Remove localStorage usage in favor of API calls
 */

// This file has been deprecated and moved to DEPRECATED_demoDatabase.ts
// Please use real API calls instead of demo data

export const DEPRECATED_WARNING = `
⚠️  WARNING: You are importing deprecated demo database!
    
    This data is hardcoded and not suitable for production use.
    Please update your code to use the real backend API instead.
    
    Use:
    - Backend NestJS API with PostgreSQL database
    - companyDashboardApi for dashboard and company data
    - Real authentication through backend auth service
    - Remove localStorage dependencies
`;

console.warn(DEPRECATED_WARNING);

// Re-export from original file for now to avoid breaking changes
// TODO: Remove these exports and update all importing files
export * from "./demoDatabase";
