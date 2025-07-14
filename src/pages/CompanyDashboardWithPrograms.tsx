import React, { useState, useEffect } from "react";
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
  ArrowUpRight,
  ArrowDownRight,
  Award,
  MessageSquare,
  Building2,
  BookOpen,
  Activity,
  DollarSign,
  Filter,
  Zap,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { ProgramList } from "@/components/programs/ProgramList";
import { programService } from "@/services/programService";
import { Program } from "@/types/program";

const CompanyDashboardWithPrograms = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    totalPrograms: 0,
    activePrograms: 0,
    completedPrograms: 0,
    pendingPrograms: 0,
    totalParticipants: 0,
    totalSessions: 0,
    completedSessions: 0,
    totalBudget: 0,
    spentBudget: 0,
  });

  useEffect(() => {
    if (user?.userType === "company_admin") {
      initializeDashboard();
    }
  }, [user]);

  const initializeDashboard = async () => {
    try {
      setIsLoading(true);

      // Clear dummy data first
      programService.clearDummyData();

      // Load programs for this company
      const companyPrograms = await programService.getPrograms({
        companyId: user?.companyId,
      });

      setPrograms(companyPrograms);
      calculateDashboardStats(companyPrograms);

      // Show welcome message for new users
      if (companyPrograms.length === 0) {
        toast.info(
          "Welcome! Create your first coaching program to get started.",
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

  const calculateDashboardStats = async (programs: Program[]) => {
    const stats = {
      totalPrograms: programs.length,
      activePrograms: programs.filter((p) => p.status === "in_progress").length,
      completedPrograms: programs.filter((p) => p.status === "completed")
        .length,
      pendingPrograms: programs.filter(
        (p) => p.status === "pending_coach_acceptance",
      ).length,
      totalParticipants: programs.reduce(
        (sum, p) => sum + p.participants.length,
        0,
      ),
      totalSessions: programs.reduce(
        (sum, p) => sum + p.timeline.totalSessions,
        0,
      ),
      completedSessions: 0,
      totalBudget: programs.reduce(
        (sum, p) => sum + (p.budget.totalBudget || p.budget.max),
        0,
      ),
      spentBudget: 0,
    };

    // Calculate completed sessions
    for (const program of programs) {
      const sessions = await programService.getProgramSessions(program.id);
      stats.completedSessions += sessions.filter(
        (s) => s.status === "completed",
      ).length;

      // Calculate spent budget (for completed sessions)
      const costPerSession =
        (program.budget.totalBudget || program.budget.max) /
        program.timeline.totalSessions;
      const completedSessionsForProgram = sessions.filter(
        (s) => s.status === "completed",
      ).length;
      stats.spentBudget += completedSessionsForProgram * costPerSession;
    }

    setDashboardStats(stats);
  };

  const handleCreateProgram = () => {
    navigate("/programs/create");
  };

  const handleProgramClick = (program: Program) => {
    navigate(`/programs/${program.id}`);
  };

  // Enhanced activity data (placeholder for now)
  const recentActivities = [
    {
      id: "1",
      type: "program_created",
      user: user?.name || "Company Admin",
      message: "Created new coaching program: Leadership Development",
      timestamp: "2 hours ago",
      status: "success",
      impact: "high",
    },
    {
      id: "2",
      type: "coach_accepted",
      user: "Sarah Chen",
      message: "Accepted coaching program assignment",
      timestamp: "4 hours ago",
      status: "success",
      impact: "medium",
    },
    {
      id: "3",
      type: "session_completed",
      user: "Team Session",
      message: "Completed leadership development session #3",
      timestamp: "1 day ago",
      status: "success",
      impact: "medium",
    },
  ];

  const upcomingMilestones = [
    {
      id: "1",
      title: "Q1 Leadership Program Completion",
      date: "2024-03-30",
      type: "program_completion",
      progress: 75,
      participants: 12,
    },
    {
      id: "2",
      title: "Technical Skills Workshop Series",
      date: "2024-04-15",
      type: "program_start",
      progress: 0,
      participants: 8,
    },
    {
      id: "3",
      title: "Mid-Year Performance Review Sessions",
      date: "2024-06-01",
      type: "milestone",
      progress: 0,
      participants: 25,
    },
  ];

  if (!user || user.userType !== "company_admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Access Denied</h3>
            <p className="text-muted-foreground">
              This dashboard is only available to company administrators.
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
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Company Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your coaching programs and track team development
            </p>
          </div>
          <Button onClick={handleCreateProgram} className="mt-4 sm:mt-0">
            <Plus className="w-4 h-4 mr-2" />
            Create Program
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
                  <p className="text-2xl font-bold">
                    {dashboardStats.totalPrograms}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total Programs
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {dashboardStats.activePrograms} active
                    </Badge>
                  </div>
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
                    {dashboardStats.totalParticipants}
                  </p>
                  <p className="text-sm text-muted-foreground">Participants</p>
                  <div className="flex items-center gap-1 mt-1">
                    <ArrowUpRight className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-green-600">
                      Active learners
                    </span>
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
                    {dashboardStats.completedSessions}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Sessions Completed
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-muted-foreground">
                      of {dashboardStats.totalSessions} total
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
                  <DollarSign className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    ${Math.round(dashboardStats.spentBudget).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Budget Spent</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Progress
                      value={
                        (dashboardStats.spentBudget /
                          dashboardStats.totalBudget) *
                        100
                      }
                      className="w-16 h-1"
                    />
                    <span className="text-xs text-muted-foreground">
                      {Math.round(
                        (dashboardStats.spentBudget /
                          dashboardStats.totalBudget) *
                          100,
                      )}
                      %
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="programs" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="programs">Programs</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Programs Tab */}
          <TabsContent value="programs" className="space-y-6">
            {dashboardStats.pendingPrograms > 0 && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-800">
                    <AlertCircle className="w-5 h-5" />
                    Action Required
                  </CardTitle>
                  <CardDescription className="text-yellow-700">
                    You have {dashboardStats.pendingPrograms} program(s) waiting
                    for coach acceptance.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            <ProgramList
              userType="company_admin"
              companyId={user.companyId}
              showCreateButton={true}
              onProgramClick={handleProgramClick}
              onCreateProgram={handleCreateProgram}
            />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Program Progress Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        Overall Completion
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(
                          (dashboardStats.completedSessions /
                            dashboardStats.totalSessions) *
                            100 || 0,
                        )}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        (dashboardStats.completedSessions /
                          dashboardStats.totalSessions) *
                          100 || 0
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {dashboardStats.completedPrograms}
                      </p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">
                        {dashboardStats.activePrograms}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        In Progress
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Upcoming Milestones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {upcomingMilestones.map((milestone) => (
                      <div
                        key={milestone.id}
                        className="flex items-center gap-3 p-3 border rounded-lg"
                      >
                        <div className="p-2 bg-primary/10 rounded">
                          <Calendar className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {milestone.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(milestone.date).toLocaleDateString()} •{" "}
                            {milestone.participants} participants
                          </p>
                          {milestone.progress > 0 && (
                            <Progress
                              value={milestone.progress}
                              className="mt-1"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Budget Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Budget Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Total Budget
                    </p>
                    <p className="text-2xl font-bold">
                      ${dashboardStats.totalBudget.toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Spent</p>
                    <p className="text-2xl font-bold text-orange-600">
                      ${Math.round(dashboardStats.spentBudget).toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Remaining</p>
                    <p className="text-2xl font-bold text-green-600">
                      $
                      {Math.round(
                        dashboardStats.totalBudget - dashboardStats.spentBudget,
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">
                      Budget Utilization
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(
                        (dashboardStats.spentBudget /
                          dashboardStats.totalBudget) *
                          100 || 0,
                      )}
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      (dashboardStats.spentBudget /
                        dashboardStats.totalBudget) *
                        100 || 0
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Latest updates from your coaching programs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 border rounded-lg"
                    >
                      <div
                        className={`p-1 rounded-full ${
                          activity.status === "success"
                            ? "bg-green-100"
                            : activity.status === "warning"
                              ? "bg-yellow-100"
                              : "bg-red-100"
                        }`}
                      >
                        {activity.type === "program_created" && (
                          <Target className="w-4 h-4 text-green-600" />
                        )}
                        {activity.type === "coach_accepted" && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                        {activity.type === "session_completed" && (
                          <Award className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.message}</p>
                        <p className="text-sm text-muted-foreground">
                          by {activity.user} • {activity.timestamp}
                        </p>
                        {activity.impact && (
                          <Badge
                            variant={
                              activity.impact === "high" ? "default" : "outline"
                            }
                            className="mt-1"
                          >
                            {activity.impact} impact
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Company Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    <Building2 className="w-4 h-4 mr-2" />
                    Company Profile
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    Team Management
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Billing & Subscriptions
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Program Templates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    <Target className="w-4 h-4 mr-2" />
                    Leadership Development
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Zap className="w-4 h-4 mr-2" />
                    Technical Skills
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Communication Training
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default CompanyDashboardWithPrograms;
