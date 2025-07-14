import LocalStorageService from "@/services/localStorageService";
import { CoachingRequest, TeamMember } from "@/types";

export function seedDemoCoachingRequests() {
  console.log("🌱 Seeding demo coaching requests...");

  const existingRequests = LocalStorageService.getCoachingRequests();
  if (existingRequests.length > 0) {
    console.log("✅ Demo requests already exist, skipping seed");
    return;
  }

  const demoRequests: CoachingRequest[] = [
    {
      id: "coaching_req_001",
      companyId: "comp_001",
      title: "Leadership Development Program Q1 2024",
      description:
        "Comprehensive leadership coaching program focused on developing senior managers into effective leaders. We want to improve team communication, strategic thinking, and decision-making capabilities.",
      goals: [
        {
          id: "goal_001",
          title: "Improve Strategic Thinking",
          description:
            "Help leaders think more strategically about business decisions and long-term planning",
          category: "leadership",
          priority: "high",
        },
        {
          id: "goal_002",
          title: "Enhance Team Communication",
          description:
            "Develop better communication skills for leading diverse teams",
          category: "leadership",
          priority: "medium",
        },
        {
          id: "goal_003",
          title: "Decision Making Under Pressure",
          description:
            "Learn frameworks for making effective decisions in high-pressure situations",
          category: "leadership",
          priority: "high",
        },
      ],
      metricsToTrack: [
        "Employee Engagement",
        "Leadership Effectiveness",
        "Team Collaboration",
        "Goal Achievement",
      ],
      teamMembers: [
        {
          id: "member_001",
          email: "john.manager@techcorp.com",
          name: "John Manager",
          role: "participant",
          status: "invited",
          invitedAt: new Date().toISOString(),
        },
        {
          id: "member_002",
          email: "sarah.director@techcorp.com",
          name: "Sarah Director",
          role: "participant",
          status: "invited",
          invitedAt: new Date().toISOString(),
        },
        {
          id: "member_003",
          email: "mike.senior@techcorp.com",
          name: "Mike Senior",
          role: "participant",
          status: "invited",
          invitedAt: new Date().toISOString(),
        },
      ],
      preferredExpertise: [
        "Leadership Development",
        "Strategic Planning",
        "Team Building",
        "Communication",
      ],
      budget: {
        min: 3000,
        max: 5000,
      },
      timeline: {
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Next week
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 3 months
        sessionFrequency: "bi-weekly",
      },
      status: "submitted",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "coaching_req_002",
      companyId: "comp_002",
      title: "Sales Performance Coaching",
      description:
        "Intensive sales coaching program to improve individual and team sales performance. Focus on closing techniques, customer relationship building, and sales process optimization.",
      goals: [
        {
          id: "goal_004",
          title: "Increase Conversion Rates",
          description: "Improve lead-to-customer conversion rates by 25%",
          category: "business",
          priority: "high",
        },
        {
          id: "goal_005",
          title: "Master Consultative Selling",
          description:
            "Develop skills in consultative selling approach and solution-based selling",
          category: "business",
          priority: "high",
        },
      ],
      metricsToTrack: [
        "Performance Ratings",
        "Goal Achievement",
        "Customer Satisfaction",
        "Skill Assessments",
      ],
      teamMembers: [
        {
          id: "member_004",
          email: "alex.sales@startupco.com",
          name: "Alex Sales",
          role: "participant",
          status: "invited",
          invitedAt: new Date().toISOString(),
        },
        {
          id: "member_005",
          email: "jenny.rep@startupco.com",
          name: "Jenny Rep",
          role: "participant",
          status: "invited",
          invitedAt: new Date().toISOString(),
        },
      ],
      preferredExpertise: ["Sales Training", "B2B Sales", "Customer Relations"],
      budget: {
        min: 2000,
        max: 4000,
      },
      timeline: {
        startDate: new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000,
        ).toISOString(), // 2 weeks
        endDate: new Date(Date.now() + 70 * 24 * 60 * 60 * 1000).toISOString(), // 10 weeks
        sessionFrequency: "weekly",
      },
      status: "submitted",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "coaching_req_003",
      companyId: "comp_003",
      title: "Technical Leadership Transition",
      description:
        "Help senior engineers transition into technical leadership roles. Focus on people management, technical decision making, and balancing technical work with leadership responsibilities.",
      goals: [
        {
          id: "goal_006",
          title: "Technical to People Leadership",
          description:
            "Learn how to transition from individual contributor to people manager",
          category: "leadership",
          priority: "high",
        },
        {
          id: "goal_007",
          title: "Technical Architecture Decisions",
          description:
            "Develop skills for making high-level technical architecture decisions",
          category: "technical",
          priority: "medium",
        },
      ],
      metricsToTrack: [
        "Leadership Effectiveness",
        "Team Collaboration",
        "Innovation Metrics",
        "Employee Engagement",
      ],
      teamMembers: [
        {
          id: "member_006",
          email: "david.tech@financeplus.com",
          name: "David Tech",
          role: "participant",
          status: "invited",
          invitedAt: new Date().toISOString(),
        },
        {
          id: "member_007",
          email: "anna.dev@financeplus.com",
          name: "Anna Dev",
          role: "participant",
          status: "invited",
          invitedAt: new Date().toISOString(),
        },
        {
          id: "member_008",
          email: "chris.senior@financeplus.com",
          name: "Chris Senior",
          role: "observer",
          status: "invited",
          invitedAt: new Date().toISOString(),
        },
      ],
      preferredExpertise: [
        "Technology Leadership",
        "Agile Coaching",
        "Team Building",
        "Technical Leadership",
      ],
      budget: {
        min: 4000,
        max: 7000,
      },
      timeline: {
        startDate: new Date(
          Date.now() + 21 * 24 * 60 * 60 * 1000,
        ).toISOString(), // 3 weeks
        endDate: new Date(Date.now() + 105 * 24 * 60 * 60 * 1000).toISOString(), // 15 weeks
        sessionFrequency: "bi-weekly",
      },
      status: "submitted",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // Store the requests
  demoRequests.forEach((request) => {
    LocalStorageService.addCoachingRequest(request);
  });

  console.log(`✅ Seeded ${demoRequests.length} demo coaching requests`);
}

export function seedDemoUsers() {
  console.log("🌱 Seeding demo user session data...");

  // Set up analytics data
  LocalStorageService.setAnalyticsData({
    platformStats: {
      totalUsers: 30,
      totalCompanies: 8,
      totalCoaches: 7,
      totalSessions: 156,
      averageRating: 4.7,
      monthlyRevenue: 45000,
      activeSubscriptions: 8,
    },
    leads: {
      total: 12,
      bySource: {
        landing_page: 8,
        referral: 3,
        direct: 1,
      },
      recent: [],
    },
  });

  // Set up dashboard preferences
  LocalStorageService.setDashboardPreferences({
    theme: "light",
    defaultView: "overview",
    compactMode: false,
    showNotifications: true,
  });

  console.log("✅ Demo user session data seeded");
}

export function initializeDemoData() {
  console.log("🚀 Initializing demo data for the application...");

  try {
    seedDemoCoachingRequests();
    seedDemoUsers();

    console.log("🎉 Demo data initialization complete!");
  } catch (error) {
    console.error("❌ Failed to initialize demo data:", error);
  }
}

// Auto-initialize on import if in development
if (import.meta.env.DEV) {
  // Small delay to ensure localStorage is ready
  setTimeout(initializeDemoData, 1000);
}

export default {
  seedDemoCoachingRequests,
  seedDemoUsers,
  initializeDemoData,
};
