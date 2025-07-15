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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Clock,
  Users,
  Target,
  DollarSign,
  MapPin,
  Phone,
  Video,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Play,
  Calendar as CalendarIcon,
  FileText,
  Star,
  TrendingUp,
  Award,
  BarChart3,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
} from "lucide-react";
import { Program, ProgramSession } from "@/types/program";
import { programService } from "@/services/programService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProgramDetailsProps {
  programId: string;
  onBack?: () => void;
}

const getSessionTypeIcon = (type: string) => {
  switch (type) {
    case "video":
      return <Video className="w-4 h-4" />;
    case "audio":
      return <Phone className="w-4 h-4" />;
    case "chat":
      return <MessageSquare className="w-4 h-4" />;
    case "in-person":
      return <MapPin className="w-4 h-4" />;
    default:
      return <Video className="w-4 h-4" />;
  }
};

const getStatusIcon = (status: Program["status"]) => {
  switch (status) {
    case "pending_coach_acceptance":
      return <AlertCircle className="w-5 h-5" />;
    case "in_progress":
      return <Play className="w-5 h-5" />;
    case "completed":
      return <CheckCircle className="w-5 h-5" />;
    case "cancelled":
      return <XCircle className="w-5 h-5" />;
    default:
      return <AlertCircle className="w-5 h-5" />;
  }
};

const getStatusColor = (status: Program["status"]) => {
  switch (status) {
    case "pending_coach_acceptance":
      return "text-yellow-600";
    case "in_progress":
      return "text-blue-600";
    case "completed":
      return "text-green-600";
    case "cancelled":
      return "text-red-600";
    default:
      return "text-gray-600";
  }
};

