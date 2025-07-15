import React, { useState, useEffect } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
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
  Eye,
  ThumbsUp,
  ThumbsDown,
  Settings,
  BarChart3,
  Target,
  AlertCircle,
  Activity,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Header from "@/components/layout/Header";
import { programService } from "@/services/programService";
import { Program } from "@/types/program";
import { CoachProgramManagement } from "@/components/programs/CoachProgramManagement";

interface CoachStats {
  totalPrograms: number;
  activePrograms: number;
  completedPrograms: number;
  pendingPrograms: number;
  totalSessions: number;
  completedSessions: number;
  totalEarnings: number;
  averageRating: number;
  totalParticipants: number;
}

const CoachDashboardWithPrograms = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [stats, setStats] = useState<CoachStats>({
    totalPrograms: 0,
    activePrograms: 0,
    completedPrograms: 0,
    pendingPrograms: 0,
    totalSessions: 0,
    completedSessions: 0,
    totalEarnings: 0,
    averageRating: 0,
    totalParticipants: 0,
  });

  useEffect(() => {
    if (user?.userType === "coach") {
      initializeDashboard();
    }
  }, [user]);

  const initializeDashboard = async () => {
    try {
      setIsLoading(true);

      // Clear dummy data first
      programService.clearDummyData();

      // Load programs for this coach
      const coachPrograms = await programService.getPrograms({
        coachId: user?.id,
      });

      setPrograms(coachPrograms);
      await calculateStats(coachPrograms);

      // Show welcome message for new coaches
      if (coachPrograms.length === 0) {
        toast.info(
          "Welcome! You'll see coaching programs here when companies invite you.",
          {
            duration: 5000,
          },
        );
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = async (programs: Program[]) => {
    const newStats: CoachStats = {
      totalPrograms: programs.length,
      activePrograms: programs.filter((p) => p.status === "in_progress").length,
      completedPrograms: programs.filter((p) => p.status === "completed")
        .length,
      pendingPrograms: programs.filter(
        (p) => p.status === "pending_coach_acceptance",
      ).length,
      totalSessions: 0,
      completedSessions: 0,
      totalEarnings: 0,
      averageRating: 0,
      totalParticipants: programs.reduce(
        (sum, p) => sum + p.participants.length,
        0,
      ),
    };

    // Calculate session and earning stats
    let totalRatings = 0;
    let ratingCount = 0;

    for (const program of programs) {
      const sessions = await programService.getProgramSessions(program.id);
      newStats.totalSessions += sessions.length;

      const completedSessions = sessions.filter(
        (s) => s.status === "completed",
      );
      newStats.completedSessions += completedSessions.length;

      // Calculate earnings (estimated based on program budget)
      const costPerSession =
        (program.budget.totalBudget || program.budget.max) /
        program.timeline.totalSessions;
      newStats.totalEarnings += completedSessions.length * costPerSession;

      // Calculate average rating
      completedSessions.forEach((session) => {
        if (session.feedback?.coachRating) {
          totalRatings += session.feedback.coachRating;
          ratingCount++;
        }
      });
    }

    newStats.averageRating = ratingCount > 0 ? totalRatings / ratingCount : 0;
    setStats(newStats);
  };

  const upcomingSessions = [
    {
      id: "1",
      title: "Leadership Development - Session 3",
      program: "Leadership Development Program",
      company: "TechCorp Inc.",
      date: "2024-03-20",
      time: "10:00 AM",
      duration: 60,
      participants: ["Sarah Johnson", "Mike Chen"],
      type: "video",
    },
    {
      id: "2",
      title: "Team Communication Workshop",
      program: "Communication Training",
      company: "StartupXYZ",
      date: "2024-03-21",
      time: "2:00 PM",
      duration: 90,
      participants: ["Alex Rivera", "Emma Wilson", "David Kim"],
      type: "video",
    },
  ];

  const recentActivity: any[] = [
    {
      id: "1",
      type: "program_accepted",
      message: "Accepted new coaching program: Leadership Development",
      company: "TechCorp Inc.",
      timestamp: "2 hours ago",
      status: "success",
    },
    {
      id: "2",
      type: "session_completed",
      message: "Completed session: Team Communication Workshop",
      company: "StartupXYZ",
      timestamp: "1 day ago",
      status: "success",
    },
    {
      id: "3",
      type: "feedback_received",
      message: "Received 5-star rating from Sarah Johnson",
      company: "TechCorp Inc.",
      timestamp: "2 days ago",
      status: "success",
    },
  ];

  if (!user || user.userType !== "coach") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Access Denied</h3>
            <p className="text-muted-foreground">
              This dashboard is only available to coaches.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user.picture} alt={user.name} />
              <AvatarFallback>
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Welcome back, {user.firstName || user.name}
              </h1>
              <p className="text-muted-foreground">
                Ready to make a difference in your coaching programs
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/coach/settings")}
            className="mt-4 sm:mt-0"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalPrograms}</p>
                  <p className="text-sm text-muted-foreground">
                    Total Programs
                  </p>
                  {stats.pendingPrograms > 0 && (
                    <Badge variant="outline" className="text-xs mt-1">
                      {stats.pendingPrograms} pending
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {stats.totalParticipants}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total Participants
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-green-600">Growing</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {stats.completedSessions}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Sessions Completed
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-muted-foreground">
                      of {stats.totalSessions} total
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Star className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {stats.averageRating.toFixed(1)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Average Rating
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${
                          star <= stats.averageRating
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Urgent Actions */}
        {stats.pendingPrograms > 0 && (
          <Card className="border-yellow-200 bg-yellow-50 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <Bell className="w-5 h-5" />
                Action Required
              </CardTitle>
              <CardDescription className="text-yellow-700">
                You have {stats.pendingPrograms} program(s) waiting for your
                response. Please review and accept or decline these
                opportunities.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate("/coach/programs")}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                Review Programs
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="programs">Programs</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming Sessions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Upcoming Sessions
                  </CardTitle>
                  <CardDescription>
                    Your next scheduled coaching sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {upcomingSessions.map((session) => (
                      <div
                        key={session.id}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{session.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {session.company}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {session.type === "video" && (
                              <Video className="w-3 h-3 mr-1" />
                            )}
                            {session.duration}m
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>
                              {new Date(session.date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span>{session.time}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span>
                              {session.participants.length} participants
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t">
                          <div className="text-xs text-muted-foreground">
                            Participants: {session.participants.join(", ")}
                          </div>
                          <Button size="sm">Join Session</Button>
                        </div>
                      </div>
                    ))}

                    {upcomingSessions.length === 0 && (
                      <div className="text-center py-8">
                        <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">
                          No Upcoming Sessions
                        </h3>
                        <p className="text-muted-foreground">
                          Your schedule is clear. Sessions will appear here when
                          they're scheduled.
                        </p>
                      </div>
                    )}
                  </div>
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
                    Latest updates from your coaching activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 border rounded-lg"
                      >
                        <div className="p-1 bg-green-100 rounded-full">
                          {activity.type === "program_accepted" && (
                            <ThumbsUp className="w-4 h-4 text-green-600" />
                          )}
                          {activity.type === "session_completed" && (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                          {activity.type === "feedback_received" && (
                            <Star className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{activity.message}</p>
                          <p className="text-sm text-muted-foreground">
                            {activity.company} • {activity.timestamp}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Performance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Program Completion Rate
                    </p>
                    <div className="flex items-center gap-3">
                      <p className="text-2xl font-bold">
                        {stats.totalPrograms > 0
                          ? Math.round(
                              (stats.completedPrograms / stats.totalPrograms) *
                                100,
                            )
                          : 0}
                        %
                      </p>
                      <Progress
                        value={
                          stats.totalPrograms > 0
                            ? (stats.completedPrograms / stats.totalPrograms) *
                              100
                            : 0
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Session Completion Rate
                    </p>
                    <div className="flex items-center gap-3">
                      <p className="text-2xl font-bold">
                        {stats.totalSessions > 0
                          ? Math.round(
                              (stats.completedSessions / stats.totalSessions) *
                                100,
                            )
                          : 0}
                        %
                      </p>
                      <Progress
                        value={
                          stats.totalSessions > 0
                            ? (stats.completedSessions / stats.totalSessions) *
                              100
                            : 0
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Client Satisfaction
                    </p>
                    <div className="flex items-center gap-3">
                      <p className="text-2xl font-bold">
                        {stats.averageRating.toFixed(1)}/5.0
                      </p>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= stats.averageRating
                                ? "text-yellow-400 fill-current"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Programs Tab */}
          <TabsContent value="programs">
            <CoachProgramManagement coachId={user.id} />
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Session Management
                </CardTitle>
                <CardDescription>
                  Manage your coaching sessions across all programs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    Session Management Coming Soon
                  </h3>
                  <p className="text-muted-foreground">
                    This feature will allow you to manage all your sessions in
                    one place.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Coaching Impact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">
                        {stats.totalParticipants}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Lives Impacted
                      </p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {stats.completedSessions}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Sessions Delivered
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Monthly Growth</p>
                    <Progress value={75} />
                    <p className="text-xs text-muted-foreground">
                      75% increase in session bookings this month
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Earnings Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold">
                      ${Math.round(stats.totalEarnings).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total Earnings
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-lg font-bold">
                        $
                        {stats.completedSessions > 0
                          ? Math.round(
                              stats.totalEarnings / stats.completedSessions,
                            )
                          : 0}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Per Session
                      </p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-lg font-bold">
                        $
                        {stats.totalParticipants > 0
                          ? Math.round(
                              stats.totalEarnings / stats.totalParticipants,
                            )
                          : 0}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Per Participant
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CoachDashboardWithPrograms;
