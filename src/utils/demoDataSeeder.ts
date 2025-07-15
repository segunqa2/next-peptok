/**
 * Demo Data Seeder - CLEANED
 * All hardcoded data removed. Data should come from backend API.
 */

import { CoachingRequest } from "@/types";
import { analytics } from "@/services/analytics";

export const seedDemoCoachingRequests = (): void => {
  console.warn(
    "Demo data seeder disabled - all data should come from backend API",
  );

  // Log that demo data seeding was attempted
  analytics.trackAction({
    action: "demo_data_seed_attempted",
    category: "system",
    details: {
      timestamp: new Date().toISOString(),
      message: "Demo data seeding bypassed - using backend API instead",
    },
  });
};

export const clearDemoData = (): void => {
  console.warn("Demo data clearing disabled - data managed by backend API");
};

export const getDemoCoachingRequests = (): CoachingRequest[] => {
  console.warn(
    "Demo coaching requests disabled - fetch from backend API instead",
  );
  return [];
};

export const getDemoAnalyticsData = (): any => {
  console.warn("Demo analytics data disabled - fetch from backend API instead");
  return {
    leads: [],
    statistics: {
      totalLeads: 0,
      conversionRate: 0,
      averageSessionTime: 0,
      popularPages: [],
    },
  };
};

// Export empty arrays for backward compatibility
export const demoCoachingRequests: CoachingRequest[] = [];
export const demoAnalyticsData = {
  leads: [],
  statistics: {
    totalLeads: 0,
    conversionRate: 0,
    averageSessionTime: 0,
    popularPages: [],
  },
};
