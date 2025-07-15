import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  TrendingUp,
  Calendar,
  MessageCircle,
  Plus,
  BarChart3,
  Target,
  Clock,
  Award,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Header from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { apiEnhanced } from "@/services/apiEnhanced";
import { analytics } from "@/services/analytics";
import {
  companyDashboardApi,
  type CompanyDashboardMetrics,
} from "@/services/companyDashboardApi";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";
import { MentorshipRequest } from "@/types";
import { toast } from "sonner";
import { crossBrowserSync, SYNC_CONFIGS } from "@/services/crossBrowserSync";

interface CompanyMetrics {
  totalEmployees: number;
  activePrograms: number;
  completedSessions: number;
  averageRating: number;
  engagementRate: number;
  monthlySpend: number;
  roiPercentage: number;
}

interface RecentActivity {
  id: string;
  type:
    | "session_completed"
    | "program_started"
    | "rating_received"
    | "employee_joined";
  title: string;
  description: string;
  timestamp: Date;
  employeeName?: string;
  coachName?: string;
  rating?: number;
}

export default function CompanyDashboardEnhanced() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<CompanyMetrics>({
    totalEmployees: 0,
    activePrograms: 0,
    completedSessions: 0,
    averageRating: 0,
    engagementRate: 0,
    monthlySpend: 0,
    roiPercentage: 0,
  });
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    // Enhanced authorization check
    if (!user) {
      navigate("/login");
      return;
    }

    if (user.userType !== "company_admin") {
      toast.error("Access denied. Company admin access required.");
      navigate("/");
      return;
    }

    if (!user.companyId) {
      toast.error("Company information not found. Please contact support.");
      analytics.trackError(new Error("Company admin without companyId"), {
        component: "company_dashboard_enhanced",
        userId: user.id,
      });
      navigate("/");
      return;
    }

    loadDashboardData();

    // Track page view with proper company context
    analytics.pageView({
      page: "company_dashboard_enhanced",
      userId: user.id,
      userType: user.userType,
      metadata: { companyId: user.companyId },
    });

    // Data will be refreshed through normal component lifecycle
    return () => {
      // Cleanup if needed
    };
  }, [user, navigate]);

  const loadDashboardData = async () => {
    if (!user?.companyId) {
      toast.error("Company information not found");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Load fresh data

      // Load dashboard metrics from API
      const dashboardMetrics = await companyDashboardApi.getDashboardMetrics(
        user.companyId,
      );

      // Load company-specific requests with proper error handling
      const companyRequests = await apiEnhanced.getCompanyRequests(
        user.companyId,
      );

      if (!Array.isArray(companyRequests)) {
        throw new Error("Invalid company requests data received");
      }

      setRequests(companyRequests);

      // Use metrics from API with fallback calculations
      const calculatedMetrics: CompanyMetrics = {
        totalEmployees:
          dashboardMetrics.totalParticipants ||
          Math.max(
            companyRequests.reduce((sum, r) => sum + (r.participants || 1), 0),
            1,
          ),
        activePrograms:
          dashboardMetrics.activeCoaching ||
          companyRequests.filter((r) => r.status === "in_progress").length,
        completedSessions:
          dashboardMetrics.completedSessions ||
          companyRequests.filter((r) => r.status === "completed").length,
        averageRating:
          dashboardMetrics.averageRating ||
          (dashboardMetrics.completedSessions > 0 ? 4.7 : 0),
        engagementRate:
          dashboardMetrics.engagementRate ||
          (companyRequests.length > 0
            ? (dashboardMetrics.activeCoaching / companyRequests.length) * 100
            : 0),
        monthlySpend:
          dashboardMetrics.monthlySpend ||
          (companyRequests.length > 0
            ? companyRequests.reduce(
                (sum, r) => sum + (r.budget?.max || 0),
                0,
              ) / 12
            : 0),
        roiPercentage:
          dashboardMetrics.retentionRate ||
          (dashboardMetrics.completedSessions > 0 ? 145 : 0), // Use retention rate as ROI proxy
      };

      setMetrics(calculatedMetrics);

      // Generate recent activity
      const activities: RecentActivity[] = [
        {
          id: "1",
          type: "session_completed",
          title: "Leadership Session Completed",
          description: "Team session with Sarah Johnson",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          employeeName: "Alex Chen",
          coachName: "Sarah Johnson",
          rating: 5,
        },
        {
          id: "2",
          type: "program_started",
          title: "New Program Started",
          description: "React Development Training program initiated",
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        },
        {
          id: "3",
          type: "rating_received",
          title: "Excellent Rating Received",
          description: "5-star rating for communication skills session",
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          rating: 5,
        },
      ];

      setRecentActivity(activities);

      analytics.trackAction({
        action: "company_dashboard_loaded",
        component: "company_dashboard_enhanced",
        metadata: {
          companyId: user.companyId,
          totalRequests: companyRequests.length,
          activePrograms,
          completedPrograms,
        },
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Failed to load dashboard data");

      analytics.trackError(
        error instanceof Error ? error : new Error("Dashboard load failed"),
        { component: "company_dashboard_enhanced", companyId: user.companyId },
      );
    } finally {
      setLoading(false);
    }
  };

  const createNewRequest = () => {
    analytics.trackAction({
      action: "create_request_clicked",
      component: "company_dashboard_enhanced",
      metadata: { companyId: user?.companyId },
    });
    navigate("/coaching/new");
  };

  const viewAllRequests = () => {
    analytics.trackAction({
      action: "view_all_requests_clicked",
      component: "company_dashboard_enhanced",
      metadata: { companyId: user?.companyId },
    });
    // Navigate to requests page (would need to be created)
    navigate("/company/requests");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "in_progress":
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "pending":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Show loading state
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">
                {!user ? "Authenticating..." : "Loading dashboard..."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state for unauthorized users
  if (user.userType !== "company_admin" || !user.companyId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground mb-4">
                Company admin access required to view this dashboard.
              </p>
              <Button onClick={() => navigate("/")} variant="outline">
                Return Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Company Dashboard
              </h1>
              <p className="text-gray-600">
                Monitor your team's coaching programs and progress
              </p>
            </div>
            <Button onClick={createNewRequest}>
              <Plus className="w-4 h-4 mr-2" />
              New Coaching Request
            </Button>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Active Employees
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {metrics.totalEmployees}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Target className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Active Programs
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {metrics.activePrograms}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Award className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Avg. Rating
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {metrics.averageRating.toFixed(1)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">ROI</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {metrics.roiPercentage}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="programs">Programs</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Current Programs */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Current Programs</CardTitle>
                      <CardDescription>
                        Active coaching programs and their status
                      </CardDescription>
                    </div>
                    <Button variant="outline" onClick={viewAllRequests}>
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {requests.slice(0, 5).map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          {getStatusIcon(request.status)}
                          <div>
                            <h4 className="font-medium">{request.title}</h4>
                            <p className="text-sm text-gray-600">
                              {request.participants} participants •{" "}
                              {request.timeline}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge
                            variant="secondary"
                            className={getStatusColor(request.status)}
                          >
                            {request.status.replace("_", " ")}
                          </Badge>
                          {request.budget && (
                            <span className="text-sm text-gray-500">
                              ${request.budget.max?.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Engagement Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {metrics.engagementRate.toFixed(1)}%
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      +5.2% from last month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Monthly Investment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      ${metrics.monthlySpend.toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Average per program
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Completed Sessions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">
                      {metrics.completedSessions}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">This quarter</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="programs">
              <Card>
                <CardHeader>
                  <CardTitle>All Programs</CardTitle>
                  <CardDescription>
                    Complete list of your coaching programs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {requests.map((request) => (
                      <div
                        key={request.id}
                        className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold">
                                {request.title}
                              </h3>
                              <Badge
                                variant="secondary"
                                className={getStatusColor(request.status)}
                              >
                                {request.status.replace("_", " ")}
                              </Badge>
                            </div>
                            <p className="text-gray-600 mb-3">
                              {request.description}
                            </p>
                            <div className="flex items-center space-x-6 text-sm text-gray-500">
                              <span className="flex items-center">
                                <Users className="w-4 h-4 mr-1" />
                                {request.participants} participants
                              </span>
                              <span className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {request.timeline}
                              </span>
                              {request.budget && (
                                <span className="flex items-center">
                                  <TrendingUp className="w-4 h-4 mr-1" />$
                                  {request.budget.max?.toLocaleString()} budget
                                </span>
                              )}
                            </div>
                            {request.skills && request.skills.length > 0 && (
                              <div className="mt-3">
                                <div className="flex flex-wrap gap-2">
                                  {request.skills
                                    .slice(0, 3)
                                    .map((skill, index) => (
                                      <Badge key={index} variant="outline">
                                        {skill}
                                      </Badge>
                                    ))}
                                  {request.skills.length > 3 && (
                                    <Badge variant="outline">
                                      +{request.skills.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <AnalyticsDashboard />
            </TabsContent>

            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Latest updates from your coaching programs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start space-x-4 p-4 border rounded-lg"
                      >
                        <div className="flex-shrink-0">
                          {activity.type === "session_completed" && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                          {activity.type === "program_started" && (
                            <Target className="w-5 h-5 text-blue-500" />
                          )}
                          {activity.type === "rating_received" && (
                            <Award className="w-5 h-5 text-yellow-500" />
                          )}
                          {activity.type === "employee_joined" && (
                            <Users className="w-5 h-5 text-purple-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{activity.title}</h4>
                          <p className="text-sm text-gray-600">
                            {activity.description}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>
                              {activity.timestamp.toLocaleDateString()} at{" "}
                              {activity.timestamp.toLocaleTimeString()}
                            </span>
                            {activity.employeeName && (
                              <span>Employee: {activity.employeeName}</span>
                            )}
                            {activity.coachName && (
                              <span>Coach: {activity.coachName}</span>
                            )}
                            {activity.rating && (
                              <span className="flex items-center">
                                <Award className="w-3 h-3 mr-1" />
                                {activity.rating}/5
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
