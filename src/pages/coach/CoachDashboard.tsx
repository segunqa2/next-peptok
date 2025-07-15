import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Filter,
  Search,
  RefreshCw,
  Settings,
  BarChart3,
  Target,
  AlertCircle,
  Plus,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { apiEnhanced } from "@/services/apiEnhanced";
import { analytics } from "@/services/analytics";
import { toast } from "sonner";
import { crossBrowserSync, SYNC_CONFIGS } from "@/services/crossBrowserSync";
import LocalStorageService from "@/services/localStorageService";
import { emailService } from "@/services/email";
import { websocketService } from "@/services/websocket";
import { logMatchAction } from "@/services/interactionLogger";

interface CoachProfile {
  id: string;
  name: string;
  email: string;
  bio: string;
  skills: string[];
  experience: number;
  rating: number;
  totalRatings: number;
  hourlyRate: number;
  currency: string;
  availability: {
    timezone: string;
    schedule: Array<{
      day: string;
      startTime: string;
      endTime: string;
      available: boolean;
    }>;
  };
  certifications: string[];
  languages: string[];
  profileImage: string;
  isActive: boolean;
  joinedAt: string;
}

interface MatchRequest {
  id: string;
  title: string;
  description: string;
  companyName: string;
  companyId: string;
  skills: string[];
  participants: number;
  duration: string;
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  urgency: "low" | "medium" | "high";
  status: "pending" | "accepted" | "declined" | "in_progress" | "completed";
  submittedAt: string;
  deadlineAt?: string;
  requirements: string[];
  preferredStartDate: string;
  sessionFrequency: string;
  goals: Array<{
    id: string;
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
  }>;
}

interface CoachSession {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  participants: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
  companyName: string;
  meetingLink?: string;
  notes?: string;
  rating?: number;
  feedback?: string;
  earnings: number;
  currency: string;
}

interface CoachStats {
  totalSessions: number;
  completedSessions: number;
  averageRating: number;
  totalEarnings: number;
  thisMonthEarnings: number;
  upcomingSessions: number;
  responseTime: number; // in hours
  successRate: number; // percentage
  repeatClients: number;
  totalClients: number;
  profileViews: number;
  matchAcceptanceRate: number;
}

