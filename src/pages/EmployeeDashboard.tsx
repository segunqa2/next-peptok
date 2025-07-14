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
import { api } from "@/services/apiEnhanced";
import { apiEnhanced } from "@/services/apiEnhanced";
import { MentorshipRequest, Connection } from "@/types";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { DashboardDiagnostic } from "@/components/common/DashboardDiagnostic";

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mentorshipRequests, setMentorshipRequests] = useState<
    MentorshipRequest[]
  >([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        // Fetch mentorship requests for the user's company with proper authorization
        const requests = await apiEnhanced.getMentorshipRequests();
        const connections = [];

        setMentorshipRequests(requests || []);
        setConnections(connections || []);
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

  // Mock data for enhanced dashboard features
  const upcomingSessions = [
    {
      id: "1",
      expertName: "Sarah Chen",
      expertAvatar:
        "https://images.unsplash.com/photo-1494790108755-2616b9d3cc57?w=400&h=400&fit=crop&crop=face",
      date: "Today, 2:00 PM",
      topic: "Leadership Development",
      type: "video",
      duration: "60 min",
      status: "confirmed",
      mentorshipRequestId: "request-1",
    },
    {
      id: "2",
      expertName: "Michael Rodriguez",
      expertAvatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
      date: "Tomorrow, 10:00 AM",
      topic: "Data Analysis Best Practices",
      type: "video",
      duration: "45 min",
      status: "pending",
      mentorshipRequestId: "request-1",
    },
  ];

  const recentAchievements = [
    {
      id: "1",
      title: "Completed Leadership Fundamentals",
      description: "Finished 8-week leadership development program",
      date: "2 days ago",
      type: "milestone",
      points: 250,
      icon: Award,
    },
    {
      id: "2",
      title: "Perfect Session Attendance",
      description: "Attended all scheduled sessions this month",
      date: "1 week ago",
      type: "streak",
      points: 100,
      icon: CheckCircle,
    },
    {
      id: "3",
      title: "Goal Achievement",
      description: "Reached leadership development milestone",
      date: "2 weeks ago",
      type: "goal",
      points: 150,
      icon: Target,
    },
  ];

  const learningPaths = [
    {
      id: "1",
      title: "Leadership Excellence",
      description: "Develop essential leadership skills",
      progress: 75,
      totalModules: 8,
      completedModules: 6,
      estimatedTime: "2 weeks remaining",
      category: "Management",
      difficulty: "Intermediate",
    },
    {
      id: "2",
      title: "Data-Driven Decision Making",
      description: "Master analytics and data interpretation",
      progress: 45,
      totalModules: 6,
      completedModules: 3,
      estimatedTime: "3 weeks remaining",
      category: "Analytics",
      difficulty: "Advanced",
    },
  ];

  const quickStats = {
    totalSessions: connections.reduce(
      (acc, conn) => acc + (conn.totalSessions || 0),
      0,
    ),
    completedGoals: 3,
    currentPoints: 1250,
    currentLevel: "Advanced",
    activeConnections: connections.filter((conn) => conn.status === "active")
      .length,
    upcomingSessionsCount: upcomingSessions.length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-100/30">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-cyan-200/30 rounded-full blur-2xl transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      <Header />

      <div className="relative container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Welcome back,{" "}
                {user?.firstName || user?.name?.split(" ")[0] || "there"}!
              </h1>
              <p className="text-muted-foreground mt-1">
                Track your coaching progress and continue your learning journey
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="backdrop-blur-sm bg-white/80"
              >
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </Button>
              <Button className="backdrop-blur-sm bg-primary/90 hover:bg-primary shadow-lg">
                <MessageSquare className="w-4 h-4 mr-2" />
                Messages
              </Button>
            </div>
          </div>
        </div>

        {/* Dashboard Diagnostics */}
        <DashboardDiagnostic />

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="backdrop-blur-md bg-white/80 border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Active Mentorships
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {quickStats.activeConnections}
                  </p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/80 border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Sessions Completed
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {quickStats.totalSessions}
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/80 border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Current Points
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {quickStats.currentPoints}
                  </p>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/80 border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Level</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {quickStats.currentLevel}
                  </p>
                </div>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Award className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="backdrop-blur-md bg-white/80 border-white/20 shadow-lg">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="coaching" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              My Coaching
            </TabsTrigger>
            <TabsTrigger value="learning" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Learning Paths
            </TabsTrigger>
            <TabsTrigger value="sessions" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Sessions
            </TabsTrigger>
            <TabsTrigger
              value="achievements"
              className="flex items-center gap-2"
            >
              <Award className="w-4 h-4" />
              Achievements
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Mentorship Requests Progress */}
            <Card className="backdrop-blur-md bg-white/80 border-white/20 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Company Coaching Requests
                  </CardTitle>
                  <CardDescription>
                    Track progress of coaching programs your company has
                    initiated
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/coaching/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Program
                  </Link>
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
                    viewMode="employee"
                  />
                )}
              </CardContent>
            </Card>

            {/* Upcoming Sessions */}
            <Card className="backdrop-blur-md bg-white/80 border-white/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Upcoming Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingSessions.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingSessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={session.expertAvatar} />
                            <AvatarFallback>
                              {session.expertName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium">{session.topic}</h4>
                            <p className="text-sm text-muted-foreground">
                              with {session.expertName} • {session.duration}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {session.date}
                              </span>
                              <Badge
                                variant={
                                  session.type === "video"
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-xs"
                              >
                                {session.type === "video" ? (
                                  <>
                                    <Video className="w-3 h-3 mr-1" />
                                    Video
                                  </>
                                ) : (
                                  <>
                                    <Users className="w-3 h-3 mr-1" />
                                    In-person
                                  </>
                                )}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              session.status === "confirmed"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {session.status}
                          </Badge>
                          <Button size="sm">Join</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No upcoming sessions scheduled
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Achievements */}
            <Card className="backdrop-blur-md bg-white/80 border-white/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Recent Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentAchievements.map((achievement) => {
                    const IconComponent = achievement.icon;
                    return (
                      <div
                        key={achievement.id}
                        className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <IconComponent className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{achievement.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {achievement.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {achievement.date}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary">
                            +{achievement.points}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            points
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mentorships Tab */}
          <TabsContent value="coaching" className="space-y-6">
            <Card className="backdrop-blur-md bg-white/80 border-white/20 shadow-lg">
              <CardHeader>
                <CardTitle>Active Mentorship Connections</CardTitle>
                <CardDescription>
                  Your current mentor relationships and progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                {connections.length > 0 ? (
                  <div className="space-y-4">
                    {connections
                      .filter((conn) => conn.status === "active")
                      .map((connection) => (
                        <div
                          key={connection.id}
                          className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={connection.expert?.avatar} />
                                <AvatarFallback>
                                  {connection.expert?.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="font-semibold">
                                  {connection.expert?.name}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {connection.expert?.title}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {connection.expert?.company}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant="default">Active</Badge>
                              <p className="text-sm text-muted-foreground mt-1">
                                {connection.totalSessions || 0} sessions
                                completed
                              </p>
                            </div>
                          </div>

                          {connection.goals && connection.goals.length > 0 && (
                            <div className="mt-4">
                              <h5 className="text-sm font-medium mb-2">
                                Current Goals:
                              </h5>
                              <div className="flex flex-wrap gap-1">
                                {connection.goals.map((goal, index) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {goal}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {connection.progress !== undefined && (
                            <div className="mt-4">
                              <div className="flex items-center justify-between text-sm mb-2">
                                <span>Progress</span>
                                <span>{connection.progress}%</span>
                              </div>
                              <Progress
                                value={connection.progress}
                                className="h-2"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No active coaching connections
                    </p>
                    <Button asChild className="mt-4">
                      <Link to="/experts">Find Mentors</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Learning Paths Tab */}
          <TabsContent value="learning" className="space-y-6">
            <Card className="backdrop-blur-md bg-white/80 border-white/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookMarked className="w-5 h-5" />
                  Learning Paths
                </CardTitle>
                <CardDescription>
                  Structured learning programs to achieve your goals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {learningPaths.map((path) => (
                    <Card
                      key={path.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{path.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {path.description}
                            </p>
                          </div>
                          <Badge variant="outline">{path.category}</Badge>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Progress</span>
                            <span>
                              {path.completedModules}/{path.totalModules}{" "}
                              modules
                            </span>
                          </div>
                          <Progress value={path.progress} className="h-2" />
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{path.difficulty} level</span>
                            <span>{path.estimatedTime}</span>
                          </div>
                        </div>

                        <Button size="sm" className="w-full mt-3">
                          Continue Learning
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6">
            <Card className="backdrop-blur-md bg-white/80 border-white/20 shadow-lg">
              <CardHeader>
                <CardTitle>Session History</CardTitle>
                <CardDescription>
                  View your completed and upcoming coaching sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Session history will appear here
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            <Card className="backdrop-blur-md bg-white/80 border-white/20 shadow-lg">
              <CardHeader>
                <CardTitle>All Achievements</CardTitle>
                <CardDescription>
                  Your milestones and accomplishments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {recentAchievements.map((achievement) => {
                    const IconComponent = achievement.icon;
                    return (
                      <Card
                        key={achievement.id}
                        className="hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg">
                              <IconComponent className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold">
                                {achievement.title}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {achievement.description}
                              </p>
                              <div className="flex items-center gap-4 mt-2">
                                <Badge variant="secondary">
                                  {achievement.type}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {achievement.date}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-primary">
                                +{achievement.points}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                points earned
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

export default EmployeeDashboard;
