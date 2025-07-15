/**
 * DEPRECATED: This file contains hardcoded mock data that should not be used in production.
 * All data should now come from the backend API.
 *
 * This file is kept for reference only and will be removed in a future cleanup.
 *
 * Use the following services instead:
 * - companyDashboardApi for dashboard metrics
 * - Backend API endpoints for real data
 * - Remove localStorage usage in favor of API calls
 */

// This file has been deprecated and moved to DEPRECATED_mockData.ts
// Please use real API calls instead of mock data

export const DEPRECATED_WARNING = `
⚠️  WARNING: You are importing deprecated mock data!
    
    This data is hardcoded and not suitable for production use.
    Please update your code to use the real backend API instead.
    
    Use:
    - companyDashboardApi.getDashboardMetrics()
    - Backend API endpoints for sessions, programs, etc.
    - Remove localStorage dependencies
`;

console.warn(DEPRECATED_WARNING);

// Re-export from original file for now to avoid breaking changes
// TODO: Remove these exports and update all importing files
export * from "./mockData";
