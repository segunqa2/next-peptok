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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Target,
  Calendar,
  DollarSign,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Eye,
  Filter,
  Search,
  Bell,
  Star,
  TrendingUp,
} from "lucide-react";
import { Program } from "@/types/program";
import { programService } from "@/services/programService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ProgramDetails from "./ProgramDetails";

interface CoachProgramManagementProps {
  coachId?: string;
}

export const CoachProgramManagement: React.FC<CoachProgramManagementProps> = ({
  coachId,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [pendingPrograms, setPendingPrograms] = useState<Program[]>([]);
  const [activePrograms, setActivePrograms] = useState<Program[]>([]);
  const [completedPrograms, setCompletedPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [responseType, setResponseType] = useState<"accepted" | "rejected">(
    "accepted",
  );

  const targetCoachId = coachId || (user?.userType === "coach" ? user.id : "");

  useEffect(() => {
    if (targetCoachId) {
      loadPrograms();
    }
  }, [targetCoachId]);

  const loadPrograms = async () => {
    try {
      setIsLoading(true);

      const filters = {
        coachId: targetCoachId,
      };

      const allPrograms = await programService.getPrograms(filters);
      setPrograms(allPrograms);

      // Categorize programs
      setPendingPrograms(
        allPrograms.filter((p) => p.status === "pending_coach_acceptance"),
      );
      setActivePrograms(allPrograms.filter((p) => p.status === "in_progress"));
      setCompletedPrograms(
        allPrograms.filter(
          (p) => p.status === "completed" || p.status === "cancelled",
        ),
      );
    } catch (error) {
      console.error("Failed to load programs:", error);
      toast.error("Failed to load programs");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProgramResponse = async (
    program: Program,
    response: "accepted" | "rejected",
  ) => {
    setSelectedProgram(program);
    setResponseType(response);
    setShowResponseDialog(true);
  };

  const submitProgramResponse = async () => {
    if (!selectedProgram) return;

    setIsSubmittingResponse(true);
    try {
      await programService.respondToProgram(
        selectedProgram.id,
        responseType,
        responseMessage || undefined,
      );

      await loadPrograms();
      setShowResponseDialog(false);
      setResponseMessage("");
      setSelectedProgram(null);

      toast.success(
        `Program ${responseType === "accepted" ? "accepted" : "rejected"} successfully`,
      );
    } catch (error) {
      toast.error("Failed to respond to program");
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getProgramPriority = (program: Program) => {
    const highPriorityGoals = program.goals.filter(
      (g) => g.priority === "high",
    ).length;
    const startSoon =
      new Date(program.timeline.startDate).getTime() - Date.now() <
      7 * 24 * 60 * 60 * 1000; // Within 7 days

    if (highPriorityGoals > 0 || startSoon) return "high";
    if (program.budget.max > 5000) return "medium";
    return "low";
  };

  const ProgramCard: React.FC<{
    program: Program;
    showActions?: boolean;
  }> = ({ program, showActions = false }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{program.title}</CardTitle>
            <CardDescription className="mt-1">
              {program.companyName}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <Badge
              variant={
                getProgramPriority(program) === "high"
                  ? "destructive"
                  : getProgramPriority(program) === "medium"
                    ? "default"
                    : "secondary"
              }
            >
              {getProgramPriority(program)} priority
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {program.description}
        </p>

        {/* Skills */}
        <div className="flex flex-wrap gap-1">
          {program.skills.slice(0, 3).map((skill) => (
            <Badge key={skill} variant="outline" className="text-xs">
              {skill}
            </Badge>
          ))}
          {program.skills.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{program.skills.length - 3} more
            </Badge>
          )}
        </div>

        {/* Program Details */}
        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {program.participants.length} participants
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(program.timeline.startDate)}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {program.timeline.totalSessions} sessions
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            {program.budget.currency} {program.budget.max}
          </div>
        </div>

        {/* Goals Preview */}
        {program.goals.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-1">
              <Target className="w-3 h-3" />
              Key Goals ({program.goals.length})
            </h4>
            <div className="space-y-1">
              {program.goals.slice(0, 2).map((goal) => (
                <div key={goal.id} className="text-xs text-muted-foreground">
                  • {goal.title}
                </div>
              ))}
              {program.goals.length > 2 && (
                <div className="text-xs text-muted-foreground">
                  • +{program.goals.length - 2} more goals
                </div>
              )}
            </div>
          </div>
        )}

        {/* Timeline Summary */}
        <div className="bg-muted rounded p-3">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">Duration</p>
              <p className="font-medium">
                {Math.ceil(
                  (new Date(program.timeline.endDate).getTime() -
                    new Date(program.timeline.startDate).getTime()) /
                    (1000 * 60 * 60 * 24 * 7),
                )}{" "}
                weeks
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Frequency</p>
              <p className="font-medium capitalize">
                {program.timeline.sessionFrequency}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Session Length</p>
              <p className="font-medium">{program.timeline.hoursPerSession}h</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/programs/${program.id}`)}
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>

          {showActions && program.status === "pending_coach_acceptance" && (
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleProgramResponse(program, "accepted")}
              >
                <ThumbsUp className="w-4 h-4 mr-2" />
                Accept
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => handleProgramResponse(program, "rejected")}
              >
                <ThumbsDown className="w-4 h-4 mr-2" />
                Decline
              </Button>
            </div>
          )}
        </div>

        {/* Coach Response Status */}
        {program.coachResponse && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2">
              {program.coachResponse.status === "accepted" ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <span className="text-sm">
                {program.coachResponse.status === "accepted"
                  ? "You accepted this program"
                  : "You declined this program"}
              </span>
            </div>
            {program.coachResponse.message && (
              <p className="text-xs text-muted-foreground mt-1">
                Your response: "{program.coachResponse.message}"
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Bell className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingPrograms.length}</p>
                <p className="text-sm text-muted-foreground">
                  Pending Response
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activePrograms.length}</p>
                <p className="text-sm text-muted-foreground">Active Programs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedPrograms.length}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Star className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{programs.length}</p>
                <p className="text-sm text-muted-foreground">Total Programs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Urgent Actions */}
      {pendingPrograms.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="w-5 h-5" />
              Programs Requiring Your Response ({pendingPrograms.length})
            </CardTitle>
            <CardDescription className="text-yellow-700">
              These programs are waiting for your acceptance or rejection.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {pendingPrograms.map((program) => (
                <ProgramCard
                  key={program.id}
                  program={program}
                  showActions={true}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Program Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">
            All Programs ({programs.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({pendingPrograms.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Active ({activePrograms.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedPrograms.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {programs.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {programs.map((program) => (
                <ProgramCard key={program.id} program={program} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Programs Yet</h3>
                <p className="text-muted-foreground">
                  You haven't been assigned to any programs yet. Programs will
                  appear here when companies invite you to coach their teams.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingPrograms.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {pendingPrograms.map((program) => (
                <ProgramCard
                  key={program.id}
                  program={program}
                  showActions={true}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  No Pending Programs
                </h3>
                <p className="text-muted-foreground">
                  All programs have been responded to.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {activePrograms.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {activePrograms.map((program) => (
                <ProgramCard key={program.id} program={program} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Active Programs</h3>
                <p className="text-muted-foreground">
                  No programs are currently in progress.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedPrograms.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {completedPrograms.map((program) => (
                <ProgramCard key={program.id} program={program} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  No Completed Programs
                </h3>
                <p className="text-muted-foreground">
                  Completed programs will appear here.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Response Dialog */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {responseType === "accepted" ? "Accept" : "Decline"} Program
            </DialogTitle>
            <DialogDescription>
              {responseType === "accepted"
                ? "You're about to accept this coaching program. You can add an optional message for the company."
                : "You're about to decline this coaching program. Please provide a reason for declining."}
            </DialogDescription>
          </DialogHeader>

          {selectedProgram && (
            <div className="space-y-4">
              <div className="bg-muted rounded p-3">
                <h4 className="font-medium">{selectedProgram.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedProgram.companyName}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="response-message">
                  {responseType === "accepted" ? "Message" : "Reason"}{" "}
                  {responseType === "rejected" && (
                    <span className="text-red-500">*</span>
                  )}
                </Label>
                <Textarea
                  id="response-message"
                  placeholder={
                    responseType === "accepted"
                      ? "Optional message to the company..."
                      : "Please explain why you're declining this program..."
                  }
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  required={responseType === "rejected"}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowResponseDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitProgramResponse}
                  disabled={
                    isSubmittingResponse ||
                    (responseType === "rejected" && !responseMessage.trim())
                  }
                  className={cn(
                    responseType === "accepted"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700",
                  )}
                >
                  {isSubmittingResponse
                    ? "Submitting..."
                    : responseType === "accepted"
                      ? "Accept Program"
                      : "Decline Program"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CoachProgramManagement;
