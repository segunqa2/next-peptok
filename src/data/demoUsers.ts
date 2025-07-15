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

// Demo coaching request for the dashboard (exact specification)
const demoCoachingRequestForDashboard = {
  id: "req_001",
  title: "Sales and Marketing Development",
  description:
    "Department-wide coaching program designed to build up soft and hard sales and marketing skills to improve sales pipeline conversion.",
  goals: [
    {
      title: "Sales",
      description:
        "Identify customer needs, craft tailored solutions, and guide prospects through a decision-making process to close deals",
      category: "business" as const,
      priority: "high" as const,
    },
    {
      title: "Marketing",
      description:
        "Understand customer behavior, create compelling messages, and deliver them through the right channels to attract, engage, and retain target audiences",
      category: "business" as const,
      priority: "medium" as const,
    },
    {
      title: "Negotiation",
      description:
        "Balance persuasion, active listening, and problem-solving to align value with client priorities, and secure win-win agreements that advance deals",
      category: "leadership" as const,
      priority: "high" as const,
    },
  ],
  skills: [
    "Marketing",
    "Sales Funnel Optimization",
    "Persuasion and Negotiation",
    "Customer Segmentation",
  ],
  timeline: "16 weeks",
  participantGoal: 5,
  budgetMin: 15000,
  budgetMax: 30000,
  // Additional fields for compatibility
  companyId: "comp_001",
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
  timelineDetails: {
    startDate: "2024-07-16T00:00:00Z",
    endDate: "2024-10-30T00:00:00Z",
    sessionFrequency: "weekly" as const,
  },
  status: "submitted",
  createdAt: "2024-03-15T16:30:00Z",
  updatedAt: "2024-03-15T16:30:00Z",
};

// Demo coaches with Daniel at the top
export const demoCoaches = [
  {
    id: "user_004",
    name: "Daniel Hayes",
    title: "Senior Marketing Strategist",
    company: "Independent",
    avatar:
      "https://images.unsplash.com/photo-1494790108755-2616b612b1-3c?w=150",
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
    matchScore: 98,
    responseRate: 95,
    monthlyEarnings: 12500,
    totalSessions: 245,
    successRate: 92,
  },
  {
    id: "coach_002",
    name: "Emily Rodriguez",
    title: "Sales Performance Coach",
    company: "SalesForce Excellence",
    avatar:
      "https://images.unsplash.com/photo-1494790108755-2616b9d3cc57?w=150",
    bio: "Specializes in sales team transformation and negotiation training with Fortune 500 experience.",
    skills: ["Sales", "Negotiation", "Team Leadership", "Performance Coaching"],
    experience: 8,
    rating: 4.8,
    totalRatings: 89,
    hourlyRate: 165,
    matchScore: 89,
    responseRate: 88,
    monthlyEarnings: 9800,
    totalSessions: 178,
    successRate: 87,
  },
  {
    id: "coach_003",
    name: "Marcus Thompson",
    title: "Marketing & Sales Consultant",
    company: "Growth Partners",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    bio: "Expert in integrated marketing and sales strategies for B2B companies.",
    skills: [
      "Marketing Strategy",
      "Sales Pipeline",
      "Customer Acquisition",
      "Lead Generation",
    ],
    experience: 7,
    rating: 4.7,
    totalRatings: 156,
    hourlyRate: 155,
    matchScore: 85,
    responseRate: 91,
    monthlyEarnings: 8900,
    totalSessions: 198,
    successRate: 84,
  },
  {
    id: "coach_004",
    name: "Lisa Chen",
    title: "Digital Marketing Specialist",
    company: "MarketPro Solutions",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
    bio: "Focus on digital marketing strategies and customer segmentation analytics.",
    skills: [
      "Digital Marketing",
      "Customer Segmentation",
      "Analytics",
      "Conversion Optimization",
    ],
    experience: 6,
    rating: 4.6,
    totalRatings: 92,
    hourlyRate: 145,
    matchScore: 82,
    responseRate: 86,
    monthlyEarnings: 7600,
    totalSessions: 134,
    successRate: 81,
  },
  {
    id: "coach_005",
    name: "Robert Kim",
    title: "Sales Negotiation Expert",
    company: "NegotiateWin Consulting",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    bio: "Specialized in high-stakes sales negotiations and closing techniques.",
    skills: [
      "Negotiation",
      "Sales Closing",
      "Client Relations",
      "Deal Structuring",
    ],
    experience: 9,
    rating: 4.5,
    totalRatings: 67,
    hourlyRate: 170,
    matchScore: 79,
    responseRate: 82,
    monthlyEarnings: 8200,
    totalSessions: 156,
    successRate: 78,
  },
  {
    id: "coach_006",
    name: "Amanda Foster",
    title: "Marketing Communication Coach",
    company: "Communicate Plus",
    avatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
    bio: "Expert in marketing communications and persuasive messaging strategies.",
    skills: [
      "Marketing Communication",
      "Persuasion",
      "Content Strategy",
      "Brand Messaging",
    ],
    experience: 5,
    rating: 4.4,
    totalRatings: 78,
    hourlyRate: 135,
    matchScore: 76,
    responseRate: 89,
    monthlyEarnings: 6800,
    totalSessions: 112,
    successRate: 76,
  },
  {
    id: "coach_007",
    name: "James Wilson",
    title: "Sales Funnel Optimizer",
    company: "Conversion Masters",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150",
    bio: "Specializes in optimizing sales funnels and improving conversion rates.",
    skills: [
      "Sales Funnel Optimization",
      "Conversion Rate",
      "Lead Nurturing",
      "Sales Automation",
    ],
    experience: 4,
    rating: 4.3,
    totalRatings: 54,
    hourlyRate: 125,
    matchScore: 74,
    responseRate: 85,
    monthlyEarnings: 5900,
    totalSessions: 89,
    successRate: 73,
  },
  {
    id: "coach_008",
    name: "Sarah Martinez",
    title: "Customer Success Coach",
    company: "Success Strategies",
    avatar:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150",
    bio: "Focuses on customer success strategies and retention optimization.",
    skills: [
      "Customer Success",
      "Retention",
      "Customer Journey",
      "Relationship Building",
    ],
    experience: 6,
    rating: 4.2,
    totalRatings: 43,
    hourlyRate: 140,
    matchScore: 72,
    responseRate: 87,
    monthlyEarnings: 6200,
    totalSessions: 98,
    successRate: 71,
  },
  {
    id: "coach_009",
    name: "David Park",
    title: "Business Development Coach",
    company: "GrowthLab Consulting",
    avatar:
      "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150",
    bio: "Expert in business development strategies and market expansion.",
    skills: [
      "Business Development",
      "Market Analysis",
      "Strategic Planning",
      "Partnership Development",
    ],
    experience: 8,
    rating: 4.1,
    totalRatings: 61,
    hourlyRate: 150,
    matchScore: 70,
    responseRate: 83,
    monthlyEarnings: 7100,
    totalSessions: 128,
    successRate: 69,
  },
  {
    id: "coach_010",
    name: "Jennifer Lee",
    title: "Sales Training Specialist",
    company: "TrainToWin Solutions",
    avatar:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150",
    bio: "Specializes in sales team training and performance improvement programs.",
    skills: [
      "Sales Training",
      "Team Development",
      "Performance Coaching",
      "Skill Assessment",
    ],
    experience: 7,
    rating: 4.0,
    totalRatings: 38,
    hourlyRate: 130,
    matchScore: 69,
    responseRate: 80,
    monthlyEarnings: 5400,
    totalSessions: 87,
    successRate: 68,
  },
];

