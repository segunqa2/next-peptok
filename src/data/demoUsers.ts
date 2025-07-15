import { User, CoachingRequest } from "../types";

export interface DemoUser extends User {
  password: string;
  bio?: string;
  skills?: string[];
  experience?: number;
  rating?: number;
  totalRatings?: number;
  hourlyRate?: number;
}

// Demo users for the platform demonstration
export const demoUsers: DemoUser[] = [
  {
    id: "user_023",
    email: "admin@techcorp.com",
    password: "emp123",
    name: "Sarah Johnson",
    firstName: "Sarah",
    lastName: "Johnson",
    userType: "company_admin",
    companyId: "comp_001",
    picture:
      "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah-johnson-emp",
    provider: "email",
    joinedAt: "2024-01-20T00:00:00Z",
    lastActive: "2024-03-15T16:25:00Z",
    status: "active",
    company: "TechCorp Inc",
  },
  {
    id: "user_004",
    email: "coach@marketing.com",
    password: "coach123",
    name: "Daniel Hayes",
    firstName: "Daniel",
    lastName: "Hayes",
    userType: "coach",
    picture:
      "https://images.unsplash.com/photo-1494790108755-2616b612b1-3c?w=150",
    provider: "email",
    bio: "Senior marketing strategist and sales consultant with over 10 years of experience in building sales funnels and optimizing customer segmentation.",
    skills: [
      "Marketing",
      "Sales Funnel Optimization",
      "Persuasion and Negotiation",
      "Customer Segmentation",
    ],
    experience: 10,
    rating: 4.9,
    totalRatings: 127,
    hourlyRate: 180,
    joinedAt: "2024-01-15T00:00:00Z",
    lastActive: "2024-03-15T17:30:00Z",
    status: "active",
  },
];

// Demo coaching request data for Sarah's use case
export const demoCoachingRequest: CoachingRequest = {
  id: "req_001",
  companyId: "comp_001",
  title: "Sales and Marketing Development",
  description:
    "Department-wide coaching program designed to build up soft and hard sales and marketing skills to improve sales pipeline conversion.",
  goals: [
    {
      id: "goal_001",
      title: "Sales",
      description:
        "Identify customer needs, craft tailored solutions, and guide prospects through a decision-making process to close deals",
      category: "business" as const,
      priority: "high" as const,
    },
    {
      id: "goal_002",
      title: "Marketing",
      description:
        "Understand customer behavior, create compelling messages, and deliver them through the right channels to attract, engage, and retain target audiences",
      category: "business" as const,
      priority: "medium" as const,
    },
    {
      id: "goal_003",
      title: "Negotiation",
      description:
        "Balance persuasion, active listening, and problem-solving to align value with client priorities, and secure win-win agreements that advance deals",
      category: "leadership" as const,
      priority: "high" as const,
    },
  ],
  metricsToTrack: [
    "Sales conversion rate",
    "Lead generation",
    "Customer engagement",
    "Negotiation success rate",
  ],
  teamMembers: [
    {
      id: "team_001",
      name: "Sarah Johnson",
      email: "admin@techcorp.com",
      role: "admin",
      status: "accepted",
      invitedAt: "2024-03-15T10:00:00Z",
      acceptedAt: "2024-03-15T10:00:00Z",
    },
  ],
  preferredExpertise: [
    "Marketing",
    "Sales Funnel Optimization",
    "Persuasion and Negotiation",
    "Customer Segmentation",
  ],
  budget: {
    min: 15000,
    max: 30000,
  },
  timeline: {
    startDate: "2024-04-01T00:00:00Z",
    endDate: "2024-07-15T00:00:00Z",
    sessionFrequency: "weekly" as const,
  },
  status: "draft",
  createdAt: "2024-03-15T16:30:00Z",
  updatedAt: "2024-03-15T16:30:00Z",
};

// Demo company data
export const demoCompany = {
  id: "comp_001",
  name: "TechCorp Inc",
  industry: "Technology",
  size: "medium" as const,
  adminId: "user_023",
  employeeCount: 125,
  activePrograms: 0,
  totalSessions: 0,
  subscriptionTier: "professional",
  status: "active" as const,
  joinedAt: "2024-01-20T00:00:00Z",
};

// Demo dashboard stats for Sarah (empty/initial state)
export const demoCompanyDashboardStats = {
  activeSessions: 0,
  activeCoaching: 0,
  goalsProgress: 0,
  totalHours: 0.0,
  coachingRequests: [] as CoachingRequest[],
  upcomingSessions: [] as any[],
  recentActivity: [] as any[],
};

// Helper function to find demo user by email and password
export const findDemoUser = (
  email: string,
  password: string,
): DemoUser | null => {
  return (
    demoUsers.find(
      (user) => user.email === email && user.password === password,
    ) || null
  );
};

// Helper function to get demo data by user
export const getDemoDataForUser = (user: DemoUser) => {
  if (user.userType === "team_member" && user.companyId === "comp_001") {
    return {
      company: demoCompany,
      dashboardStats: demoCompanyDashboardStats,
      coachingRequest: demoCoachingRequest,
    };
  }

  return null;
};
