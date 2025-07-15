/**
 * ⚠️  DEPRECATED: This file contains hardcoded mock data that should not be used in production.
 *
 * Please use real backend API calls instead:
 * - companyDashboardApi.getDashboardMetrics() for dashboard data
 * - Backend API endpoints for sessions, programs, etc.
 * - Remove localStorage dependencies
 *
 * This file will be removed in a future cleanup.
 */

import {
  Coach,
  Enterprise,
  Connection,
  MetricDefinition,
  DashboardStats,
  Skill,
} from "@/types";

// Warn when this file is imported
console.warn(
  "⚠️  WARNING: Using deprecated mock data. Please use real API calls instead.",
);

export const mockSkills: Skill[] = [
  {
    id: "1",
    name: "Leadership",
    category: "Management",
    level: "intermediate",
  },
  { id: "2", name: "Data Analysis", category: "Technical", level: "advanced" },
  {
    id: "3",
    name: "Project Management",
    category: "Management",
    level: "expert",
  },
  {
    id: "4",
    name: "Software Development",
    category: "Technical",
    level: "expert",
  },
  {
    id: "5",
    name: "Marketing Strategy",
    category: "Business",
    level: "advanced",
  },
  { id: "6", name: "Financial Planning", category: "Finance", level: "expert" },
  { id: "7", name: "Sales Management", category: "Sales", level: "advanced" },
  { id: "8", name: "Product Strategy", category: "Product", level: "expert" },
];

export const mockCoaches: Coach[] = [
  {
    id: "1",
    name: "Sarah Chen",
    title: "Former VP of Engineering",
    company: "Ex-Google",
    coaching: ["Leadership", "Software Development", "Team Building"],
    experience: 25,
    avatar:
      "https://images.unsplash.com/photo-1494790108755-2616b9d3cc57?w=400&h=400&fit=crop&crop=face",
    bio: "Former VP of Engineering at Google with 25 years of experience building world-class engineering teams. Specialized in scaling organizations and technical leadership.",
    rating: 4.9,
    totalSessions: 150,
    availableSlots: ["Monday 10:00 AM", "Wednesday 2:00 PM", "Friday 11:00 AM"],
    skills: [mockSkills[0], mockSkills[3]],
  },
  {
    id: "2",
    name: "Michael Rodriguez",
    title: "Former Chief Data Officer",
    company: "Ex-Netflix",
    coaching: ["Data Analysis", "Business Intelligence", "Strategy"],
    experience: 20,
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    bio: "Led data initiatives at Netflix during their global expansion. Expert in building data-driven cultures and analytics teams.",
    rating: 4.8,
    totalSessions: 120,
    availableSlots: ["Tuesday 9:00 AM", "Thursday 1:00 PM", "Friday 3:00 PM"],
    skills: [mockSkills[1], mockSkills[2]],
  },
  {
    id: "3",
    name: "Jennifer Park",
    title: "Former CMO",
    company: "Ex-Airbnb",
    coaching: ["Marketing Strategy", "Brand Building", "Growth"],
    experience: 18,
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
    bio: "Built Airbnb's global marketing strategy and brand presence. Specializes in growth marketing and brand development.",
    rating: 4.9,
    totalSessions: 200,
    availableSlots: [
      "Monday 2:00 PM",
      "Wednesday 10:00 AM",
      "Thursday 4:00 PM",
    ],
    skills: [mockSkills[4], mockSkills[0]],
  },
  {
    id: "4",
    name: "Robert Thompson",
    title: "Former CFO",
    company: "Ex-Tesla",
    coaching: ["Financial Planning", "Strategic Finance", "Operations"],
    experience: 22,
    avatar:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face",
    bio: "Former CFO at Tesla with expertise in scaling finance operations and strategic planning for high-growth companies.",
    rating: 4.7,
    totalSessions: 95,
    availableSlots: ["Tuesday 11:00 AM", "Thursday 9:00 AM", "Friday 2:00 PM"],
    skills: [mockSkills[5], mockSkills[2]],
  },
  {
    id: "5",
    name: "Lisa Zhang",
    title: "Former Head of Product",
    company: "Ex-Uber",
    coaching: ["Product Strategy", "User Experience", "Innovation"],
    experience: 15,
    avatar:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop&crop=face",
    bio: "Led product development at Uber across multiple markets. Expert in product strategy and user-centered design.",
    rating: 4.8,
    totalSessions: 130,
    availableSlots: ["Monday 9:00 AM", "Wednesday 3:00 PM", "Friday 10:00 AM"],
    skills: [mockSkills[7], mockSkills[0]],
  },
  {
    id: "6",
    name: "David Kim",
    title: "Former VP of Sales",
    company: "Ex-Salesforce",
    coaching: ["Sales Management", "Team Leadership", "Revenue Growth"],
    experience: 19,
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    bio: "Built and led global sales teams at Salesforce. Specializes in sales strategy and high-performance team development.",
    rating: 4.6,
    totalSessions: 110,
    availableSlots: ["Tuesday 10:00 AM", "Thursday 2:00 PM", "Friday 9:00 AM"],
    skills: [mockSkills[6], mockSkills[0]],
  },
];

