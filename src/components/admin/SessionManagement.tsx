import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Plus,
  Calendar as CalendarIcon,
  Clock,
  DollarSign,
  Users,
  Eye,
  Edit,
  Trash2,
  Calculator,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Coach {
  id: string;
  name: string;
  expertise: string[];
  hourlyRate: number;
  rating: number;
  isAvailable: boolean;
}

interface Session {
  id: string;
  title: string;
  description: string;
  coachId: string;
  coachName: string;
  scheduledAt: Date;
  durationMinutes: number;
  participantCount: number;
  additionalParticipants: number;
  status: "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled";
  costs: {
    coachRate: number;
    coachAmount: number;
    serviceCharge: number;
    commission: number;
    additionalParticipantFee: number;
    totalAmount: number;
    platformEarnings: number;
  };
}

interface SessionManagementProps {
  matches?: any[];
}

// Mock coaches data
const mockCoaches: Coach[] = [
  {
    id: "coach1",
    name: "Sarah Johnson",
    expertise: ["React", "TypeScript", "Team Leadership"],
    hourlyRate: 150,
    rating: 4.9,
    isAvailable: true,
  },
  {
    id: "coach2",
    name: "Michael Chen",
    expertise: ["Node.js", "System Architecture", "DevOps"],
    hourlyRate: 180,
    rating: 4.8,
    isAvailable: true,
  },
  {
    id: "coach3",
    name: "Emily Rodriguez",
    expertise: ["Product Management", "Strategy", "Agile"],
    hourlyRate: 200,
    rating: 4.9,
    isAvailable: false,
  },
];

// Admin pricing configuration
const ADMIN_PRICING = {
  serviceChargePercentage: 15, // 15% service charge
  commissionPercentage: 10, // 10% commission from coach fee
  minCommissionAmount: 5, // Minimum $5 commission per session
  additionalParticipantFee: 25, // $25 per additional participant
  maxParticipantsIncluded: 1, // First participant included
};

