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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  Clock,
  Users,
  Target,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Filter,
  Search,
  Plus,
  CheckCircle,
  AlertCircle,
  XCircle,
  PlayCircle,
  PauseCircle,
  DollarSign,
  User,
} from "lucide-react";
import { Program } from "@/types/program";
import { programService } from "@/services/programService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProgramListProps {
  userType?: "company_admin" | "coach" | "platform_admin";
  companyId?: string;
  coachId?: string;
  showCreateButton?: boolean;
  onProgramClick?: (program: Program) => void;
  onCreateProgram?: () => void;
  maxItems?: number;
}

const getStatusIcon = (status: Program["status"]) => {
  switch (status) {
    case "draft":
      return <Edit className="w-4 h-4" />;
    case "pending_coach_acceptance":
      return <AlertCircle className="w-4 h-4" />;
    case "in_progress":
      return <PlayCircle className="w-4 h-4" />;
    case "completed":
      return <CheckCircle className="w-4 h-4" />;
    case "cancelled":
      return <XCircle className="w-4 h-4" />;
    default:
      return <AlertCircle className="w-4 h-4" />;
  }
};

const getStatusColor = (status: Program["status"]) => {
  switch (status) {
    case "draft":
      return "secondary";
    case "pending_coach_acceptance":
      return "default";
    case "in_progress":
      return "default";
    case "completed":
      return "default";
    case "cancelled":
      return "destructive";
    default:
      return "secondary";
  }
};

const getStatusLabel = (status: Program["status"]) => {
  switch (status) {
    case "draft":
      return "Draft";
    case "pending_coach_acceptance":
      return "Pending Coach";
    case "in_progress":
      return "In Progress";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
};

export const ProgramList: React.FC<ProgramListProps> = ({
  userType,
  companyId,
  coachId,
  showCreateButton = true,
  onProgramClick,
  onCreateProgram,
  maxItems,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_desc");

  useEffect(() => {
    loadPrograms();
  }, [companyId, coachId, userType]);

  useEffect(() => {
    filterAndSortPrograms();
  }, [programs, searchTerm, statusFilter, sortBy]);

  const loadPrograms = async () => {
    try {
      setIsLoading(true);

      // Determine filters based on user type and props
      const filters: any = {};

      if (companyId) {
        filters.companyId = companyId;
      } else if (user?.userType === "company_admin" && user.companyId) {
        filters.companyId = user.companyId;
      }

      if (coachId) {
        filters.coachId = coachId;
      } else if (user?.userType === "coach") {
        filters.coachId = user.id;
      }

      if (maxItems) {
        filters.limit = maxItems;
      }

      const loadedPrograms = await programService.getPrograms(filters);
      setPrograms(loadedPrograms);
    } catch (error) {
      console.error("Failed to load programs:", error);
      toast.error("Failed to load programs");
      setPrograms([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortPrograms = () => {
    let filtered = [...programs];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (program) =>
          program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          program.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          program.skills.some((skill) =>
            skill.toLowerCase().includes(searchTerm.toLowerCase()),
          ),
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((program) => program.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "created_desc":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "created_asc":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "title_asc":
          return a.title.localeCompare(b.title);
        case "title_desc":
          return b.title.localeCompare(a.title);
        case "progress_desc":
          return b.progress.progressPercentage - a.progress.progressPercentage;
        case "progress_asc":
          return a.progress.progressPercentage - b.progress.progressPercentage;
        default:
          return 0;
      }
    });

    setFilteredPrograms(filtered);
  };

  const handleProgramAction = async (action: string, program: Program) => {
    switch (action) {
      case "view":
        if (onProgramClick) {
          onProgramClick(program);
        } else {
          navigate(`/programs/${program.id}`);
        }
        break;
      case "edit":
        navigate(`/programs/${program.id}/edit`);
        break;
      case "delete":
        if (window.confirm("Are you sure you want to delete this program?")) {
          try {
            await programService.deleteProgram(program.id);
            await loadPrograms();
            toast.success("Program deleted successfully");
          } catch (error) {
            toast.error("Failed to delete program");
          }
        }
        break;
      default:
        break;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const canEditProgram = (program: Program) => {
    return (
      user?.userType === "company_admin" &&
      program.companyId === user.companyId &&
      (program.status === "draft" ||
        program.status === "pending_coach_acceptance")
    );
  };

  const canDeleteProgram = (program: Program) => {
    return (
      user?.userType === "company_admin" &&
      program.companyId === user.companyId &&
      program.status !== "in_progress"
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (programs.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Programs Yet</h3>
          <p className="text-muted-foreground mb-4">
            {userType === "coach"
              ? "You haven't been assigned to any programs yet."
              : "Create your first coaching program to get started."}
          </p>
          {showCreateButton && userType !== "coach" && (
            <Button
              onClick={onCreateProgram || (() => navigate("/programs/create"))}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Program
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search programs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending_coach_acceptance">
                Pending Coach
              </SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_desc">Newest First</SelectItem>
              <SelectItem value="created_asc">Oldest First</SelectItem>
              <SelectItem value="title_asc">Title A-Z</SelectItem>
              <SelectItem value="title_desc">Title Z-A</SelectItem>
              <SelectItem value="progress_desc">Most Progress</SelectItem>
              <SelectItem value="progress_asc">Least Progress</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {showCreateButton && userType !== "coach" && (
          <Button
            onClick={onCreateProgram || (() => navigate("/programs/create"))}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Program
          </Button>
        )}
      </div>

      {/* Program Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredPrograms.map((program) => (
          <Card
            key={program.id}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleProgramAction("view", program)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">
                    {program.title}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {program.companyName}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <Badge
                    variant={getStatusColor(program.status) as any}
                    className="flex items-center gap-1"
                  >
                    {getStatusIcon(program.status)}
                    {getStatusLabel(program.status)}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProgramAction("view", program);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      {canEditProgram(program) && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProgramAction("edit", program);
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Program
                        </DropdownMenuItem>
                      )}
                      {canDeleteProgram(program) && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProgramAction("delete", program);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Program
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Program Description */}
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

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">
                    {program.progress.progressPercentage}%
                  </span>
                </div>
                <Progress value={program.progress.progressPercentage} />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {program.progress.completedSessions} /{" "}
                    {program.progress.totalSessions} sessions
                  </span>
                  {program.progress.nextSessionDate && (
                    <span>
                      Next: {formatDate(program.progress.nextSessionDate)}
                    </span>
                  )}
                </div>
              </div>

              {/* Meta Information */}
              <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground pt-2 border-t">
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
                  {program.timeline.hoursPerSession}h sessions
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  {program.budget.currency} {program.budget.max}
                </div>
              </div>

              {/* Coach Information */}
              {program.assignedCoachName && (
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs">
                      {program.assignedCoachName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">
                    Coach: {program.assignedCoachName}
                  </span>
                </div>
              )}

              {/* Coach Response Status */}
              {program.coachResponse && (
                <div className="flex items-center gap-2 pt-2 border-t">
                  {program.coachResponse.status === "accepted" && (
                    <Badge variant="default" className="text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Coach Accepted
                    </Badge>
                  )}
                  {program.coachResponse.status === "rejected" && (
                    <Badge variant="destructive" className="text-xs">
                      <XCircle className="w-3 h-3 mr-1" />
                      Coach Rejected
                    </Badge>
                  )}
                  {program.coachResponse.status === "pending" && (
                    <Badge variant="outline" className="text-xs">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Awaiting Response
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredPrograms.length === 0 && programs.length > 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Filter className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Programs Found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or filters.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProgramList;
