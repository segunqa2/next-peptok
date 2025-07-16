import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Users,
  Target,
  TrendingUp,
  Mail,
  Star,
  MapPin,
  CheckCircle,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { apiEnhanced as api } from "@/services/apiEnhanced";
import {
  matchingService,
  getMatchingResult,
  type CoachMatch,
  type MatchingResult,
} from "@/services/matchingService";
import { MentorshipRequest } from "@/types";
import { toast } from "sonner";
import { TeamMemberManagementCard } from "@/components/mentorship/TeamMemberManagementCard";
import { SessionScheduleCard } from "@/components/sessions/SessionScheduleCard";

interface MatchedCoach extends CoachMatch {
  isSelected?: boolean;
}

export default function MentorshipRequestDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [request, setRequest] = useState<MentorshipRequest | null>(null);
  const [matchedCoaches, setMatchedCoaches] = useState<MatchedCoach[]>([]);
  const [matchingResults, setMatchingResults] = useState<MatchingResult | null>(
    null,
  );
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortByScore, setSortByScore] = useState<"desc" | "asc">("desc");

  const handleUpdateTeamMembers = async (updatedMembers: any[]) => {
    setTeamMembers(updatedMembers);

    // Update the request object
    if (request) {
      const updatedRequest = {
        ...request,
        teamMembers: updatedMembers,
      };
      setRequest(updatedRequest);

      // Persist team members to backend database
      try {
        await api.updateMentorshipRequest(request.id, updatedRequest);
        console.log("��� Team members updated in backend database");
      } catch (error) {
        console.error("Failed to update team members in backend:", error);
        // Don't show error toast as team members are still updated in UI
      }
    }
  };

  const loadMatchingResults = async (requestId: string) => {
    try {
      setLoadingMatches(true);

      // First try to get existing matching results
      const existingResults = await getMatchingResult(requestId);

      if (existingResults) {
        console.log("✅ Found existing matching results:", existingResults);
        setMatchingResults(existingResults);
        setMatchedCoaches(
          existingResults.matches.map((coach) => ({
            ...coach,
            isSelected: false,
          })),
        );
      } else {
        console.log(
          "ℹ️ No existing results found, generating new matches for:",
          requestId,
        );

        // Create a basic matching request from available data
        const basicRequest = {
          id: requestId,
          title: request?.title || "Mentorship Request",
          description: request?.description || "",
          requiredSkills: request?.preferredExpertise || [
            "Leadership",
            "Coaching",
          ],
          preferredExperience: "senior",
          budget: request?.budget?.max || 150,
          timeline: {
            startDate: new Date().toISOString(),
            endDate: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          },
          teamMembers: teamMembers.map((member) => member.email),
          goals: request?.goals?.map((g) => g.title) || [],
        };

        const newResults = await matchingService.findMatches(basicRequest);
        console.log("✅ Generated new matching results:", newResults);

        setMatchingResults(newResults);
        setMatchedCoaches(
          newResults.matches.map((coach) => ({ ...coach, isSelected: false })),
        );
      }
    } catch (error) {
      console.error("Failed to load matching results:", error);
      toast.error("Failed to load coach matches");

      // Set empty results as fallback
      setMatchedCoaches([]);
      setMatchingResults(null);
    } finally {
      setLoadingMatches(false);
    }
  };

  useEffect(() => {
    const fetchRequest = async () => {
      if (!id) {
        setError("Invalid request ID");
        setLoading(false);
        return;
      }

      if (!user) {
        setError("Authentication required");
        setLoading(false);
        return;
      }

      try {
        setError(null);
        // First try to fetch from API
        let foundRequest = null;

        try {
          const allRequests = await apiEnhanced.getMentorshipRequests();
          foundRequest = allRequests.find((req) => req.id === id);
        } catch (apiError) {
          console.warn("API call failed, using fallback data:", apiError);
        }

        if (foundRequest) {
          setRequest(foundRequest);
          setTeamMembers(foundRequest.teamMembers || []);

          // Also load any additional team members from backend invitations
          try {
            const { invitationService } = await import(
              "@/services/invitationService"
            );
            const invitations = await invitationService.getInvitations({
              programId: foundRequest.id,
              companyId: user?.companyId,
            });

            // Convert invitations to team members and merge with existing
            const teamMembersFromInvitations = invitations.map((inv) => ({
              id: `member-${inv.id}`,
              email: inv.email,
              name: inv.name,
              role: inv.role || "participant",
              status: inv.status === "pending" ? "invited" : inv.status,
              invitedAt: inv.createdAt,
            }));

            // Merge with existing team members, avoiding duplicates
            const existingEmails = (foundRequest.teamMembers || []).map((m) =>
              m.email?.toLowerCase(),
            );
            const newMembers = teamMembersFromInvitations.filter(
              (inv) => !existingEmails.includes(inv.email?.toLowerCase()),
            );

            if (newMembers.length > 0) {
              const allTeamMembers = [
                ...(foundRequest.teamMembers || []),
                ...newMembers,
              ];
              setTeamMembers(allTeamMembers);
              console.log(
                `✅ Loaded ${newMembers.length} additional team members from invitations`,
              );
            }
          } catch (error) {
            console.error("Failed to load team member invitations:", error);
            // Don't show error as this is a background operation
          }
        } else {
          // Always create a fallback request for any ID to ensure page works
          toast.info("Loading sample program data for demonstration");

          const mockRequest: MentorshipRequest = {
            id,
            companyId: user?.companyId || "default-company-id",
            title: "Sales and Marketing Development",
            description:
              "Department-wide coaching program designed to build up soft and hard sales and marketing skills to improve sales pipeline conversion.",
            goals: [
              {
                id: "goal_1",
                title: "Sales",
                description:
                  "Identify customer needs, craft tailored solutions, and guide prospects through a decision-making process to close deals",
                category: "business" as const,
                priority: "high" as const,
              },
              {
                id: "goal_2",
                title: "Marketing",
                description:
                  "Understand customer behavior, create compelling messages, and deliver them through the right channels to attract, engage, and retain target audiences",
                category: "business" as const,
                priority: "medium" as const,
              },
              {
                id: "goal_3",
                title: "Negotiation",
                description:
                  "Balance persuasion, active listening, and problem-solving to align value with client priorities, and secure win-win agreements that advance deals",
                category: "leadership" as const,
                priority: "high" as const,
              },
            ],
            metricsToTrack: [
              "Sales conversion rate",
              "Lead generation quality",
              "Customer retention",
            ],
            teamMembers: [
              {
                id: "member_1",
                email: "Rioe@teams.com",
                name: "Rio E",
                role: "participant" as const,
                status: "accepted" as const,
                invitedAt: new Date().toISOString(),
              },
            ],
            preferredExpertise: [
              "Marketing",
              "Sales Funnel Optimization",
              "Persuasion and Negotiation",
              "Customer Segmentation",
            ],
            budget: { min: 15000, max: 30000 },
            timeline: "16 weeks",
            participantGoal: 5,
            status: "active" as const,
            createdAt: new Date(
              Date.now() - 7 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            updatedAt: new Date().toISOString(),
          };

          setRequest(mockRequest);
          setTeamMembers(mockRequest.teamMembers || []);
        }

        // Load matching results for this request
        await loadMatchingResults(foundRequest?.id || id);
      } catch (error) {
        console.error("Failed to fetch mentorship request:", error);
        setError(error.message || "Failed to load mentorship request details");
        setRequest(null);
        toast.error("Failed to load mentorship request details");
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [id, user]);

  const handleSelectCoach = (coachId: string) => {
    setMatchedCoaches((prev) =>
      prev.map((coach) => ({
        ...coach,
        isSelected: coach.id === coachId ? !coach.isSelected : false,
      })),
    );
  };

  const sortCoachesByScore = () => {
    const newSort = sortByScore === "desc" ? "asc" : "desc";
    setSortByScore(newSort);

    setMatchedCoaches((prev) =>
      [...prev].sort((a, b) =>
        newSort === "desc"
          ? b.matchScore - a.matchScore
          : a.matchScore - b.matchScore,
      ),
    );
  };

  const getAverageMatchScore = () => {
    if (matchedCoaches.length === 0) return 0;
    const total = matchedCoaches.reduce(
      (sum, coach) => sum + coach.matchScore,
      0,
    );
    return total / matchedCoaches.length;
  };

  const [pricingConfig, setPricingConfig] = useState({
    companyServiceFee: 0.1,
    additionalParticipantFee: 25,
    currency: "CAD",
  });

  useEffect(() => {
    const fetchPricingConfig = async () => {
      try {
        const config = await apiEnhanced.getPricingConfig();
        setPricingConfig(config);
      } catch (error) {
        console.warn("Using default pricing config:", error);
      }
    };
    fetchPricingConfig();
  }, []);

  const calculateDetailedCosts = (hourlyRate: number) => {
    if (!request) return null;

    // Handle both old and new timeline formats
    let totalSessions: number;
    let hoursPerSession: number;

    if (typeof request.timeline === "string") {
      // Old format - estimate based on timeline string
      const timelineStr = request.timeline.toLowerCase();
      if (timelineStr.includes("week")) {
        const weeks = parseInt(timelineStr.match(/(\d+)/)?.[0] || "4");
        totalSessions = weeks;
        hoursPerSession = 2; // Default assumption
      } else if (timelineStr.includes("month")) {
        const months = parseInt(timelineStr.match(/(\d+)/)?.[0] || "3");
        totalSessions = months * 4; // Weekly sessions
        hoursPerSession = 2;
      } else {
        totalSessions = 8; // Default fallback
        hoursPerSession = 2;
      }
    } else {
      // New detailed timeline format
      totalSessions = request.timeline.totalSessions;
      hoursPerSession = request.timeline.hoursPerSession;
    }

    const sessionCost = hourlyRate * hoursPerSession;
    const baseSessionsCost = sessionCost * totalSessions;

    // Additional participants cost (beyond included participants)
    const teamMembersCount = request.teamMembers
      ? request.teamMembers.length
      : request.participants || 1;
    const maxIncluded = pricingConfig.maxParticipantsIncluded || 1;
    const additionalParticipants = Math.max(0, teamMembersCount - maxIncluded);
    const additionalParticipantsCost =
      additionalParticipants *
      pricingConfig.additionalParticipantFee *
      totalSessions;

    const subtotal = baseSessionsCost + additionalParticipantsCost;
    const serviceFee = subtotal * pricingConfig.companyServiceFee;
    const totalProgramCost = subtotal + serviceFee;

    return {
      hourlyRate,
      sessionCost,
      totalSessions,
      baseSessionsCost,
      additionalParticipants,
      additionalParticipantsCost,
      serviceFee,
      serviceFeePct: pricingConfig.companyServiceFee * 100,
      totalProgramCost,
      avgCostPerSession: totalProgramCost / totalSessions,
      currency: pricingConfig.currency,
    };
  };

  const calculateTotalCost = (hourlyRate: number) => {
    const costs = calculateDetailedCosts(hourlyRate);
    return costs ? costs.totalProgramCost : 0;
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case "immediate":
        return "bg-green-100 text-green-800";
      case "this_week":
        return "bg-blue-100 text-blue-800";
      case "next_week":
        return "bg-yellow-100 text-yellow-800";
      case "available":
        return "bg-green-100 text-green-800";
      case "limited":
        return "bg-yellow-100 text-yellow-800";
      case "busy":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "participant":
        return "bg-blue-100 text-blue-800";
      case "observer":
        return "bg-gray-100 text-gray-800";
      case "admin":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            Loading mentorship request details...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Error Loading Request</p>
            <p className="text-sm">{error}</p>
          </div>
          <div className="space-x-2">
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Mentorship request not found.</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {request.title}
              </h1>
              <p className="text-gray-600 mt-2">{request.description}</p>
            </div>
            <Badge className={getStatusColor(request.status)}>
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Program Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {request.goals.map((goal, index) => (
                    <div
                      key={index}
                      className="border-l-4 border-blue-500 pl-4"
                    >
                      <h4 className="font-semibold">{goal.title}</h4>
                      {goal.description && (
                        <p className="text-gray-600 text-sm mt-1">
                          {goal.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Success Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {request.metricsToTrack.map((metric, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">{metric}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Team Members */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Team Members ({request.teamMembers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {request.teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={`https://avatar.vercel.sh/${member.email}`}
                          />
                          <AvatarFallback>
                            {(member.name || member.email)
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {member.name || member.email}
                          </p>
                          {member.name && (
                            <p className="text-sm text-gray-600">
                              {member.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getRoleColor(member.role)}>
                          {member.role}
                        </Badge>
                        <Badge className={getStatusColor(member.status)}>
                          {member.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Matched Coaches */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Matched Coaches ({matchedCoaches.length})
                    </CardTitle>
                    {matchingResults && (
                      <div className="text-sm text-gray-600 mt-1 space-y-1">
                        <p>
                          Algorithm: {matchingResults.algorithmVersion} •
                          Updated:{" "}
                          {new Date(matchingResults.timestamp).toLocaleString()}
                        </p>
                        {matchedCoaches.length > 0 && (
                          <p className="flex items-center gap-4">
                            <span>
                              Average Match:{" "}
                              <span className="font-semibold text-blue-600">
                                {Math.round(getAverageMatchScore() * 100)}%
                              </span>
                            </span>
                            <span>
                              Best Match:{" "}
                              <span className="font-semibold text-green-600">
                                {Math.round(
                                  Math.max(
                                    ...matchedCoaches.map((c) => c.matchScore),
                                  ) * 100,
                                )}
                                %
                              </span>
                            </span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={sortCoachesByScore}
                      title={`Sort by match score ${sortByScore === "desc" ? "ascending" : "descending"}`}
                    >
                      {sortByScore === "desc" ? (
                        <ArrowDown className="w-4 h-4 mr-2" />
                      ) : (
                        <ArrowUp className="w-4 h-4 mr-2" />
                      )}
                      Sort by Score
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadMatchingResults(id!)}
                      disabled={loadingMatches}
                    >
                      {loadingMatches ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Refresh Matches
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                {matchingResults && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant="outline">
                      Skill: {matchingResults.configUsed.skillMatch}%
                    </Badge>
                    <Badge variant="outline">
                      Experience: {matchingResults.configUsed.experience}%
                    </Badge>
                    <Badge variant="outline">
                      Rating: {matchingResults.configUsed.rating}%
                    </Badge>
                    <Badge variant="outline">
                      Availability: {matchingResults.configUsed.availability}%
                    </Badge>
                    <Badge variant="outline">
                      Price: {matchingResults.configUsed.price}%
                    </Badge>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {matchedCoaches.map((coach) => (
                    <div
                      key={coach.id}
                      className="border rounded-lg p-4 space-y-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage
                              src={
                                coach.profileImage ||
                                `https://avatar.vercel.sh/${coach.name}`
                              }
                            />
                            <AvatarFallback>
                              {coach.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-lg">
                                {coach.name}
                              </h4>
                              <span
                                className={`text-sm px-2 py-1 rounded-full font-medium ${
                                  coach.matchScore >= 80
                                    ? "bg-green-100 text-green-700"
                                    : coach.matchScore >= 60
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {Math.round(coach.matchScore * 100)}%
                              </span>
                            </div>
                            <p className="text-gray-600">{coach.title}</p>
                            <p className="text-sm text-gray-500">
                              {coach.yearsExperience} years experience •{" "}
                              {coach.timezone}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-medium">
                                  {coach.rating}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  {coach.languages.join(", ")}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          {/* Match Score Badge */}
                          <div className="flex justify-end">
                            <Badge
                              className={`text-sm font-semibold ${
                                coach.matchScore >= 80
                                  ? "bg-green-100 text-green-800 border-green-300"
                                  : coach.matchScore >= 60
                                    ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                                    : "bg-gray-100 text-gray-800 border-gray-300"
                              }`}
                            >
                              {Math.round(coach.matchScore * 100)}% Match
                            </Badge>
                          </div>
                          <div className="text-lg font-bold">
                            ${coach.hourlyRate}/hr
                          </div>
                          <div className="text-sm space-y-1">
                            {user?.userType === "company" ? (
                              (() => {
                                const costs = calculateDetailedCosts(
                                  coach.hourlyRate,
                                );
                                return costs ? (
                                  <div className="space-y-1">
                                    <div className="text-gray-600">
                                      <span className="font-medium text-gray-800">
                                        Session Cost:
                                      </span>{" "}
                                      ${costs.sessionCost}/session
                                    </div>
                                    <div className="text-gray-600">
                                      <span className="font-medium text-gray-800">
                                        Total Sessions:
                                      </span>{" "}
                                      {costs.totalSessions}
                                    </div>
                                    <div className="text-gray-600">
                                      <span className="font-medium text-gray-800">
                                        Program Cost:
                                      </span>{" "}
                                      ${costs.baseSessionsCost.toFixed(2)}
                                    </div>
                                    {costs.additionalParticipants > 0 && (
                                      <div className="text-gray-600">
                                        <span className="font-medium text-gray-800">
                                          Additional Participants:
                                        </span>{" "}
                                        $
                                        {costs.additionalParticipantsCost.toFixed(
                                          2,
                                        )}
                                      </div>
                                    )}
                                    <div className="text-gray-600">
                                      <span className="font-medium text-gray-800">
                                        Service Fee (
                                        {costs.serviceFeePct.toFixed(0)}%):
                                      </span>{" "}
                                      ${costs.serviceFee.toFixed(2)}
                                    </div>
                                    <div className="pt-1 border-t border-gray-200">
                                      <div className="font-semibold text-blue-600">
                                        Total Program: $
                                        {costs.totalProgramCost.toFixed(2)}{" "}
                                        {costs.currency}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        ${costs.avgCostPerSession.toFixed(2)}
                                        /session average
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-blue-600 font-semibold">
                                    Rate: ${coach.hourlyRate}/hr
                                  </div>
                                );
                              })()
                            ) : (
                              <div className="text-blue-600 font-semibold">
                                Rate: ${coach.hourlyRate}/hr
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge
                          className={getAvailabilityColor(coach.availability)}
                        >
                          {coach.availability}
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-600">{coach.bio}</p>

                      {/* Match Score and Reasons */}
                      <div
                        className={`border-2 rounded-lg p-3 ${
                          coach.matchScore >= 80
                            ? "bg-green-50 border-green-200"
                            : coach.matchScore >= 60
                              ? "bg-yellow-50 border-yellow-200"
                              : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm font-medium text-gray-900">
                              Match Score
                            </span>
                          </div>
                          <Badge
                            className={`text-base font-bold px-3 py-1 ${
                              coach.matchScore >= 80
                                ? "bg-green-100 text-green-800 border-green-300"
                                : coach.matchScore >= 60
                                  ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                                  : "bg-gray-100 text-gray-800 border-gray-300"
                            }`}
                          >
                            {Math.round(coach.matchScore * 100)}%
                          </Badge>
                        </div>
                        {coach.matchReasons &&
                          coach.matchReasons.length > 0 && (
                            <div className="space-y-1">
                              {coach.matchReasons.map((reason, index) => (
                                <div
                                  key={index}
                                  className="text-xs text-blue-700 flex items-center gap-1"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  {reason}
                                </div>
                              ))}
                            </div>
                          )}
                        {coach.estimatedCost && (
                          <div className="mt-2 pt-2 border-t border-blue-200">
                            <span className="text-xs text-blue-700">
                              Estimated program cost: $
                              {coach.estimatedCost.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {coach.expertise.map((skill, index) => (
                          <Badge key={index} variant="outline">
                            {skill}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="text-sm text-gray-600">
                          Available for{" "}
                          {coach.availability === "immediate"
                            ? "immediate start"
                            : coach.availability === "this_week"
                              ? "start this week"
                              : coach.availability === "next_week"
                                ? "start next week"
                                : coach.availability}{" "}
                        </div>
                        {coach.isSelected ? (
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Selected
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSelectCoach(coach.id)}
                            >
                              Deselect
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelectCoach(coach.id)}
                          >
                            Select Coach
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Session Schedule */}
            <SessionScheduleCard
              requestId={request.id}
              programTitle={request.title}
            />

            {/* Team Member Management */}
            <TeamMemberManagementCard
              teamMembers={teamMembers}
              onUpdateTeamMembers={handleUpdateTeamMembers}
              programTitle={request.title}
              programId={request.id}
              readOnly={user?.userType !== "company_admin"}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {typeof request.timeline === "string" ? (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Duration
                    </label>
                    <p className="font-semibold">{request.timeline}</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Start Date
                      </label>
                      <p className="font-semibold">
                        {new Date(
                          request.timeline.startDate,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        End Date
                      </label>
                      <p className="font-semibold">
                        {new Date(
                          request.timeline.endDate,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Session Frequency
                      </label>
                      <p className="font-semibold capitalize">
                        {request.timeline.sessionFrequency}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Budget */}
            <Card>
              <CardHeader>
                <CardTitle>Budget Range</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {request.budget
                    ? `$${request.budget.min.toLocaleString()} - $${request.budget.max.toLocaleString()}`
                    : "Budget not specified"}
                </p>
              </CardContent>
            </Card>

            {/* Preferred Expertise */}
            <Card>
              <CardHeader>
                <CardTitle>Preferred Expertise</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {request.preferredExpertise.map((expertise, index) => (
                    <Badge key={index} variant="secondary">
                      {expertise}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full">
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Team
                </Button>
                <Button variant="outline" className="w-full">
                  Export Details
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
