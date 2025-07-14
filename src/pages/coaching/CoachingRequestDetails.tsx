import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Users,
  Target,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
  Star,
  MessageSquare,
  Video,
} from "lucide-react";
import Header from "@/components/layout/Header";
import { apiEnhanced as api } from "@/services/apiEnhanced";
import {
  findCoachMatches,
  acceptCoachMatch,
  rejectCoachMatch,
  type MatchedCoach,
} from "@/services/matchingService";
import { CoachingRequest } from "@/types";
import { toast } from "sonner";
import { SimpleTeamMemberCard } from "@/components/coaching/SimpleTeamMemberCard";
import { useAuth } from "@/contexts/AuthContext";
import LocalStorageService from "@/services/localStorageService";

export default function CoachingRequestDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [request, setRequest] = useState<CoachingRequest | null>(null);
  const [matchedCoaches, setMatchedCoaches] = useState<MatchedCoach[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      loadCoachingRequest(id);
    }
  }, [id]);

  const loadCoachingRequest = async (requestId: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log(`📄 Loading coaching request: ${requestId}`);

      // Try to get from API first
      let foundRequest: CoachingRequest | null = null;

      try {
        foundRequest = await api.getCoachingRequest(requestId);
        if (foundRequest) {
          console.log("✅ Request loaded from API");
        }
      } catch (apiError) {
        console.warn("API request failed, checking localStorage:", apiError);
      }

      // Fallback to localStorage
      if (!foundRequest) {
        console.log("🔍 Searching localStorage for request...");
        const allRequests = LocalStorageService.getCoachingRequests();
        foundRequest = allRequests.find((req) => req.id === requestId) || null;

        if (foundRequest) {
          console.log("✅ Request found in localStorage");
        }
      }

      // Create mock request if still not found (for demo purposes)
      if (!foundRequest) {
        console.log("🎭 Creating mock request for demo");
        foundRequest = {
          id: requestId,
          title: request?.title || "Coaching Request",
          description: request?.description || "",
          companyId: user?.companyId || "demo-company",
          status: "submitted",
          goals: request?.goals || [],
          metricsToTrack: request?.metricsToTrack || [],
          teamMembers: request?.teamMembers || [],
          preferredExpertise: request?.preferredExpertise || [],
          timeline: request?.timeline || {
            startDate: new Date().toISOString(),
            endDate: new Date(
              Date.now() + 90 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            sessionFrequency: "bi-weekly",
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      setRequest(foundRequest);
      setTeamMembers(foundRequest.teamMembers || []);

      // Load matched coaches
      if (foundRequest.status !== "draft") {
        await loadMatchedCoaches(foundRequest);
      }
    } catch (error: any) {
      console.error("Failed to fetch coaching request:", error);
      setError(error.message || "Failed to load coaching request details");
      setRequest(null);
      toast.error("Failed to load coaching request details");
    } finally {
      setLoading(false);
    }
  };

  const loadMatchedCoaches = async (request: CoachingRequest) => {
    try {
      console.log("🔍 Finding matched coaches for request...");

      const matchingRequest = {
        id: request.id,
        title: request.title,
        description: request.description,
        requiredSkills: request.preferredExpertise || [],
        preferredExperience: "mid-level",
        budget: request.budget || 150,
        timeline: {
          startDate: request.timeline.startDate,
          endDate: request.timeline.endDate,
        },
        teamMembers: request.teamMembers?.map((member) => member.email) || [],
        goals: request.goals?.map((g) => g.title) || [],
      };

      const matches = await findCoachMatches(matchingRequest);
      console.log(`🎯 Found ${matches.length} coach matches`);
      setMatchedCoaches(matches);
    } catch (error) {
      console.error("Failed to load matched coaches:", error);
      toast.error("Failed to load coach matches");
    }
  };

  const handleTeamMemberUpdate = async (updatedTeamMembers: any[]) => {
    setTeamMembers(updatedTeamMembers);

    if (request) {
      try {
        const updatedRequest = {
          ...request,
          teamMembers: updatedTeamMembers,
        };

        await api.updateCoachingRequest(request.id, updatedRequest);
        setRequest(updatedRequest);
        console.log("✅ Team members updated in coaching request");
      } catch (error) {
        console.error("Failed to update coaching request:", error);
        toast.error("Failed to update team members");
      }
    }
  };

  const handleAcceptCoach = async (coachId: string) => {
    if (!request) return;

    try {
      await acceptCoachMatch(request.id, coachId);

      // Update local state
      setMatchedCoaches((prev) =>
        prev.map((coach) =>
          coach.id === coachId ? { ...coach, status: "accepted" } : coach,
        ),
      );

      // Update request status
      const updatedRequest = { ...request, status: "matched" as const };
      await api.updateCoachingRequest(request.id, updatedRequest);
      setRequest(updatedRequest);

      toast.success("Coach accepted! You'll be connected soon.");
    } catch (error) {
      console.error("Failed to accept coach:", error);
      toast.error("Failed to accept coach");
    }
  };

  const handleRejectCoach = async (coachId: string) => {
    if (!request) return;

    try {
      await rejectCoachMatch(request.id, coachId);

      // Remove from local state
      setMatchedCoaches((prev) => prev.filter((coach) => coach.id !== coachId));

      toast.success("Coach declined");
    } catch (error) {
      console.error("Failed to reject coach:", error);
      toast.error("Failed to reject coach");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-100/30">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-4">
              <Clock className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">
                Loading coaching request details...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-100/30">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error || "Coaching request not found."}
              </AlertDescription>
            </Alert>
            <div className="text-center mt-8">
              <Button onClick={() => navigate(-1)} className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "submitted":
        return <Badge variant="default">Submitted</Badge>;
      case "matched":
        return (
          <Badge variant="default" className="bg-green-600">
            Matched
          </Badge>
        );
      case "active":
        return (
          <Badge variant="default" className="bg-blue-600">
            Active
          </Badge>
        );
      case "completed":
        return <Badge variant="outline">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-100/30">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>

          <div className="space-y-8">
            {/* Request Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{request.title}</CardTitle>
                    <CardDescription className="mt-2 text-base">
                      {request.description}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(request.status)}
                    <span className="text-sm text-muted-foreground">
                      Created {new Date(request.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Duration</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(
                          request.timeline.startDate,
                        ).toLocaleDateString()}{" "}
                        -{" "}
                        {new Date(
                          request.timeline.endDate,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Team Size</p>
                      <p className="text-sm text-muted-foreground">
                        {teamMembers.length} members
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Frequency</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {request.timeline.sessionFrequency.replace("-", " ")}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Goals */}
            {request.goals && request.goals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    Program Goals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {request.goals.map((goal) => (
                      <div key={goal.id} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{goal.title}</h4>
                          <Badge
                            variant={
                              goal.priority === "high"
                                ? "destructive"
                                : goal.priority === "medium"
                                  ? "default"
                                  : "secondary"
                            }
                          >
                            {goal.priority}
                          </Badge>
                          <Badge variant="outline">{goal.category}</Badge>
                        </div>
                        {goal.description && (
                          <p className="text-sm text-muted-foreground">
                            {goal.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Matched Coaches */}
            {matchedCoaches.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-blue-600" />
                    Matched Coaches ({matchedCoaches.length})
                  </CardTitle>
                  <CardDescription>
                    These coaches have been matched to your program based on
                    your requirements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {matchedCoaches.map((coach) => (
                      <Card key={coach.id} className="relative">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={coach.avatar} />
                              <AvatarFallback>
                                {coach.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="font-semibold">{coach.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {coach.title}
                              </p>
                              <div className="flex items-center gap-1 mt-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-medium">
                                  {coach.rating}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  ({coach.totalSessions} sessions)
                                </span>
                              </div>
                              <div className="absolute top-4 right-4">
                                <Badge variant="outline">
                                  {coach.matchScore}% match
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4">
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {coach.bio}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-1 mt-3">
                            {coach.expertise.slice(0, 3).map((skill) => (
                              <Badge
                                key={skill}
                                variant="secondary"
                                className="text-xs"
                              >
                                {skill}
                              </Badge>
                            ))}
                            {coach.expertise.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{coach.expertise.length - 3} more
                              </Badge>
                            )}
                          </div>

                          <div className="flex gap-2 mt-4">
                            <Button
                              size="sm"
                              onClick={() => handleAcceptCoach(coach.id)}
                              disabled={coach.status === "accepted"}
                              className="flex-1"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              {coach.status === "accepted"
                                ? "Accepted"
                                : "Accept"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectCoach(coach.id)}
                              disabled={coach.status === "accepted"}
                            >
                              Decline
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Team Members */}
            <SimpleTeamMemberCard
              teamMembers={teamMembers}
              onUpdateTeamMembers={handleTeamMemberUpdate}
              programTitle={request.title}
              programId={request.id}
              readOnly={request.status === "completed"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