interface ActivityItem {
  id: string;
  type:
    | "match_request"
    | "session_completed"
    | "payment_received"
    | "rating_received"
    | "profile_view";
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export const CoachDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<CoachProfile | null>(null);
  const [stats, setStats] = useState<CoachStats | null>(null);
  const [pendingMatches, setPendingMatches] = useState<MatchRequest[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<CoachSession[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

  // Filter states
  const [matchFilter, setMatchFilter] = useState("all");
  const [sessionFilter, setSessionFilter] = useState("upcoming");
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [selectedMatch, setSelectedMatch] = useState<MatchRequest | null>(null);
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [acceptanceMessage, setAcceptanceMessage] = useState("");

  useEffect(() => {
    if (!user || user.userType !== "coach") {
      navigate("/login");
      return;
    }

    loadDashboardData();

    // Track page view
    analytics.pageView({
      page: "coach_dashboard",
      userId: user.id,
      userType: user.userType,
    });
  }, [user, navigate]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Check if this is a demo user (Daniel)
      const isDemoUser = localStorage
        .getItem("peptok_token")
        ?.startsWith("demo_token_");
      const demoData = localStorage.getItem("peptok_demo_data");

      if (isDemoUser && demoData && user.id === "user_004") {
        console.log("🎭 Loading demo coach dashboard data for Daniel");
        const parsedDemoData = JSON.parse(demoData);

        // Set demo data for Daniel
        const demoProfile = {
          id: user.id,
          name: "Daniel Hayes",
          title: "Senior Marketing Strategist",
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
          avatar:
            "https://images.unsplash.com/photo-1494790108755-2616b612b1-3c?w=150",
        };

        const demoStats = {
          totalSessions: 245,
          totalEarnings:
            parsedDemoData.dashboardStats?.monthlyEarnings || 12500,
          responseRate: parsedDemoData.dashboardStats?.responseRate || 95,
          rating: 4.9,
          successRate: parsedDemoData.dashboardStats?.successRate || 92,
        };

        // Demo coaching requests for Daniel
        const demoRequests =
          parsedDemoData.dashboardStats?.coachingRequests || [];

        setProfile(demoProfile);
        setStats(demoStats);
        setCoachingRequests(demoRequests);
        setSessions([]);
        setRecentActivity([]);

        console.log("✅ Demo coach dashboard data loaded for Daniel");
        setLoading(false);
        return;
      }

      // Load all data in parallel with individual error handling
      const [profileData, statsData, matchesData, sessionsData, activityData] =
        await Promise.allSettled([
          apiEnhanced.getCoachProfile(user.id).catch(() => null),
          apiEnhanced.getCoachStats(user.id).catch(() => null),
          apiEnhanced.getCoachMatches(user.id).catch(() => []),
          apiEnhanced
            .getCoachSessions(user.id, {
              status: "upcoming",
              limit: 10,
            })
            .catch(() => []),
          apiEnhanced.getCoachActivity(user.id, { limit: 20 }).catch(() => []),
        ]).then((results) => [
          results[0].status === "fulfilled" ? results[0].value : null,
          results[1].status === "fulfilled" ? results[1].value : null,
          results[2].status === "fulfilled" ? results[2].value : [],
          results[3].status === "fulfilled" ? results[3].value : [],
          results[4].status === "fulfilled" ? results[4].value : [],
        ]);

      // Set profile with fallback if API failed
      setProfile(
        profileData || {
          id: user.id,
          name: user.name,
          email: user.email,
          bio: "Professional coach dedicated to helping individuals and teams achieve their goals.",
          skills: ["Leadership", "Communication", "Team Building"],
          experience: 5,
          rating: 4.8,
          totalRatings: 25,
          hourlyRate: 150,
          currency: "USD",
          availability: {
            timezone: "EST",
            schedule: Array.from({ length: 7 }, (_, i) => ({
              day: [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ][i],
              startTime: "09:00",
              endTime: "17:00",
              available: i < 5, // Available Mon-Fri
            })),
          },
          certifications: ["Professional Coach Certification"],
          languages: ["English"],
          profileImage:
            user.picture ||
            "https://api.dicebear.com/7.x/avataaars/svg?seed=coach",
          isActive: true,
          joinedAt: "2024-01-01T00:00:00Z",
        },
      );

      // Set stats with fallback if API failed
      setStats(
        statsData || {
          totalSessions: 12,
          completedSessions: 8,
          averageRating: 4.8,
          totalEarnings: 2400,
          thisMonthEarnings: 800,
          upcomingSessions: 3,
          responseTime: 2.5,
          successRate: 95,
          repeatClients: 4,
          totalClients: 8,
          profileViews: 124,
          matchAcceptanceRate: 85,
        },
      );

      // Filter out matches that have been acted upon locally
      const pendingMatches = matchesData.filter((match) => {
        if (match.status !== "pending") return false;

        // Check if this match has been acted upon locally
        const matchAction = LocalStorageService.getItem(
          `match_action_${match.id}`,
        );
        if (matchAction && matchAction.coachId === user.id) {
          console.log(
            `Filtering out match ${match.id} due to local action:`,
            matchAction.action,
          );
          return false;
        }

        return true;
      });

      setPendingMatches(pendingMatches);
      setUpcomingSessions(sessionsData);
      setRecentActivity(activityData);

      analytics.trackAction({
        action: "dashboard_loaded",
        component: "coach_dashboard",
        metadata: {
          coachId: user.id,
          pendingMatches: matchesData.filter((m) => m.status === "pending")
            .length,
          upcomingSessions: sessionsData.length,
        },
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Failed to load dashboard data. Please try again.");

      analytics.trackError(
        error instanceof Error ? error : new Error("Dashboard load failed"),
        { component: "coach_dashboard", coachId: user.id },
      );
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast.success("Dashboard refreshed");
  };

  const handleAcceptMatch = async (matchId: string) => {
    if (!user) return;

    try {
      const result = await apiEnhanced.acceptMatch(matchId);

      if (result.success) {
        // Remove from pending matches and persist the action
        const updatedMatches = pendingMatches.filter(
          (match) => match.id !== matchId,
        );
        setPendingMatches(updatedMatches);

        // Persist match action to prevent data loss on refresh
        LocalStorageService.setItem(`match_action_${matchId}`, {
          action: "accepted",
          timestamp: new Date().toISOString(),
          coachId: user.id,
        });

        toast.success("Match accepted successfully!");

        // Notify company admin about match acceptance
        try {
          const match = pendingMatches.find((m) => m.id === matchId);
          if (match) {
            await emailService.sendCoachAcceptanceNotification({
              companyId: match.companyId,
              companyName: match.companyName,
              coachName: user.name,
              programTitle: match.title,
              matchId: matchId,
            });

            // Send real-time notification to company admin
            websocketService.sendMessage({
              userId: match.companyId,
              type: "match_accepted",
              message: `Coach ${user.name} has accepted your coaching program "${match.title}"`,
              data: { matchId, coachId: user.id, programTitle: match.title },
            });
          }
        } catch (notificationError) {
          console.warn("Failed to send admin notification:", notificationError);
          // Don't fail the match acceptance if notification fails
        }

        // Log interaction for backend tracking (Issues #6 & #7)
        try {
          await logMatchAction(user.id, "coach", matchId, "accepted");
          console.log("✅ Match acceptance interaction logged");
        } catch (logError) {
          console.warn("⚠️ Failed to log match action:", logError);
        }

        // Refresh stats
        await loadDashboardData();

        analytics.trackAction({
          action: "match_accepted",
          component: "coach_dashboard",
          metadata: { matchId, coachId: user.id },
        });
      }
    } catch (error) {
      console.error("Error accepting match:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to accept match",
      );

      analytics.trackError(
        error instanceof Error ? error : new Error("Match accept failed"),
        { component: "coach_dashboard", matchId, coachId: user.id },
      );
    }
  };

  const handleDeclineMatch = async (matchId: string, reason: string) => {
    if (!user) return;

    try {
      const result = await apiEnhanced.declineMatch(matchId, reason);

      if (result.success) {
        // Remove from pending matches and persist the action
        const updatedMatches = pendingMatches.filter(
          (match) => match.id !== matchId,
        );
        setPendingMatches(updatedMatches);

        // Persist match action to prevent data loss on refresh
        LocalStorageService.setItem(`match_action_${matchId}`, {
          action: "declined",
          timestamp: new Date().toISOString(),
          coachId: user.id,
          reason: reason,
        });

        toast.success("Match declined");

        // Notify company admin about match decline
        try {
          const match = pendingMatches.find((m) => m.id === matchId);
          if (match) {
            // Send real-time notification to company admin
            websocketService.sendMessage({
              userId: match.companyId,
              type: "match_declined",
              message: `Coach ${user.name} has declined your coaching program "${match.title}". Reason: ${reason}`,
              data: {
                matchId,
                coachId: user.id,
                programTitle: match.title,
                reason,
              },
            });
          }
        } catch (notificationError) {
          console.warn("Failed to send admin notification:", notificationError);
          // Don't fail the match decline if notification fails
        }

        // Log interaction for backend tracking (Issues #6 & #7)
        try {
          await logMatchAction(user.id, "coach", matchId, "declined", reason);
          console.log("✅ Match decline interaction logged");
        } catch (logError) {
          console.warn("⚠️ Failed to log match action:", logError);
        }

        setIsMatchDialogOpen(false);
        setSelectedMatch(null);
        setDeclineReason("");

        analytics.trackAction({
          action: "match_declined",
          component: "coach_dashboard",
          metadata: { matchId, coachId: user.id, reason },
        });
      }
    } catch (error) {
      console.error("Error declining match:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to decline match",
      );

      analytics.trackError(
        error instanceof Error ? error : new Error("Match decline failed"),
        { component: "coach_dashboard", matchId, coachId: user.id },
      );
    }
  };

  const updateAvailability = async (availability: any) => {
    if (!user) return;

    try {
      const result = await apiEnhanced.updateCoachAvailability(availability);

      // Update local profile
      if (profile) {
        setProfile({ ...profile, availability });
      }

      toast.success("Availability updated successfully");

      analytics.trackAction({
        action: "availability_updated",
        component: "coach_dashboard",
        metadata: { coachId: user.id },
      });
    } catch (error) {
      console.error("Error updating availability:", error);
      toast.error("Failed to update availability");

      analytics.trackError(
        error instanceof Error
          ? error
          : new Error("Availability update failed"),
        { component: "coach_dashboard", coachId: user.id },
      );
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "scheduled":
        return "bg-purple-100 text-purple-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredMatches = pendingMatches.filter((match) => {
    const matchesSearch =
      searchQuery === "" ||
      match.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.skills.some((skill) =>
        skill.toLowerCase().includes(searchQuery.toLowerCase()),
      );

    const matchesFilter =
      matchFilter === "all" || match.urgency === matchFilter;

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-lg text-muted-foreground">
                Loading your dashboard...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile || !stats) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Unable to Load Dashboard
            </h2>
            <p className="text-muted-foreground mb-4">
              We couldn't load your coaching dashboard. Please try refreshing
              the page.
            </p>
            <Button onClick={loadDashboardData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {profile.name}
            </h1>
            <p className="text-gray-600">
              Manage your coaching sessions, view match requests, and track your
              progress.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={refreshData}
              disabled={refreshing}
              className="flex items-center"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button onClick={() => navigate("/coach/settings")}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Sessions
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalSessions}
                  </p>
                  <p className="text-xs text-green-600">
                    +{stats.completedSessions} completed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Star className="h-8 w-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Average Rating
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.averageRating.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500">
                    from {stats.totalClients} clients
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    This Month
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${stats.thisMonthEarnings.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    Total: ${stats.totalEarnings.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Success Rate
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.successRate}%
                  </p>
                  <p className="text-xs text-gray-500">
                    {stats.repeatClients} repeat clients
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="matches" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="matches">
              Match Requests
              {pendingMatches.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {pendingMatches.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sessions">
              Upcoming Sessions
              {upcomingSessions.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {upcomingSessions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          </TabsList>

          {/* Match Requests Tab */}
          <TabsContent value="matches" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Match Requests</CardTitle>
                    <CardDescription>
                      Review and respond to coaching match requests
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search requests..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Select value={matchFilter} onValueChange={setMatchFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="high">High Priority</SelectItem>
                        <SelectItem value="medium">Medium Priority</SelectItem>
                        <SelectItem value="low">Low Priority</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredMatches.length === 0 ? (
                  <div className="text-center py-12">
                    <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No match requests
                    </h3>
                    <p className="text-gray-600">
                      {searchQuery || matchFilter !== "all"
                        ? "No requests match your current filters."
                        : "You don't have any pending match requests at the moment."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredMatches.map((match) => (
                      <div
                        key={match.id}
                        className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold">
                                {match.title}
                              </h3>
                              <Badge className={getUrgencyColor(match.urgency)}>
                                {match.urgency} priority
                              </Badge>
                            </div>
                            <p className="text-gray-600 mb-3">
                              {match.description}
                            </p>
                            <div className="flex items-center space-x-6 text-sm text-gray-500 mb-3">
                              <span className="flex items-center">
                                <Users className="w-4 h-4 mr-1" />
                                {match.participants} participants
                              </span>
                              <span className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {match.duration}
                              </span>
                              <span className="flex items-center">
                                <DollarSign className="w-4 h-4 mr-1" />$
                                {match.budget.min.toLocaleString()} - $
                                {match.budget.max.toLocaleString()}
                              </span>
                              <span className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                Start:{" "}
                                {new Date(
                                  match.preferredStartDate,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-4">
                              {match.skills.map((skill, index) => (
                                <Badge key={index} variant="outline">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                            <div className="text-sm text-gray-600">
                              <strong>Company:</strong> {match.companyName} •{" "}
                              <strong>Submitted:</strong>{" "}
                              {new Date(match.submittedAt).toLocaleDateString()}
                              {match.deadlineAt && (
                                <>
                                  {" • "}
                                  <strong>Deadline:</strong>{" "}
                                  {new Date(
                                    match.deadlineAt,
                                  ).toLocaleDateString()}
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t">
                          <Button
                            variant="outline"
                            onClick={() => {
                              console.log("Opening match details for:", match);
                              if (match && match.id) {
                                setSelectedMatch(match);
                                setIsMatchDialogOpen(true);
                              } else {
                                console.error("Invalid match data:", match);
                                toast.error(
                                  "Match details not available. Please refresh and try again.",
                                );
                              }
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              onClick={() =>
                                handleDeclineMatch(
                                  match.id,
                                  "Not a good fit at this time",
                                )
                              }
                            >
                              <ThumbsDown className="w-4 h-4 mr-2" />
                              Decline
                            </Button>
                            <Button onClick={() => handleAcceptMatch(match.id)}>
                              <ThumbsUp className="w-4 h-4 mr-2" />
                              Accept
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upcoming Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Sessions</CardTitle>
                <CardDescription>
                  Your scheduled coaching sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingSessions.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No upcoming sessions
                    </h3>
                    <p className="text-gray-600">
                      You don't have any sessions scheduled at the moment.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingSessions.map((session) => (
                      <div
                        key={session.id}
                        className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold">
                                {session.title}
                              </h3>
                              <Badge className={getStatusColor(session.status)}>
                                {session.status.replace("_", " ")}
                              </Badge>
                            </div>
                            <p className="text-gray-600 mb-3">
                              {session.description}
                            </p>
                            <div className="flex items-center space-x-6 text-sm text-gray-500 mb-3">
                              <span className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {new Date(
                                  session.startTime,
                                ).toLocaleDateString()}
                              </span>
                              <span className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {new Date(
                                  session.startTime,
                                ).toLocaleTimeString()}{" "}
                                -{" "}
                                {new Date(session.endTime).toLocaleTimeString()}
                              </span>
                              <span className="flex items-center">
                                <Users className="w-4 h-4 mr-1" />
                                {session.participants.length} participants
                              </span>
                              <span className="flex items-center">
                                <DollarSign className="w-4 h-4 mr-1" />$
                                {session.earnings}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              <strong>Company:</strong> {session.companyName}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            {session.meetingLink && (
                              <Button variant="outline" asChild>
                                <a
                                  href={session.meetingLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Video className="w-4 h-4 mr-2" />
                                  Join Session
                                </a>
                              </Button>
                            )}
                            <Button variant="outline">
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Messages
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Response Time</span>
                    <span className="font-semibold">
                      {stats.responseTime}h avg
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Match Acceptance Rate</span>
                    <span className="font-semibold">
                      {stats.matchAcceptanceRate}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Profile Views</span>
                    <span className="font-semibold">{stats.profileViews}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Repeat Clients</span>
                    <span className="font-semibold">
                      {stats.repeatClients}/{stats.totalClients}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Earnings Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>This Month</span>
                    <span className="font-semibold">
                      ${stats.thisMonthEarnings.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Total Earnings</span>
                    <span className="font-semibold">
                      ${stats.totalEarnings.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Average per Session</span>
                    <span className="font-semibold">
                      $
                      {stats.completedSessions > 0
                        ? Math.round(
                            stats.totalEarnings / stats.completedSessions,
                          )
                        : 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Hourly Rate</span>
                    <span className="font-semibold">${profile.hourlyRate}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Recent Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your recent coaching activities and notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No recent activity
                    </h3>
                    <p className="text-gray-600">
                      Your recent activities will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start space-x-4 p-4 border rounded-lg"
                      >
                        <div className="flex-shrink-0">
                          {activity.type === "match_request" && (
                            <Target className="w-5 h-5 text-blue-500" />
                          )}
                          {activity.type === "session_completed" && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                          {activity.type === "payment_received" && (
                            <DollarSign className="w-5 h-5 text-green-500" />
                          )}
                          {activity.type === "rating_received" && (
                            <Star className="w-5 h-5 text-yellow-500" />
                          )}
                          {activity.type === "profile_view" && (
                            <Eye className="w-5 h-5 text-purple-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{activity.title}</h4>
                          <p className="text-sm text-gray-600">
                            {activity.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Match Details Dialog */}
      <Dialog open={isMatchDialogOpen} onOpenChange={setIsMatchDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Match Request Details</DialogTitle>
            <DialogDescription>
              Review the complete details of this coaching opportunity
            </DialogDescription>
          </DialogHeader>
          {selectedMatch ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  {selectedMatch.title}
                </h3>
                <p className="text-gray-600">{selectedMatch.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium">Company</Label>
                  <p className="text-sm text-gray-600">
                    {selectedMatch.companyName}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Participants</Label>
                  <p className="text-sm text-gray-600">
                    {selectedMatch.participants} people
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Duration</Label>
                  <p className="text-sm text-gray-600">
                    {selectedMatch.duration}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Budget</Label>
                  <p className="text-sm text-gray-600">
                    ${selectedMatch.budget.min.toLocaleString()} - $
                    {selectedMatch.budget.max.toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Required Skills</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedMatch.skills.map((skill, index) => (
                    <Badge key={index} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Goals</Label>
                <div className="space-y-2 mt-1">
                  {selectedMatch.goals.map((goal) => (
                    <div key={goal.id} className="border rounded p-3">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium">{goal.title}</h4>
                        <Badge
                          variant={
                            goal.priority === "high"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {goal.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {goal.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Requirements</Label>
                <ul className="list-disc list-inside space-y-1 mt-1">
                  {selectedMatch.requirements.map((req, index) => (
                    <li key={index} className="text-sm text-gray-600">
                      {req}
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              <div className="flex justify-between space-x-4">
                <div className="flex-1">
                  <Label htmlFor="decline-reason">
                    Decline Reason (Optional)
                  </Label>
                  <Textarea
                    id="decline-reason"
                    placeholder="Provide a reason for declining this match..."
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    handleDeclineMatch(selectedMatch.id, declineReason);
                  }}
                >
                  Decline
                </Button>
                <Button onClick={() => handleAcceptMatch(selectedMatch.id)}>
                  Accept Match
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500">Match details not available</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CoachDashboard;
