/**
 * User Personas for Coaching Platform Validation
 * These personas align with the validation requirements for testing user journeys
 */

export interface UserPersona {
  id: string;
  name: string;
  email: string;
  role: "admin" | "coach" | "participant" | "enterprise";
  avatar?: string;
  background: string;
  goals: string[];
  painPoints: string[];
  demographics: {
    age: number;
    location: string;
    experience: string;
    industry?: string;
  };
  techProficiency: "low" | "medium" | "high";
  usage: {
    frequency: string;
    primaryFeatures: string[];
    devicePreference: string[];
  };
  validationScenarios: string[];
}

// Company Admin Persona
export const sarahAdminPersona: UserPersona = {
  id: "admin-sarah-001",
  name: "Sarah Johnson",
  email: "sarah.johnson@techcorp.com",
  role: "admin",
  avatar:
    "https://images.unsplash.com/photo-1494790108755-2616b612b123?w=100&h=100&fit=crop&crop=face",
  background:
    "VP of People Operations at a 500-person tech company. Responsible for employee development programs and coaching initiatives.",
  goals: [
    "Create effective coaching programs for leadership development",
    "Track ROI of coaching investments",
    "Match employees with the right coaches",
    "Scale coaching across the organization",
    "Ensure compliance with company policies",
  ],
  painPoints: [
    "Difficulty finding qualified coaches for specific skills",
    "Tracking program effectiveness and metrics",
    "Managing budget constraints",
    "Ensuring consistent quality across coaches",
    "Coordinating schedules across time zones",
  ],
  demographics: {
    age: 42,
    location: "San Francisco, CA",
    experience: "15+ years in HR/People Operations",
    industry: "Technology",
  },
  techProficiency: "high",
  usage: {
    frequency: "Daily",
    primaryFeatures: [
      "Admin dashboard",
      "Coach management",
      "Program creation",
      "Analytics & reporting",
      "Budget tracking",
    ],
    devicePreference: ["Desktop", "Tablet"],
  },
  validationScenarios: [
    "Create new coaching program with specific KPIs",
    "Invite and assign team members to coaches",
    "Monitor program progress and adjust parameters",
    "Generate reports for executive leadership",
    "Manage coach approvals and rejections",
  ],
};

// Coach Persona
export const danielCoachPersona: UserPersona = {
  id: "coach-daniel-001",
  name: "Daniel Rodriguez",
  email: "daniel.rodriguez@coachingpro.com",
  role: "coach",
  avatar:
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
  background:
    "Senior Leadership Coach with 12 years experience. Specializes in executive coaching, team dynamics, and career transitions.",
  goals: [
    "Build a sustainable coaching practice",
    "Help clients achieve meaningful career growth",
    "Maintain work-life balance",
    "Expand expertise into new areas",
    "Build long-term client relationships",
  ],
  painPoints: [
    "Inconsistent client flow",
    "Administrative overhead",
    "Pricing and payment complexities",
    "Managing multiple client schedules",
    "Proving coaching ROI to organizations",
  ],
  demographics: {
    age: 38,
    location: "Austin, TX",
    experience: "12 years in professional coaching",
    industry: "Professional Services",
  },
  techProficiency: "medium",
  usage: {
    frequency: "Daily",
    primaryFeatures: [
      "Coach dashboard",
      "Session scheduling",
      "Client communication",
      "Performance tracking",
      "Payment management",
    ],
    devicePreference: ["Desktop", "Mobile", "Tablet"],
  },
  validationScenarios: [
    "Accept coaching program invitation",
    "Review client profiles and set pricing",
    "Schedule and conduct video sessions",
    "Track client progress and provide feedback",
    "Manage availability and session limits",
  ],
};

