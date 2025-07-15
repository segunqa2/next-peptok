import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MetricsOverview from "@/components/metrics/MetricsOverview";
import { MentorshipRequestProgress } from "@/components/mentorship/MentorshipRequestProgress";
import { SessionManagement } from "@/components/admin/SessionManagement";
import { ButtonValidationTest } from "@/components/testing/ButtonValidationTest";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  TrendingUp,
  Calendar,
  Target,
  Download,
  Settings,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Award,
  MessageSquare,
  Globe,
  Shield,
  Zap,
  Building2,
  UserCheck,
  BookOpen,
  Activity,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import { sessionManagementService } from "@/services/sessionManagementService";
import { programService } from "@/services/programService";
import {
  companyDashboardApi,
  type CompanyDashboardMetrics,
} from "@/services/companyDashboardApi";
import { MentorshipRequest } from "@/types";
import { toast } from "sonner";
import { DashboardDiagnostic } from "@/components/common/DashboardDiagnostic";

const CompanyDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [mentorshipRequests, setMentorshipRequests] = useState<
    MentorshipRequest[]
  >([]);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [dashboardMetrics, setDashboardMetrics] =
    useState<CompanyDashboardMetrics>({
      activeSessions: 0,
      activeCoaching: 0,
      goalsProgress: 0,
      totalHours: 0,
      totalPrograms: 0,
      completedPrograms: 0,
      pendingPrograms: 0,
      totalParticipants: 0,
      averageRating: 0,
      monthlySpend: 0,
      completedSessions: 0,
      scheduledSessions: 0,
      engagementRate: 0,
      successRate: 0,
      retentionRate: 0,
    });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        // Fetch dashboard metrics if user has a company
        if (user?.companyId) {
          try {
            const metrics = await companyDashboardApi.getDashboardMetrics(
              user.companyId,
            );
            setDashboardMetrics(metrics);
            console.log("Loaded dashboard metrics:", metrics);
          } catch (error) {
            console.error("Error loading dashboard metrics:", error);
          }
        }

        // Fetch company's programs/requests with proper authorization
        if (user?.companyId) {
          const requests = await api.matching.getCompanyRequests(
            user.companyId,
          );
          setMentorshipRequests(requests || []);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);

        // More user-friendly error handling
        if (
          error.message?.includes("API not configured") ||
          error.message?.includes("Network error")
        ) {
          console.log(
            "📱 Using offline mode - dashboard data loaded from local storage",
          );
          // Don't show error toast in this case, as data is loaded from fallback
        } else {
          toast.error(
            "Some dashboard data couldn't be loaded. Using cached data.",
            {
              description:
                "Check your internet connection or try refreshing the page.",
            },
          );
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Handle navigation state for new requests
  useEffect(() => {
    if (location.state?.newRequest) {
      const newRequest = location.state.newRequest;
      setMentorshipRequests((prev) => [newRequest, ...prev]);

      if (location.state.message) {
        toast.success(location.state.message);
      }

      // Clear the state to prevent showing the message again
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, navigate, location.pathname]);

  // Recent activities loaded from backend API
  const recentActivities: any[] = [
    // All activities moved to backend database
  ];

  const topPerformers = [
    {
      name: "Alex Johnson",
      department: "Engineering",
      progress: 92,
      sessions: 12,
      goals: 8,
      avatar:
        "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&h=400&fit=crop&crop=face",
      trend: "up",
      points: 1850,
      currentMentorship: "Leadership Development",
    },
    {
      name: "Emily Davis",
      department: "Analytics",
      progress: 88,
      sessions: 10,
      goals: 6,
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b9d3cc57?w=400&h=400&fit=crop&crop=face",
      trend: "up",
      points: 1650,
      currentMentorship: "Data Science Mastery",
    },
    {
      name: "Michael Park",
      department: "Product",
      progress: 75,
      sessions: 8,
      goals: 5,
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
      trend: "stable",
      points: 1200,
      currentMentorship: "Product Strategy",
    },
    {
      name: "Sarah Williams",
      department: "Design",
      progress: 85,
      sessions: 9,
      goals: 7,
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
      trend: "up",
      points: 1400,
      currentMentorship: "Design Leadership",
    },
  ];

  const departmentStats = [
    {
      department: "Engineering",
      employees: 45,
      activeConnections: 32,
      completedSessions: 128,
      avgProgress: 78,
      engagement: 92,
      requestsActive: 3,
    },
    {
      department: "Marketing",
      employees: 28,
      activeConnections: 22,
      completedSessions: 89,
      avgProgress: 83,
      engagement: 88,
      requestsActive: 2,
    },
    {
      department: "Sales",
      employees: 35,
      activeConnections: 28,
      completedSessions: 145,
      avgProgress: 71,
      engagement: 85,
      requestsActive: 2,
    },
    {
      department: "Product",
      employees: 22,
      activeConnections: 18,
      completedSessions: 76,
      avgProgress: 89,
      engagement: 94,
      requestsActive: 1,
    },
    {
      department: "Design",
      employees: 12,
      activeConnections: 9,
      completedSessions: 42,
      avgProgress: 91,
      engagement: 96,
      requestsActive: 1,
    },
  ];

  const companyMetrics = {
    totalEmployees: dashboardMetrics.totalParticipants || 0,
    activeConnections: dashboardMetrics.activeSessions || 0,
    totalRequests: mentorshipRequests.length,
    activeRequests: mentorshipRequests.filter((r) => r.status === "active")
      .length,
    completedSessions: dashboardMetrics.completedSessions || 0,
    averageProgress: dashboardMetrics.goalsProgress || 0,
    engagementRate: dashboardMetrics.engagementRate || 0,
    successRate: dashboardMetrics.successRate || 0,
  };

  const getActivityIcon = (type: string, status: string) => {
    if (status === "warning")
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;

    switch (type) {
      case "mentorship_request_created":
        return <Target className="h-4 w-4 text-blue-500" />;
      case "session_completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "team_member_invited":
        return <Users className="h-4 w-4 text-purple-500" />;
      case "goal_achieved":
        return <Award className="h-4 w-4 text-orange-500" />;
      case "expert_matched":
        return <UserCheck className="h-4 w-4 text-teal-500" />;
      default:
        return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const getImpactBadge = (impact: string) => {
    const colors = {
      high: "bg-red-100 text-red-700 border-red-200",
      medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
      low: "bg-green-100 text-green-700 border-green-200",
    };
    return colors[impact as keyof typeof colors] || colors.low;
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-white to-blue-100/30"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        <Header userType="platform_admin" />

        <main className="container py-8">
          <div className="space-y-8">
            {/* Enhanced Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  Company Dashboard
                </h1>
                <p className="text-xl text-muted-foreground">
                  Monitor and optimize your organization's coaching program
                  performance
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Select defaultValue="30">
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="365">Last year</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => navigate("/coaching/new")}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Program
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
                <Button>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>

            {/* Dashboard Diagnostics */}
            <DashboardDiagnostic />

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <Card className="backdrop-blur-md bg-white/80 border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        Total Employees
                      </p>
                      <p className="text-3xl font-bold text-blue-600">
                        {companyMetrics.totalEmployees}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span className="text-green-600">↗ 12%</span> vs last
                        month
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Building2 className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-md bg-white/80 border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        Active Mentorships
                      </p>
                      <p className="text-3xl font-bold text-green-600">
                        {companyMetrics.activeConnections}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span className="text-green-600">↗ 8%</span> vs last
                        month
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <Users className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-md bg-white/80 border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        Active Requests
                      </p>
                      <p className="text-3xl font-bold text-purple-600">
                        {companyMetrics.activeRequests}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {companyMetrics.totalRequests} total created
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <Target className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-md bg-white/80 border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        Success Rate
                      </p>
                      <p className="text-3xl font-bold text-orange-600">
                        {companyMetrics.successRate}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span className="text-green-600">↗ 3%</span> vs last
                        month
                      </p>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-full">
                      <Award className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Dashboard Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="backdrop-blur-md bg-white/80 border-white/20 shadow-lg">
                <TabsTrigger
                  value="overview"
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="requests"
                  className="flex items-center gap-2"
                >
                  <Target className="w-4 h-4" />
                  Mentorship Requests
                </TabsTrigger>
                <TabsTrigger
                  value="sessions"
                  className="flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Sessions
                </TabsTrigger>
                <TabsTrigger
                  value="departments"
                  className="flex items-center gap-2"
                >
                  <Building2 className="w-4 h-4" />
                  Departments
                </TabsTrigger>
                <TabsTrigger
                  value="analytics"
                  className="flex items-center gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger
                  value="testing"
                  className="flex items-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  Testing
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Recent Activity */}
                  <div className="lg:col-span-2">
                    <Card className="backdrop-blur-md bg-white/80 border-white/20 shadow-lg h-full">
                      <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <CardTitle className="text-xl">
                          Recent Activity
                        </CardTitle>
                        <Button variant="outline" size="sm">
                          <Filter className="h-4 w-4 mr-2" />
                          Filter
                        </Button>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {recentActivities.map((activity) => (
                          <div
                            key={activity.id}
                            className="flex items-start space-x-4 p-4 rounded-lg border bg-card hover:shadow-md transition-all duration-200"
                          >
                            <div className="p-2 rounded-full bg-muted">
                              {getActivityIcon(activity.type, activity.status)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">
                                  {activity.message}
                                </p>
                                <Badge
                                  variant="outline"
                                  className={getImpactBadge(activity.impact)}
                                >
                                  {activity.impact}
                                </Badge>
                              </div>
                              {activity.user && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {activity.user}
                                  {activity.expert && ` • ${activity.expert}`}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                {activity.timestamp}
                              </p>
                            </div>
                          </div>
                        ))}
                        <Button variant="outline" className="w-full" size="sm">
                          View All Activity
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Top Performers */}
                  <Card className="backdrop-blur-md bg-white/80 border-white/20 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Award className="h-5 w-5 text-yellow-600" />
                        <span>Top Performers</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {topPerformers.map((performer, index) => (
                        <div
                          key={performer.name}
                          className="flex items-center justify-between space-x-3"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="text-sm font-bold text-muted-foreground w-4">
                              #{index + 1}
                            </div>
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={performer.avatar} />
                              <AvatarFallback>
                                {performer.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {performer.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {performer.department}
                              </p>
                              <p className="text-xs text-blue-600">
                                {performer.currentMentorship}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-1">
                              <p className="text-sm font-medium">
                                {performer.progress}%
                              </p>
                              {performer.trend === "up" ? (
                                <ArrowUpRight className="h-3 w-3 text-green-500" />
                              ) : (
                                <ArrowDownRight className="h-3 w-3 text-red-500" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {performer.points} pts
                            </p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Department Performance */}
                <Card className="backdrop-blur-md bg-white/80 border-white/20 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5 text-purple-600" />
                      <span>Department Performance</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      {departmentStats.map((dept) => (
                        <Card
                          key={dept.department}
                          className="hover:shadow-md transition-all duration-200"
                        >
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-sm">
                                  {dept.department}
                                </h4>
                                <Badge variant="secondary">
                                  {dept.employees}
                                </Badge>
                              </div>

                              <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                  <span>Engagement</span>
                                  <span>{dept.engagement}%</span>
                                </div>
                                <Progress
                                  value={dept.engagement}
                                  className="h-1"
                                />
                              </div>

                              <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                  <span>Avg Progress</span>
                                  <span>{dept.avgProgress}%</span>
                                </div>
                                <Progress
                                  value={dept.avgProgress}
                                  className="h-1"
                                />
                              </div>

                              <div className="flex items-center justify-between text-xs">
                                <span>Active Requests</span>
                                <Badge variant="outline" className="text-xs">
                                  {dept.requestsActive}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Mentorship Requests Tab */}
              <TabsContent value="requests" className="space-y-6">
                <Card className="backdrop-blur-md bg-white/80 border-white/20 shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        Coaching Programs Management
                      </CardTitle>
                      <CardDescription>
                        Create and manage comprehensive coaching programs for
                        your organization
                      </CardDescription>
                    </div>
                    <Button onClick={() => navigate("/coaching/new")}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Program
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="text-muted-foreground mt-2">
                          Loading coaching requests...
                        </p>
                      </div>
                    ) : (
                      <MentorshipRequestProgress
                        requests={mentorshipRequests}
                        showCreateButton={mentorshipRequests.length === 0}
                        viewMode="admin"
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Departments Tab */}
              <TabsContent value="departments" className="space-y-6">
                <div className="grid gap-6">
                  {departmentStats.map((dept) => (
                    <Card
                      key={dept.department}
                      className="backdrop-blur-md bg-white/80 border-white/20 shadow-lg"
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <Building2 className="w-5 h-5" />
                            {dept.department} Department
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {dept.employees} employees
                            </Badge>
                            <Badge variant="secondary">
                              {dept.activeConnections} active coaching sessions
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Engagement Rate
                            </p>
                            <p className="text-2xl font-bold text-green-600">
                              {dept.engagement}%
                            </p>
                            <Progress
                              value={dept.engagement}
                              className="mt-2 h-2"
                            />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Average Progress
                            </p>
                            <p className="text-2xl font-bold text-blue-600">
                              {dept.avgProgress}%
                            </p>
                            <Progress
                              value={dept.avgProgress}
                              className="mt-2 h-2"
                            />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Sessions Completed
                            </p>
                            <p className="text-2xl font-bold text-purple-600">
                              {dept.completedSessions}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Active Requests
                            </p>
                            <p className="text-2xl font-bold text-orange-600">
                              {dept.requestsActive}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Sessions Tab */}
              <TabsContent value="sessions" className="space-y-6">
                <SessionManagement />
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6">
                <MetricsOverview />
              </TabsContent>

              {/* Testing Tab */}
              <TabsContent value="testing" className="space-y-6">
                <Card className="backdrop-blur-md bg-white/80 border-white/20 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      Button Functionality Validation
                    </CardTitle>
                    <CardDescription>
                      Test and validate that Join Session, Details, and Message
                      buttons are working properly with backend integration
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ButtonValidationTest />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CompanyDashboard;