export function SessionManagement({ matches = [] }: SessionManagementProps) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<string>("");
  const [sessionDate, setSessionDate] = useState<Date>();
  const [sessionTime, setSessionTime] = useState<string>("");
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [participantCount, setParticipantCount] = useState<number>(1);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Calculate session costs
  const calculateSessionCosts = (
    coachId: string,
    duration: number,
    participants: number,
  ) => {
    const coach = mockCoaches.find((c) => c.id === coachId);
    if (!coach) return null;

    const coachAmount = (coach.hourlyRate * duration) / 60;
    const serviceCharge =
      (coachAmount * ADMIN_PRICING.serviceChargePercentage) / 100;
    const percentageCommission =
      (coachAmount * ADMIN_PRICING.commissionPercentage) / 100;
    const commission = Math.max(
      percentageCommission,
      ADMIN_PRICING.minCommissionAmount,
    );
    const additionalParticipants = Math.max(
      0,
      participants - ADMIN_PRICING.maxParticipantsIncluded,
    );
    const additionalParticipantFee =
      additionalParticipants * ADMIN_PRICING.additionalParticipantFee;
    const totalAmount = coachAmount + serviceCharge + additionalParticipantFee;
    const platformEarnings = serviceCharge + commission;

    return {
      coachRate: coach.hourlyRate,
      coachAmount,
      serviceCharge,
      commission,
      additionalParticipantFee,
      totalAmount,
      platformEarnings,
    };
  };

  // Load existing sessions
  useEffect(() => {
    const loadSessions = () => {
      // Mock sessions data
      const mockSessions: Session[] = [
        {
          id: "session1",
          title: "React Best Practices Workshop",
          description: "Advanced React patterns and performance optimization",
          coachId: "coach1",
          coachName: "Sarah Johnson",
          scheduledAt: new Date(Date.now() + 86400000), // Tomorrow
          durationMinutes: 90,
          participantCount: 3,
          additionalParticipants: 2,
          status: "scheduled",
          costs: calculateSessionCosts("coach1", 90, 3)!,
        },
        {
          id: "session2",
          title: "System Architecture Review",
          description: "Review and improve current system architecture",
          coachId: "coach2",
          coachName: "Michael Chen",
          scheduledAt: new Date(Date.now() + 172800000), // Day after tomorrow
          durationMinutes: 120,
          participantCount: 2,
          additionalParticipants: 1,
          status: "confirmed",
          costs: calculateSessionCosts("coach2", 120, 2)!,
        },
      ];
      setSessions(mockSessions);
    };

    loadSessions();
  }, []);

  const handleCreateSession = async () => {
    if (!selectedCoach || !sessionDate || !sessionTime || !title) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const costs = calculateSessionCosts(
        selectedCoach,
        durationMinutes,
        participantCount,
      );
      if (!costs) {
        toast.error("Unable to calculate session costs");
        return;
      }

      const coach = mockCoaches.find((c) => c.id === selectedCoach);
      const scheduledAt = new Date(sessionDate);
      const [hours, minutes] = sessionTime.split(":");
      scheduledAt.setHours(parseInt(hours), parseInt(minutes));

      const newSession: Session = {
        id: `session_${Date.now()}`,
        title,
        description,
        coachId: selectedCoach,
        coachName: coach!.name,
        scheduledAt,
        durationMinutes,
        participantCount,
        additionalParticipants: Math.max(0, participantCount - 1),
        status: "scheduled",
        costs,
      };

      setSessions((prev) => [...prev, newSession]);

      // Reset form
      setTitle("");
      setDescription("");
      setSelectedCoach("");
      setSessionDate(undefined);
      setSessionTime("");
      setDurationMinutes(60);
      setParticipantCount(1);
      setIsCreateDialogOpen(false);

      toast.success("Session created successfully!");
    } catch (error) {
      toast.error("Failed to create session");
    } finally {
      setIsLoading(false);
    }
  };

  const currentCosts =
    selectedCoach &&
    calculateSessionCosts(selectedCoach, durationMinutes, participantCount);

  // Only allow platform admin and company admin users to access this
  if (
    !user ||
    (user.userType !== "platform_admin" && user.userType !== "company_admin")
  ) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-muted-foreground">
              Access denied. Platform Admin or Company Admin privileges
              required.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Session Management</h2>
          <p className="text-muted-foreground">
            Create and manage coaching sessions with cost breakdown
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Session
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Session</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Details */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Session Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., React Best Practices Workshop"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the session objectives"
                    rows={3}
                  />
                </div>
              </div>

              {/* Coach Selection */}
              <div>
                <Label>Select Coach *</Label>
                <Select value={selectedCoach} onValueChange={setSelectedCoach}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a coach" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockCoaches.map((coach) => (
                      <SelectItem
                        key={coach.id}
                        value={coach.id}
                        disabled={!coach.isAvailable}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <span className="font-medium">{coach.name}</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              ${coach.hourlyRate}/hr
                            </span>
                          </div>
                          {!coach.isAvailable && (
                            <Badge variant="secondary">Unavailable</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !sessionDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {sessionDate
                          ? format(sessionDate, "PPP")
                          : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={sessionDate}
                        onSelect={setSessionDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="time">Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={sessionTime}
                    onChange={(e) => setSessionTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Duration and Participants */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Select
                    value={durationMinutes.toString()}
                    onValueChange={(value) =>
                      setDurationMinutes(parseInt(value))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                      <SelectItem value="90">90 minutes</SelectItem>
                      <SelectItem value="120">120 minutes</SelectItem>
                      <SelectItem value="180">180 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="participants">Number of Participants</Label>
                  <Input
                    id="participants"
                    type="number"
                    min="1"
                    max="10"
                    value={participantCount}
                    onChange={(e) =>
                      setParticipantCount(parseInt(e.target.value) || 1)
                    }
                  />
                </div>
              </div>

              {/* Cost Preview */}
              {currentCosts && (
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Calculator className="w-5 h-5 mr-2" />
                      Cost Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span>Coach Fee:</span>
                        <span>${currentCosts.coachAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>
                          Service Charge (
                          {ADMIN_PRICING.serviceChargePercentage}%):
                        </span>
                        <span>${currentCosts.serviceCharge.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>
                          Commission (min ${ADMIN_PRICING.minCommissionAmount}):
                        </span>
                        <span>${currentCosts.commission.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Additional Participants:</span>
                        <span>
                          ${currentCosts.additionalParticipantFee.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between font-semibold">
                        <span>Total Amount:</span>
                        <span>${currentCosts.totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-green-600 font-medium">
                        <span>Platform Earnings:</span>
                        <span>${currentCosts.platformEarnings.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateSession} disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Session"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {sessions.map((session) => (
          <Card key={session.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-semibold text-lg">{session.title}</h3>
                    <Badge
                      variant={
                        session.status === "completed"
                          ? "default"
                          : session.status === "confirmed"
                            ? "secondary"
                            : session.status === "cancelled"
                              ? "destructive"
                              : "outline"
                      }
                    >
                      {session.status.replace("_", " ")}
                    </Badge>
                  </div>

                  <p className="text-muted-foreground">{session.description}</p>

                  <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-1" />
                      {format(session.scheduledAt, "PPP")}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {session.durationMinutes} minutes
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {session.participantCount} participants
                    </div>
                  </div>

                  <div className="text-sm">
                    <span className="font-medium">Coach:</span>{" "}
                    {session.coachName}
                  </div>
                </div>

                <div className="text-right space-y-2">
                  <div className="text-lg font-bold">
                    ${session.costs.totalAmount.toFixed(2)}
                  </div>
                  <div className="text-sm text-green-600 font-medium">
                    Platform: ${session.costs.platformEarnings.toFixed(2)}
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="w-4 h-4" />
                    </Button>
                    {session.status === "scheduled" && (
                      <Button size="sm" variant="outline">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {sessions.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No sessions yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first coaching session to get started
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Session
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