export const mockEnterprises: Enterprise[] = [
  {
    id: "1",
    name: "Alex Johnson",
    title: "Software Engineer",
    department: "Engineering",
    avatar:
      "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&h=400&fit=crop&crop=face",
    goals: ["Improve leadership skills", "Learn system design"],
    currentCoaches: [mockCoaches[0]],
  },
  {
    id: "2",
    name: "Emily Davis",
    title: "Data Analyst",
    department: "Analytics",
    avatar:
      "https://images.unsplash.com/photo-1494790108755-2616b9d3cc57?w=400&h=400&fit=crop&crop=face",
    goals: ["Advanced analytics", "Business intelligence"],
    currentCoaches: [mockCoaches[1]],
  },
];

export const mockConnections: Connection[] = [
  {
    id: "1",
    coach: mockCoaches[0],
    enterprise: mockEnterprises[0],
    startDate: "2024-01-15",
    status: "active",
    sessionsCompleted: 8,
    totalSessions: 12,
    progress: 67,
    nextSessionDate: "2024-02-20",
    goals: ["Improve leadership skills", "Learn system design"],
  },
  {
    id: "2",
    coach: mockCoaches[1],
    enterprise: mockEnterprises[1],
    startDate: "2024-01-10",
    status: "active",
    sessionsCompleted: 5,
    totalSessions: 10,
    progress: 50,
    nextSessionDate: "2024-02-18",
    goals: ["Advanced analytics", "Business intelligence"],
  },
];

export const mockMetrics: MetricDefinition[] = [
  {
    id: "1",
    name: "Employee Engagement",
    description: "Percentage of employees actively participating in mentorship",
    targetValue: 85,
    currentValue: 78,
    unit: "%",
    category: "engagement",
  },
  {
    id: "2",
    name: "Skill Development Score",
    description: "Average improvement in skill assessments",
    targetValue: 4.0,
    currentValue: 3.7,
    unit: "/5",
    category: "skill_development",
  },
  {
    id: "3",
    name: "Session Completion Rate",
    description: "Percentage of scheduled sessions completed",
    targetValue: 95,
    currentValue: 92,
    unit: "%",
    category: "performance",
  },
  {
    id: "4",
    name: "Employee Retention",
    description: "Annual employee retention rate",
    targetValue: 95,
    currentValue: 88,
    unit: "%",
    category: "retention",
  },
];

export const mockDashboardStats: DashboardStats = {
  totalExperts: 150,
  activeConnections: 342,
  completedSessions: 1250,
  averageRating: 4.7,
  employeeEngagement: 78,
  skillsImproved: 89,
};