// Session schedule for Sarah (Wed 10am from July 16 to last Wed of July)
export const demoSessionScheduleSarah = [
  {
    id: "session_001",
    date: "2024-07-17",
    time: "10:00",
    day: "Wed",
    title: "Session 1: Sales Fundamentals",
  },
  {
    id: "session_002",
    date: "2024-07-24",
    time: "10:00",
    day: "Wed",
    title: "Session 2: Marketing Strategies",
  },
  {
    id: "session_003",
    date: "2024-07-31",
    time: "10:00",
    day: "Wed",
    title: "Session 3: Negotiation Mastery",
  },
];

// Session schedule for Daniel (same but last session on Mon 28)
export const demoSessionScheduleDaniel = [
  {
    id: "session_001",
    date: "2024-07-17",
    time: "10:00",
    day: "Wed",
    title: "Session 1: Sales Fundamentals",
  },
  {
    id: "session_002",
    date: "2024-07-24",
    time: "10:00",
    day: "Wed",
    title: "Session 2: Marketing Strategies",
  },
  {
    id: "session_003",
    date: "2024-07-29",
    time: "10:00",
    day: "Mon",
    title: "Session 3: Negotiation Mastery",
  },
];

// Demo dashboard stats for Sarah (with the coaching request)
export const demoCompanyDashboardStats = {
  activeSessions: 0,
  activeCoaching: 0,
  goalsProgress: 0,
  totalHours: 0.0,
  coachingRequests: [demoCoachingRequestForDashboard],
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

// Demo dashboard stats for Daniel (coach view)
export const demoCoachDashboardStats = {
  coachingRequests: [demoCoachingRequestForDashboard],
  sessionSchedule: demoSessionScheduleDaniel,
  coaches: demoCoaches,
  monthlyEarnings: 12500,
  responseRate: 95,
  totalSessions: 245,
  successRate: 92,
};

// Helper function to get demo data by user
export const getDemoDataForUser = (user: DemoUser) => {
  if (user.userType === "company_admin" && user.companyId === "comp_001") {
    return {
      company: demoCompany,
      dashboardStats: demoCompanyDashboardStats,
      coachingRequest: demoCoachingRequestForDashboard,
      coaches: demoCoaches,
      sessionSchedule: demoSessionScheduleSarah,
    };
  }

  if (user.userType === "coach" && user.id === "user_004") {
    return {
      dashboardStats: demoCoachDashboardStats,
      coachingRequest: demoCoachingRequestForDashboard,
      coaches: demoCoaches,
      sessionSchedule: demoSessionScheduleDaniel,
    };
  }

  return null;
};
