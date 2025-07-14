import { useState } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Video,
  Calendar,
  Clock,
  Users,
  MoreVertical,
  Play,
  CheckCircle,
  XCircle,
  MessageSquare,
  MapPin,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface SessionParticipant {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "participant" | "observer";
  status: "invited" | "confirmed" | "declined";
}

interface Session {
  id: string;
  title: string;
  description: string;
  date: string;
  duration: number;
  status: "upcoming" | "live" | "completed" | "cancelled";
  type: "video" | "phone" | "in-person";
  location?: string;
  meetingLink?: string;
  coach: {
    id: string;
    name: string;
    avatar?: string;
  };
  participants: SessionParticipant[];
  programTitle: string;
  canManage: boolean;
}

interface SessionManagementProps {
  sessions: Session[];
  onSessionUpdate: (sessionId: string, updates: Partial<Session>) => void;
  userType: "coach" | "company_admin" | "platform_admin";
}

export function SessionManagement({
  sessions,
  onSessionUpdate,
  userType,
}: SessionManagementProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [actionType, setActionType] = useState<
    "start" | "complete" | "cancel" | null
  >(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStartSession = async (session: Session) => {
    setIsProcessing(true);
    try {
      // Update session status to live
      onSessionUpdate(session.id, { status: "live" });

      // Navigate to video conference
      navigate(`/session/${session.id}`);

      toast.success("Session started successfully!");
    } catch (error) {
      toast.error("Failed to start session");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleJoinSession = (session: Session) => {
    // Navigate to video conference
    navigate(`/session/${session.id}`);
  };

  const handleCompleteOffline = async (session: Session) => {
    setIsProcessing(true);
    try {
      // Mark session as completed
      onSessionUpdate(session.id, { status: "completed" });

      toast.success("Session marked as completed offline");
    } catch (error) {
      toast.error("Failed to complete session");
    } finally {
      setIsProcessing(false);
      setSelectedSession(null);
      setActionType(null);
    }
  };

  const handleCancelSession = async (session: Session) => {
    setIsProcessing(true);
    try {
      // Mark session as cancelled
      onSessionUpdate(session.id, { status: "cancelled" });

      toast.success("Session cancelled successfully");
    } catch (error) {
      toast.error("Failed to cancel session");
    } finally {
      setIsProcessing(false);
      setSelectedSession(null);
      setActionType(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-100 text-blue-800";
      case "live":
        return "bg-red-100 text-red-800 animate-pulse";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="w-4 h-4" />;
      case "phone":
        return <MessageSquare className="w-4 h-4" />;
      case "in-person":
        return <MapPin className="w-4 h-4" />;
      default:
        return <Video className="w-4 h-4" />;
    }
  };

  const canStartSession = (session: Session) => {
    return (
      session.canManage &&
      session.status === "upcoming" &&
      (userType === "coach" ||
        userType === "company_admin" ||
        userType === "platform_admin")
    );
  };

  const canJoinSession = (session: Session) => {
    return session.status === "live";
  };

  const canManageSession = (session: Session) => {
    return (
      session.canManage &&
      (userType === "coach" ||
        userType === "company_admin" ||
        userType === "platform_admin")
    );
  };

  const upcomingSessions = sessions.filter((s) => s.status === "upcoming");
  const liveSessions = sessions.filter((s) => s.status === "live");
  const completedSessions = sessions.filter((s) => s.status === "completed");

  return (
    <div className="space-y-6">
      {/* Live Sessions */}
      {liveSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              Live Sessions ({liveSessions.length})
            </CardTitle>
            <CardDescription>Currently active sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {liveSessions.map((session) => (
                <div
                  key={session.id}
                  className="border rounded-lg p-4 bg-red-50 border-red-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={session.coach.avatar} />
                          <AvatarFallback>
                            {session.coach.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-semibold">{session.title}</h4>
                          <p className="text-sm text-gray-600">
                            {session.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>Coach: {session.coach.name}</span>
                            <span>
                              {new Date(session.date).toLocaleDateString()}
                            </span>
                            <span>
                              {new Date(session.date).toLocaleTimeString()}
                            </span>
                            <span>{session.duration} min</span>
                          </div>
                          {session.meetingLink && (
                            <div className="flex items-center gap-2 mt-2">
                              <Video className="w-4 h-4 text-gray-400" />
                              <a
                                href={session.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800 underline truncate max-w-xs"
                              >
                                {session.meetingLink}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(session.status)}>
                        {getTypeIcon(session.type)}
                        <span className="ml-1">LIVE</span>
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => handleJoinSession(session)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <Video className="w-4 h-4 mr-1" />
                        Join
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Sessions */}
      {upcomingSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Upcoming Sessions ({upcomingSessions.length})
            </CardTitle>
            <CardDescription>
              Sessions ready to start or awaiting participants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingSessions.map((session) => (
                <div key={session.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={session.coach.avatar} />
                          <AvatarFallback>
                            {session.coach.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-semibold">{session.title}</h4>
                          <p className="text-sm text-gray-600">
                            {session.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>Coach: {session.coach.name}</span>
                            <span>
                              {new Date(session.date).toLocaleDateString()}
                            </span>
                            <span>
                              {new Date(session.date).toLocaleTimeString()}
                            </span>
                            <span>{session.duration} min</span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-500">
                              {session.participants.length} participants
                            </span>
                          </div>
                          {session.meetingLink && (
                            <div className="flex items-center gap-2 mt-2">
                              <Video className="w-4 h-4 text-gray-400" />
                              <a
                                href={session.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800 underline truncate max-w-xs"
                              >
                                {session.meetingLink}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(session.status)}>
                        {getTypeIcon(session.type)}
                        <span className="ml-1 capitalize">
                          {session.status}
                        </span>
                      </Badge>

                      {canStartSession(session) && (
                        <Button
                          size="sm"
                          onClick={() => handleStartSession(session)}
                          disabled={isProcessing}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Start
                        </Button>
                      )}

                      {canManageSession(session) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedSession(session);
                                setActionType("complete");
                              }}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Mark as Done Offline
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedSession(session);
                                setActionType("cancel");
                              }}
                              className="text-red-600"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Cancel Session
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Sessions */}
      {completedSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Recent Completed Sessions ({completedSessions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {completedSessions.slice(0, 5).map((session) => (
                <div key={session.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={session.coach.avatar} />
                          <AvatarFallback>
                            {session.coach.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-semibold">{session.title}</h4>
                          <p className="text-sm text-gray-600">
                            {session.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>Coach: {session.coach.name}</span>
                            <span>
                              {new Date(session.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Badge className={getStatusColor(session.status)}>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Completed
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {sessions.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Sessions Yet</h3>
            <p className="text-gray-600">
              Sessions will appear here when they are scheduled.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action Confirmation Dialogs */}
      <AlertDialog
        open={!!selectedSession && !!actionType}
        onOpenChange={() => {
          setSelectedSession(null);
          setActionType(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "complete"
                ? "Mark Session as Done Offline"
                : "Cancel Session"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "complete"
                ? `Are you sure you want to mark "${selectedSession?.title}" as completed offline? This will close the session without requiring a video call.`
                : `Are you sure you want to cancel "${selectedSession?.title}"? This action cannot be undone and participants will be notified.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedSession && actionType === "complete") {
                  handleCompleteOffline(selectedSession);
                } else if (selectedSession && actionType === "cancel") {
                  handleCancelSession(selectedSession);
                }
              }}
              disabled={isProcessing}
              className={
                actionType === "cancel" ? "bg-red-600 hover:bg-red-700" : ""
              }
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processing...
                </>
              ) : actionType === "complete" ? (
                "Mark as Done"
              ) : (
                "Cancel Session"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