// Participant Personas (Team Members)
export const participantPersonas: UserPersona[] = [
  {
    id: "participant-alex-001",
    name: "Alex Chen",
    email: "alex.chen@techcorp.com",
    role: "participant",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    background:
      "Senior Software Engineer looking to transition into tech leadership. Recently promoted to team lead.",
    goals: [
      "Develop leadership and communication skills",
      "Learn to manage and motivate team members",
      "Navigate technical decision-making as a leader",
      "Build confidence in presentations and stakeholder management",
    ],
    painPoints: [
      "Imposter syndrome in leadership role",
      "Balancing technical work with management",
      "Difficulty giving constructive feedback",
      "Time management challenges",
    ],
    demographics: {
      age: 29,
      location: "Seattle, WA",
      experience: "6 years in software development",
      industry: "Technology",
    },
    techProficiency: "high",
    usage: {
      frequency: "Weekly",
      primaryFeatures: [
        "Session dashboard",
        "Progress tracking",
        "Goal setting",
        "Coach communication",
        "Resource library",
      ],
      devicePreference: ["Mobile", "Desktop"],
    },
    validationScenarios: [
      "Join coaching program via invite link",
      "Complete initial assessment and goal setting",
      "Schedule first session with matched coach",
      "Participate in video coaching session",
      "Track progress and milestones",
    ],
  },
  {
    id: "participant-maria-002",
    name: "Maria Santos",
    email: "maria.santos@techcorp.com",
    role: "participant",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    background:
      "Product Manager with 4 years experience. Wants to improve cross-functional collaboration and stakeholder management.",
    goals: [
      "Enhance stakeholder communication skills",
      "Learn advanced product strategy",
      "Improve data-driven decision making",
      "Build stronger engineering partnerships",
    ],
    painPoints: [
      "Managing conflicting priorities",
      "Communicating technical concepts to non-technical stakeholders",
      "Balancing user needs with business constraints",
    ],
    demographics: {
      age: 31,
      location: "New York, NY",
      experience: "4 years in product management",
      industry: "Technology",
    },
    techProficiency: "high",
    usage: {
      frequency: "Bi-weekly",
      primaryFeatures: [
        "Session scheduling",
        "Goal tracking",
        "Progress visualization",
        "Coach messaging",
        "Resource downloads",
      ],
      devicePreference: ["Desktop", "Mobile"],
    },
    validationScenarios: [
      "Access coaching dashboard on mobile device",
      "Set and track quarterly goals",
      "Reschedule session due to conflict",
      "Share session notes with manager",
      "Rate and provide feedback on coaching sessions",
    ],
  },
  {
    id: "participant-james-003",
    name: "James Wilson",
    email: "james.wilson@techcorp.com",
    role: "participant",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
    background:
      "Sales Director aiming to develop executive presence and strategic thinking for VP-level promotion.",
    goals: [
      "Develop executive presence and communication",
      "Learn strategic planning and execution",
      "Build influence across the organization",
      "Prepare for C-suite interactions",
    ],
    painPoints: [
      "Public speaking anxiety",
      "Difficulty influencing without authority",
      "Balancing short-term results with long-term strategy",
    ],
    demographics: {
      age: 35,
      location: "Chicago, IL",
      experience: "8 years in sales leadership",
      industry: "Technology",
    },
    techProficiency: "medium",
    usage: {
      frequency: "Weekly",
      primaryFeatures: [
        "Video sessions",
        "Progress reports",
        "Skill assessments",
        "Action plan tracking",
        "Calendar integration",
      ],
      devicePreference: ["Desktop", "Tablet"],
    },
    validationScenarios: [
      "Complete 360-degree feedback assessment",
      "Work with coach on presentation skills",
      "Track progress on leadership competencies",
      "Schedule sessions around travel schedule",
      "Access coaching materials offline",
    ],
  },
  {
    id: "participant-lisa-004",
    name: "Lisa Park",
    email: "lisa.park@techcorp.com",
    role: "participant",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face",
    background:
      "Marketing Manager transitioning to a more senior role with broader responsibilities and team management.",
    goals: [
      "Develop team leadership and management skills",
      "Learn budget management and strategic planning",
      "Improve cross-departmental collaboration",
      "Build personal brand and thought leadership",
    ],
    painPoints: [
      "First-time people management challenges",
      "Difficulty delegating effectively",
      "Balancing creative work with administrative duties",
    ],
    demographics: {
      age: 28,
      location: "Los Angeles, CA",
      experience: "5 years in marketing",
      industry: "Technology",
    },
    techProficiency: "high",
    usage: {
      frequency: "Bi-weekly",
      primaryFeatures: [
        "Mobile app",
        "Progress tracking",
        "Resource library",
        "Peer connections",
        "Goal visualization",
      ],
      devicePreference: ["Mobile", "Desktop"],
    },
    validationScenarios: [
      "Use mobile app for quick check-ins",
      "Connect with other program participants",
      "Access coaching resources on-the-go",
      "Share achievements on internal social platform",
      "Complete micro-learning modules between sessions",
    ],
  },
  {
    id: "participant-david-005",
    name: "David Thompson",
    email: "david.thompson@techcorp.com",
    role: "participant",
    avatar:
      "https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=100&h=100&fit=crop&crop=face",
    background:
      "Operations Manager focusing on process improvement and team efficiency. Preparing for director-level role.",
    goals: [
      "Develop systems thinking and process optimization",
      "Learn change management and organizational development",
      "Improve data analysis and reporting skills",
      "Build influence and stakeholder management abilities",
    ],
    painPoints: [
      "Resistance to change from team members",
      "Difficulty quantifying operational improvements",
      "Balancing efficiency with employee satisfaction",
    ],
    demographics: {
      age: 33,
      location: "Denver, CO",
      experience: "7 years in operations",
      industry: "Technology",
    },
    techProficiency: "medium",
    usage: {
      frequency: "Weekly",
      primaryFeatures: [
        "Analytics dashboard",
        "Progress metrics",
        "Session recordings",
        "Action item tracking",
        "Reporting tools",
      ],
      devicePreference: ["Desktop", "Tablet"],
    },
    validationScenarios: [
      "Track and analyze coaching ROI metrics",
      "Use dashboard analytics for progress reporting",
      "Schedule group coaching sessions with peers",
      "Export progress reports for manager review",
      "Integrate coaching goals with performance reviews",
    ],
  },
];

// Combined personas for easy access
export const allPersonas = {
  admin: sarahAdminPersona,
  coach: danielCoachPersona,
  participants: participantPersonas,
};

export const getAllPersonas = (): UserPersona[] => [
  sarahAdminPersona,
  danielCoachPersona,
  ...participantPersonas,
];

// Validation test data generator
export const generateTestData = () => ({
  users: getAllPersonas(),
  testScenarios: getAllPersonas().flatMap((persona) =>
    persona.validationScenarios.map((scenario) => ({
      personaId: persona.id,
      personaName: persona.name,
      scenario,
      userType: persona.role,
    })),
  ),
  userJourneys: {
    adminOnboarding: [
      "Create company account",
      "Set up coaching program",
      "Invite team members",
      "Configure KPIs and goals",
      "Launch program",
    ],
    coachOnboarding: [
      "Receive program invitation",
      "Complete profile setup",
      "Set availability and pricing",
      "Accept program participation",
      "Begin coaching sessions",
    ],
    participantJourney: [
      "Receive coaching invitation",
      "Complete initial assessment",
      "Get matched with coach",
      "Schedule first session",
      "Begin coaching program",
      "Track progress and goals",
    ],
  },
});
