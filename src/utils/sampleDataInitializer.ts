/**
 * Sample Data Initializer - DISABLED
 * All sample data moved to backend database.
 * Frontend should only consume data from backend APIs.
 */

export const initializeSampleData = (): void => {
  console.warn(
    "Sample data initialization disabled - all data managed by backend API",
  );
};

export const getSampleCoachingRequests = (): any[] => {
  console.warn(
    "Sample coaching requests disabled - fetch from backend API instead",
  );
  return [];
};

export const getSampleTeamMembers = (): any[] => {
  console.warn("Sample team members disabled - fetch from backend API instead");
  return [];
};

export const getSampleInvitations = (): any[] => {
  console.warn("Sample invitations disabled - fetch from backend API instead");
  return [];
};

// Deprecated - use backend API
export const sampleCoachingRequests: any[] = [];
export const sampleTeamMembers: any[] = [];
export const sampleInvitations: any[] = [];
