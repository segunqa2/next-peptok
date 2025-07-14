import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle,
  X,
  Clock,
  Calendar,
  Users,
  Star,
  TrendingUp,
  MessageCircle,
  Video,
  DollarSign,
  Award,
  Bell,
} from "lucide-react";
import Header from "../../components/layout/Header";
import { useAuth } from "../../contexts/AuthContext";
import { MentorshipRequest } from "../../types";
import { Session } from "../../types/session";
import { toast } from "react-hot-toast";

interface PendingRequest {
  id: string;
  title: string;
  company: string;
  description: string;
  goals: string[];
  teamSize: number;
  urgency: "low" | "medium" | "high";
  budget?: number;
  preferredSchedule: string;
  submittedAt: Date;
}

interface MentorStats {
  totalSessions: number;
  completedSessions: number;
  averageRating: number;
  totalEarnings: number;
  upcomingSessions: number;
  responseTime: number;
  successRate: number;
}

export const MentorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<MentorStats>({
    totalSessions: 0,
    completedSessions: 0,
    averageRating: 0,
    totalEarnings: 0,
    upcomingSessions: 0,
    responseTime: 0,
    successRate: 0,
  });
  const [activeTab, setActiveTab] = useState<
    "requests" | "sessions" | "earnings" | "profile"
  >("requests");
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      type: "request" | "session" | "payment";
      message: string;
      timestamp: Date;
      read: boolean;
    }>
  >([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Mock data - replace with actual API calls
      const mockPendingRequests: PendingRequest[] = [
        {
          id: "req_1",
          title: "React Development Mentorship",
          company: "TechStart Inc.",
          description:
            "Looking for guidance on React best practices and architecture for our growing team.",
          goals: [
            "Component Architecture",
            "State Management",
            "Performance Optimization",
          ],
          teamSize: 5,
          urgency: "high",
          budget: 150,
          preferredSchedule: "Weekday evenings",
          submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
        {
          id: "req_2",
          title: "Full-Stack Development Guidance",
          company: "Digital Solutions LLC",
          description:
            "Need mentorship for junior developers working on a full-stack web application.",
          goals: ["API Design", "Database Optimization", "Testing Strategies"],
          teamSize: 3,
          urgency: "medium",
          budget: 120,
          preferredSchedule: "Flexible",
          submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
        {
          id: "req_3",
          title: "Cloud Architecture Review",
          company: "Enterprise Corp",
          description:
            "Seeking expert advice on migrating to cloud infrastructure.",
          goals: ["AWS Migration", "Scalability Planning", "Cost Optimization"],
          teamSize: 8,
          urgency: "low",
          budget: 200,
          preferredSchedule: "Morning hours",
          submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
      ];

      const mockStats: MentorStats = {
        totalSessions: 47,
        completedSessions: 43,
        averageRating: 4.8,
        totalEarnings: 7850,
        upcomingSessions: 4,
        responseTime: 3.2,
        successRate: 91.5,
      };

      const mockNotifications = [
        {
          id: "notif_1",
          type: "request" as const,
          message: "New mentorship request from TechStart Inc.",
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          read: false,
        },
        {
          id: "notif_2",
          type: "session" as const,
          message: "Session reminder: React Workshop in 2 hours",
          timestamp: new Date(Date.now() - 60 * 60 * 1000),
          read: false,
        },
        {
          id: "notif_3",
          type: "payment" as const,
          message: "Payment received: $150 for session with Digital Solutions",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          read: true,
        },
      ];

      setPendingRequests(mockPendingRequests);
      setStats(mockStats);
      setNotifications(mockNotifications);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      // TODO: Call API to accept request
      setPendingRequests((prev) => prev.filter((req) => req.id !== requestId));
      toast.success("Mentorship request accepted!");
    } catch (error) {
      console.error("Error accepting request:", error);
      toast.error("Failed to accept request");
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      // TODO: Call API to decline request
      setPendingRequests((prev) => prev.filter((req) => req.id !== requestId));
      toast.success("Request declined");
    } catch (error) {
      console.error("Error declining request:", error);
      toast.error("Failed to decline request");
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
          <span className="ml-3 text-gray-600">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.firstName}!
              </h1>
              <p className="text-gray-600 mt-2">
                Manage your mentorship requests and sessions
              </p>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Bell className="w-6 h-6" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Video className="w-8 h-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Sessions
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalSessions}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Star className="w-8 h-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Average Rating
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.averageRating.toFixed(1)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Earnings
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${stats.totalEarnings.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Success Rate
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.successRate}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              {
                id: "requests",
                label: "Pending Requests",
                count: pendingRequests.length,
              },
              {
                id: "sessions",
                label: "Upcoming Sessions",
                count: stats.upcomingSessions,
              },
              { id: "earnings", label: "Earnings" },
              { id: "profile", label: "Profile" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === "requests" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Pending Mentorship Requests
              </h2>

              {pendingRequests.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No pending requests
                  </h3>
                  <p className="text-gray-600">
                    New mentorship requests will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-white rounded-lg border border-gray-200 p-6"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {request.title}
                            </h3>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(request.urgency)}`}
                            >
                              {request.urgency} priority
                            </span>
                          </div>

                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                            <span className="font-medium">
                              {request.company}
                            </span>
                            <span>•</span>
                            <span className="flex items-center space-x-1">
                              <Users className="w-4 h-4" />
                              <span>{request.teamSize} members</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{formatTimeAgo(request.submittedAt)}</span>
                            </span>
                          </div>

                          <p className="text-gray-700 mb-3">
                            {request.description}
                          </p>

                          <div className="flex items-center space-x-4 mb-4">
                            <div>
                              <span className="text-sm font-medium text-gray-600">
                                Goals:
                              </span>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {request.goals.map((goal, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs"
                                  >
                                    {goal}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-6 text-sm text-gray-600">
                            {request.budget && (
                              <div className="flex items-center space-x-1">
                                <DollarSign className="w-4 h-4" />
                                <span>${request.budget}/hour</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{request.preferredSchedule}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex space-x-3 ml-6">
                          <button
                            onClick={() => handleDeclineRequest(request.id)}
                            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <X className="w-4 h-4" />
                            <span>Decline</span>
                          </button>
                          <button
                            onClick={() => handleAcceptRequest(request.id)}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Accept</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "sessions" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Upcoming Sessions
              </h2>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <p className="text-gray-600">
                  Upcoming sessions will be displayed here.
                </p>
              </div>
            </div>
          )}

          {activeTab === "earnings" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Earnings Overview
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-600">
                      This Month
                    </span>
                  </div>
                  <p className="text-2xl font-semibold text-gray-900">$1,350</p>
                  <p className="text-sm text-green-600">+15% from last month</p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <Award className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-600">
                      Average/Session
                    </span>
                  </div>
                  <p className="text-2xl font-semibold text-gray-900">$167</p>
                  <p className="text-sm text-blue-600">
                    Based on recent sessions
                  </p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-600">
                      Hours This Month
                    </span>
                  </div>
                  <p className="text-2xl font-semibold text-gray-900">23.5</p>
                  <p className="text-sm text-purple-600">Across 8 sessions</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Mentor Profile
              </h2>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <p className="text-gray-600">
                  Profile management features will be available here.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