export const ProgramDetails: React.FC<ProgramDetailsProps> = ({
  programId,
  onBack,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [program, setProgram] = useState<Program | null>(null);
  const [sessions, setSessions] = useState<ProgramSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCoachResponseDialog, setShowCoachResponseDialog] = useState(false);
  const [coachResponseMessage, setCoachResponseMessage] = useState("");
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  useEffect(() => {
    loadProgramData();
  }, [programId]);

  const loadProgramData = async () => {
    try {
      setIsLoading(true);
      const [programData, sessionsData] = await Promise.all([
        programService.getProgramById(programId),
        programService.getProgramSessions(programId),
      ]);

      setProgram(programData);
      setSessions(sessionsData);
    } catch (error) {
      console.error("Failed to load program data:", error);
      toast.error("Failed to load program details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCoachResponse = async (response: "accepted" | "rejected") => {
    if (!program || !user) return;

    setIsSubmittingResponse(true);
    try {
      await programService.respondToProgram(
        program.id,
        response,
        coachResponseMessage || undefined,
      );

      await loadProgramData();
      setShowCoachResponseDialog(false);
      setCoachResponseMessage("");
      toast.success(
        `Program ${response === "accepted" ? "accepted" : "rejected"} successfully`,
      );
    } catch (error) {
      toast.error("Failed to respond to program");
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const canRespondAsCoach = () => {
    return (
      user?.userType === "coach" &&
      program?.assignedCoachId === user.id &&
      program?.status === "pending_coach_acceptance" &&
      !program?.coachResponse
    );
  };

  const canEditProgram = () => {
    return (
      user?.userType === "company_admin" &&
      program?.companyId === user.companyId &&
      program?.requesterId === user.id && // Only the company admin who created the program
      (program?.status === "draft" ||
        program?.status === "pending_coach_acceptance")
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-muted rounded w-2/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Program Not Found</h3>
          <p className="text-muted-foreground mb-4">
            The requested program could not be found.
          </p>
          <Button onClick={onBack || (() => navigate(-1))}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold">{program.title}</h1>
            <p className="text-muted-foreground">{program.companyName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "flex items-center gap-2",
              getStatusColor(program.status),
            )}
          >
            {getStatusIcon(program.status)}
            {program.status
              .replace("_", " ")
              .replace(/\b\w/g, (l) => l.toUpperCase())}
          </Badge>
          {canEditProgram() && (
            <Button
              variant="outline"
              onClick={() => navigate(`/programs/${program.id}/edit`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Coach Response Section */}
      {canRespondAsCoach() && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="w-5 h-5" />
              Coach Response Required
            </CardTitle>
            <CardDescription className="text-yellow-700">
              This program is waiting for your acceptance. Please review the
              details and respond.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Dialog
                open={showCoachResponseDialog}
                onOpenChange={setShowCoachResponseDialog}
              >
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    Accept Program
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Accept Program</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to accept this coaching program? You
                      can add an optional message for the company.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Optional message to the company..."
                      value={coachResponseMessage}
                      onChange={(e) => setCoachResponseMessage(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowCoachResponseDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => handleCoachResponse("accepted")}
                        disabled={isSubmittingResponse}
                      >
                        Accept Program
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => {
                  setShowCoachResponseDialog(true);
                }}
              >
                <ThumbsDown className="w-4 h-4 mr-2" />
                Decline Program
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Coach Response Status */}
      {program.coachResponse && (
        <Card
          className={cn(
            program.coachResponse.status === "accepted"
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50",
          )}
        >
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              {program.coachResponse.status === "accepted" ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              <div>
                <h4
                  className={cn(
                    "font-medium",
                    program.coachResponse.status === "accepted"
                      ? "text-green-800"
                      : "text-red-800",
                  )}
                >
                  Coach{" "}
                  {program.coachResponse.status === "accepted"
                    ? "Accepted"
                    : "Declined"}{" "}
                  Program
                </h4>
                {program.coachResponse.message && (
                  <p
                    className={cn(
                      "text-sm mt-1",
                      program.coachResponse.status === "accepted"
                        ? "text-green-700"
                        : "text-red-700",
                    )}
                  >
                    "{program.coachResponse.message}"
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Responded on{" "}
                  {program.coachResponse.respondedAt &&
                    formatDate(program.coachResponse.respondedAt)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Program Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Progress Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Progress</span>
                  <span className="font-medium">
                    {program.progress.progressPercentage}%
                  </span>
                </div>
                <Progress value={program.progress.progressPercentage} />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Completed</p>
                  <p className="font-medium">
                    {program.progress.completedSessions}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Sessions</p>
                  <p className="font-medium">
                    {program.progress.totalSessions}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Start Date</span>
                <span>{formatDate(program.timeline.startDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">End Date</span>
                <span>{formatDate(program.timeline.endDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frequency</span>
                <span className="capitalize">
                  {program.timeline.sessionFrequency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Session Length</span>
                <span>{program.timeline.hoursPerSession}h</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Type</span>
                <div className="flex items-center gap-1">
                  {getSessionTypeIcon(program.timeline.sessionType)}
                  <span className="capitalize">
                    {program.timeline.sessionType}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budget Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Budget Range</span>
                <span>
                  {program.budget.currency} {program.budget.min} -{" "}
                  {program.budget.max}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Budget</span>
                <span className="font-medium">
                  {program.budget.currency}{" "}
                  {program.budget.totalBudget || program.budget.max}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Per Session</span>
                <span>
                  {program.budget.currency}{" "}
                  {Math.round(
                    (program.budget.totalBudget || program.budget.max) /
                      program.timeline.totalSessions,
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Program Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{program.description}</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Skills & Focus Areas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Required Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {program.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Focus Areas</h4>
                  <div className="flex flex-wrap gap-2">
                    {program.focusAreas.map((area) => (
                      <Badge key={area} variant="outline">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Program Level & Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Level</span>
                  <Badge className="capitalize">{program.level}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{formatDate(program.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>{formatDate(program.updatedAt)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Program Sessions ({sessions.length})
              </CardTitle>
              <CardDescription>
                All sessions scheduled for this program based on the timeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessions.map((session, index) => (
                  <div
                    key={session.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{session.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Session {session.sessionNumber} of{" "}
                          {program.timeline.totalSessions}
                        </p>
                      </div>
                      <Badge
                        variant={
                          session.status === "completed"
                            ? "default"
                            : session.status === "cancelled"
                              ? "destructive"
                              : "outline"
                        }
                      >
                        {session.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{formatDate(session.scheduledDate)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {formatTime(session.scheduledTime)} (
                          {session.duration}m)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getSessionTypeIcon(session.type)}
                        <span className="capitalize">{session.type}</span>
                      </div>
                    </div>

                    {session.description && (
                      <p className="text-sm text-muted-foreground">
                        {session.description}
                      </p>
                    )}

                    {session.outcomes && (
                      <div className="bg-muted rounded p-3">
                        <h5 className="font-medium text-sm mb-2">
                          Session Summary
                        </h5>
                        <p className="text-sm">{session.outcomes.summary}</p>
                        {session.outcomes.achievements.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground mb-1">
                              Achievements:
                            </p>
                            <ul className="text-xs space-y-1">
                              {session.outcomes.achievements.map(
                                (achievement, i) => (
                                  <li
                                    key={i}
                                    className="flex items-center gap-1"
                                  >
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                    {achievement}
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {sessions.length === 0 && (
                  <div className="text-center py-8">
                    <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      No Sessions Yet
                    </h3>
                    <p className="text-muted-foreground">
                      Sessions will be generated based on the program timeline.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Participants Tab */}
        <TabsContent value="participants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Participants ({program.participants.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {program.participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center gap-4 p-4 border rounded-lg"
                  >
                    <Avatar>
                      <AvatarFallback>
                        {participant.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-medium">{participant.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {participant.role}
                        {participant.department &&
                          ` • ${participant.department}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {participant.email}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Session Generation */}
          {canEditProgram() && (
            <SessionGenerator
              programId={program.id}
              programTitle={program.title}
              startDate={program.timeline.startDate}
              endDate={program.timeline.endDate}
              defaultFrequency={program.timeline.sessionFrequency}
              onSessionsGenerated={(sessions) => {
                console.log("Sessions generated:", sessions);
                // Optionally refresh program data or show success message
              }}
            />
          )}
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Program Goals ({program.goals.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {program.goals.map((goal) => (
                  <div key={goal.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{goal.title}</h4>
                      <div className="flex items-center gap-2">
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
                        {goal.completed && (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {goal.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Program Timeline
              </CardTitle>
              <CardDescription>
                Visual representation of the program schedule and milestones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Timeline Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                  <div className="text-center">
                    <p className="text-2xl font-bold">
                      {program.timeline.totalSessions}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total Sessions
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">
                      {program.timeline.totalSessions *
                        program.timeline.hoursPerSession}
                      h
                    </p>
                    <p className="text-sm text-muted-foreground">Total Hours</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold capitalize">
                      {program.timeline.sessionFrequency}
                    </p>
                    <p className="text-sm text-muted-foreground">Frequency</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">
                      {Math.ceil(
                        (new Date(program.timeline.endDate).getTime() -
                          new Date(program.timeline.startDate).getTime()) /
                          (1000 * 60 * 60 * 24 * 7),
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">Weeks</p>
                  </div>
                </div>

                {/* Timeline Visualization */}
                <div className="space-y-2">
                  <h4 className="font-medium">Session Schedule</h4>
                  <div className="space-y-2">
                    {sessions.slice(0, 10).map((session, index) => (
                      <div
                        key={session.id}
                        className="flex items-center gap-4 p-3 border rounded"
                      >
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
                            session.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : session.status === "cancelled"
                                ? "bg-red-100 text-red-700"
                                : "bg-blue-100 text-blue-700",
                          )}
                        >
                          {session.sessionNumber}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{session.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(session.scheduledDate)} at{" "}
                            {formatTime(session.scheduledTime)}
                          </p>
                        </div>
                        <Badge
                          variant={
                            session.status === "completed"
                              ? "default"
                              : session.status === "cancelled"
                                ? "destructive"
                                : "outline"
                          }
                        >
                          {session.status}
                        </Badge>
                      </div>
                    ))}
                    {sessions.length > 10 && (
                      <p className="text-sm text-muted-foreground text-center pt-2">
                        ... and {sessions.length - 10} more sessions
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProgramDetails;
