import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { MentorshipRequestProgress } from "@/components/mentorship/MentorshipRequestProgress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calendar,
  Users,
  Target,
  TrendingUp,
  BookOpen,
  MessageSquare,
  Video,
  Plus,
  Award,
  Clock,
  Star,
  BarChart3,
  CheckCircle,
  Activity,
  Bell,
  Filter,
  ArrowRight,
  AlertCircle,
  Zap,
  BookMarked,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiEnhanced } from "@/services/apiEnhanced";
const api = apiEnhanced; // Use apiEnhanced for all API calls
import {
  companyDashboardApi,
  type CompanyDashboardMetrics,
} from "@/services/companyDashboardApi";
import { MentorshipRequest, Connection } from "@/types";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { toast } from "sonner";
import { SessionManagement } from "@/components/sessions/SessionManagement";
import { initializeSampleData } from "@/utils/sampleDataInitializer";

const EnterpriseDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mentorshipRequests, setMentorshipRequests] = useState<
    MentorshipRequest[]
  >([]);
  const [connections, setConnections] = useState<Connection[]>([]);
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

  // Load data on mount
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);

        // Check if this is a demo user (Sarah)
        const token = localStorage.getItem("peptok_token");
        const isDemoUser = token?.startsWith("demo_token_");
        const demoData = localStorage.getItem("peptok_demo_data");

        console.log("🔍 Enterprise dashboard loading check:", {
          token: token ? `${token.substring(0, 20)}...` : "none",
          isDemoUser,
          hasDemoData: !!demoData,
          userEmail: user?.email,
        });

        if (isDemoUser && demoData) {
          console.log("🎭 Loading demo data for enterprise dashboard");
          const parsedDemoData = JSON.parse(demoData);

          // Use demo dashboard stats (always show coaching request except for new login)
          setDashboardMetrics({
            activeSessions: parsedDemoData.dashboardStats.activeSessions,
            activeCoaching: parsedDemoData.dashboardStats.activeCoaching,
            goalsProgress: parsedDemoData.dashboardStats.goalsProgress,
            totalHours: parsedDemoData.dashboardStats.totalHours,
            totalPrograms: 0,
            completedPrograms: 0,
            pendingPrograms: 0,
            totalParticipants: parsedDemoData.company?.employeeCount || 125,
            averageRating: 0,
            monthlySpend: 0,
            completedSessions: 0,
            scheduledSessions: 0,
            engagementRate: 0,
            successRate: 0,
            retentionRate: 0,
          });

          // Always show the coaching request (except for new login scenario)
          const coachingRequests =
            parsedDemoData.dashboardStats.coachingRequests || [];
          setMentorshipRequests(coachingRequests);
          setConnections([]);

          console.log("✅ Demo enterprise dashboard data loaded successfully");
          console.log("📋 Demo coaching requests loaded:", coachingRequests);

          // Brief delay to show loading spinner, then finish loading
          setTimeout(() => {
            setIsLoading(false);
          }, 100);
          return;
        }

        // Initialize sample data for testing (this ensures we have data to display)
        initializeSampleData();

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
            // Don't show error toast for demo users or when API is unavailable
            if (!isDemoUser) {
              toast.error("Failed to load dashboard metrics");
            }
          }
        }

        // Fetch coaching requests for the user's company with proper authorization
        try {
          const requests = await apiEnhanced.getCoachingRequests();
          console.log("Loaded coaching requests:", requests);
          setMentorshipRequests(requests || []);
        } catch (error) {
          console.error("Error loading coaching requests:", error);
          // Use empty array as fallback, don't show error for demo users
          setMentorshipRequests([]);
        }

        // Get connections (with fallback)
        try {
          const connectionData = (await (api as any).getConnections?.()) || [];
          setConnections(connectionData);
        } catch (error) {
          console.warn("Connections API not available, using empty array");
          setConnections([]);
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);

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

    loadDashboardData();
  }, []);

  // Handle new mentorship request creation
  const handleNewRequest = (newRequest: MentorshipRequest) => {
    console.log("New mentorship request created:", newRequest);
    if (newRequest) {
      setMentorshipRequests((prev) => [newRequest, ...prev]);
      toast.success("Mentorship request created successfully!");
    }
  };

  // Listen for new requests from location state
  useEffect(() => {
    if (location.state?.newRequest) {
      handleNewRequest(location.state.newRequest);
      // Clear the state to prevent re-adding on refresh
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location.state]);

  // Data will be loaded from backend API
  const upcomingSessions: any[] = [];
  const achievements: any[] = [];
  const recentActivity: any[] = [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.name || "Enterprise User"}!
              </h1>
              <p className="text-gray-600 mt-2">
                Track your coaching progress and continue your learning journey
              </p>
            </div>
            <Button onClick={() => navigate("/coaching/new")} size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Create New Program
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      Active Sessions
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardMetrics.activeSessions}
                    </p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Video className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      Active Coaching
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardMetrics.activeCoaching}
                    </p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Goals Progress</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardMetrics.goalsProgress}%
                    </p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Target className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Hours</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardMetrics.totalHours}
                    </p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-full">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="mentorships">My Coaching</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Mentorship Requests Progress */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Company Coaching Requests</CardTitle>
                      <CardDescription>
                        Track progress of coaching programs your company has
                        created
                      </CardDescription>
                    </div>
                    <Button variant="outline" asChild>
                      <Link to="/coaching/new">
                        <Plus className="w-4 h-4 mr-2" />
                        Create New Program
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">
                        Loading mentorship requests...
                      </p>
                    </div>
                  ) : (
                    <MentorshipRequestProgress
                      requests={mentorshipRequests}
                      viewMode="enterprise"
                      showCreateButton={false}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Sessions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Upcoming Sessions
                  </CardTitle>
                  <CardDescription>
                    Your scheduled coaching sessions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {upcomingSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center space-x-4 p-4 rounded-lg border"
                    >
                      <div className="flex-shrink-0">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={session.coachAvatar} />
                          <AvatarFallback>
                            {session.coachName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">
                          {session.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {session.date} at {session.time} • with{" "}
                          {session.coachName} �� {session.duration}
                        </p>
                        <div className="flex items-center mt-2 space-x-2">
                          <Badge
                            variant={
                              session.status === "confirmed"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {session.status}
                          </Badge>
                          <Badge variant="outline">{session.type}</Badge>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>
                    Your latest coaching activities
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start space-x-3"
                    >
                      <div className="flex-shrink-0">
                        <div className="bg-gray-100 p-2 rounded-full">
                          <activity.icon className="w-4 h-4 text-gray-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {activity.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Mentorships Tab */}
          <TabsContent value="mentorships" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Mentorship Connections</CardTitle>
                <CardDescription>
                  Your current coach relationships and progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {connections.length > 0 ? (
                    connections.map((connection) => (
                      <div
                        key={connection.id}
                        className="flex items-center justify-between p-6 border rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={connection.coach?.avatar} />
                            <AvatarFallback>
                              {connection.coach?.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-lg">
                              {connection.coach?.name}
                            </h3>
                            <p className="text-gray-600">
                              {connection.coach?.title}
                            </p>
                            <p className="text-sm text-gray-500">
                              {connection.coach?.company}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-2 mb-2">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="font-medium">
                              {connection.coach?.rating}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            {connection.sessionsCompleted || 0} sessions
                          </p>
                          <Badge
                            variant={
                              connection.status === "active"
                                ? "default"
                                : "secondary"
                            }
                            className="mt-2"
                          >
                            {connection.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No active mentorship connections
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Start connecting with coaches to begin your learning
                        journey
                      </p>
                      <Button asChild>
                        <Link to="/coaches">Find Mentors</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Sessions</CardTitle>
                  <CardDescription>
                    Your scheduled coaching sessions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {upcomingSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={session.coachAvatar} />
                          <AvatarFallback>
                            {session.coachName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{session.title}</p>
                          <p className="text-sm text-gray-500">
                            {session.date} at {session.time}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            session.status === "confirmed"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {session.status}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {session.duration}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Session Calendar</CardTitle>
                  <CardDescription>
                    View your completed and upcoming mentorship sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      Calendar integration coming soon
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Learning Goals */}
              <Card>
                <CardHeader>
                  <CardTitle>Learning Goals</CardTitle>
                  <CardDescription>
                    Track your progress towards your learning objectives
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Leadership Skills</span>
                        <span className="text-sm text-gray-500">80%</span>
                      </div>
                      <Progress value={80} />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Communication</span>
                        <span className="text-sm text-gray-500">75%</span>
                      </div>
                      <Progress value={75} />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Data Analysis</span>
                        <span className="text-sm text-gray-500">60%</span>
                      </div>
                      <Progress value={60} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Achievements */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Achievements</CardTitle>
                  <CardDescription>
                    Your accomplishments and milestones
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="flex items-start space-x-3"
                    >
                      <div className="flex-shrink-0">
                        <div className="bg-gray-100 p-2 rounded-full">
                          <achievement.icon
                            className={`w-4 h-4 ${achievement.color}`}
                          />
                        </div>
                      </div>
                      <div>
                        <p className="font-medium">{achievement.title}</p>
                        <p className="text-sm text-gray-500">
                          {achievement.description}
                        </p>
                        <p className="text-xs text-gray-400">
                          {achievement.date}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default EnterpriseDashboard;
