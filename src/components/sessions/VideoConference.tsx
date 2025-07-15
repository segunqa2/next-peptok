import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { Separator } from "@/components/ui/separator";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Settings,
  Users,
  MessageSquare,
  Share,
  Clock,
  CheckCircle,
  Bell,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiEnhanced as api } from "@/services/apiEnhanced";
import { toast } from "sonner";
import { MediaPermissionModal } from "@/components/modals/MediaPermissionModal";

interface SessionParticipant {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "coach" | "participant" | "observer" | "admin";
  userType: "coach" | "team_member" | "company_admin";
  isOnline: boolean;
  videoEnabled: boolean;
  audioEnabled: boolean;
  joinedAt?: Date;
}

interface SessionData {
  id: string;
  title: string;
  description: string;
  coach: {
    name: string;
    avatar?: string;
    title: string;
  };
  startTime: string;
  duration: number;
  status: "upcoming" | "live" | "completed" | "cancelled";
  participants: SessionParticipant[];
  meetingId: string;
}

export default function VideoConference() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const sessionId = searchParams.get("sessionId");
  const videoRef = useRef<HTMLVideoElement>(null);

  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [sessionTimer, setSessionTimer] = useState(0);
  const [canManageSession, setCanManageSession] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [hasStreamAccess, setHasStreamAccess] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!sessionId) {
      toast.error("Invalid session link");
      navigate("/");
      return;
    }

    const loadSessionData = async () => {
      try {
        // Try to fetch real session data from API
        const programId = searchParams.get("programId");

        let sessionData: SessionData;

        try {
          // Attempt to get real session data
          const requests = await api.getMentorshipRequests();
          const program = requests.find((r) => r.id === programId);

          if (program) {
            // Use actual coach data if current user is a coach, otherwise use assigned coach
            const coachData =
              user?.userType === "coach"
                ? {
                    name: user.name || user.email.split("@")[0],
                    avatar:
                      user.avatar || `https://avatar.vercel.sh/${user.email}`,
                    title: user.title || "Coach",
                  }
                : {
                    name: "Sarah Johnson", // Placeholder for assigned coach
                    avatar: "https://avatar.vercel.sh/sarah@example.com",
                    title: "Senior Leadership Coach",
                  };

            sessionData = {
              id: sessionId,
              title: `${program.title} Session`,
              description: program.description,
              coach: coachData,
              startTime: new Date().toISOString(),
              duration: 60,
              status: "upcoming",
              participants: [
                {
                  id: user?.userType === "coach" ? user.id : "coach-1",
                  name: coachData.name,
                  email:
                    user?.userType === "coach"
                      ? user.email
                      : "sarah@example.com",
                  role: "coach",
                  userType: "coach",
                  isOnline: user?.userType === "coach",
                  videoEnabled: true,
                  audioEnabled: true,
                },
                // Add all team members from the program
                ...program.teamMembers.map((member) => ({
                  id: member.id,
                  name: member.name || member.email.split("@")[0],
                  email: member.email,
                  role: member.role,
                  userType: "team_member" as const,
                  isOnline: member.id === user?.id, // Only current user is marked as online initially
                  videoEnabled: true,
                  audioEnabled: true,
                  joinedAt: undefined,
                })),
              ],
            };
          } else {
            throw new Error("Program not found");
          }
        } catch (error) {
          console.warn("Using fallback session data:", error);

          // Use actual coach data if current user is a coach
          const fallbackCoachData =
            user?.userType === "coach"
              ? {
                  name: user.name || user.email.split("@")[0],
                  avatar:
                    user.avatar || `https://avatar.vercel.sh/${user.email}`,
                  title: user.title || "Coach",
                }
              : {
                  name: "Sarah Johnson",
                  avatar: "https://avatar.vercel.sh/sarah@example.com",
                  title: "Senior Leadership Coach",
                };

                    // No fallback data - return error if backend unavailable
          throw new Error("Session data not available - backend service unreachable");
            description:
              "Help our team improve their React skills and best practices",
            coach: fallbackCoachData,
            startTime: new Date().toISOString(),
            duration: 60,
            status: "upcoming",
            participants: [
              {
                id: user?.userType === "coach" ? user.id : "coach-1",
                name: fallbackCoachData.name,
                email:
                  user?.userType === "coach" ? user.email : "sarah@example.com",
                role: "coach",
                userType: "coach",
                isOnline: user?.userType === "coach",
                videoEnabled: true,
                audioEnabled: true,
              },
              {
                id: "member_1",
                name: "John Doe",
                email: "john.doe@company.com",
                role: "participant",
                userType: "team_member",
                isOnline: user?.id === "member_1",
                videoEnabled: true,
                audioEnabled: true,
              },
              {
                id: user?.id || "current-user",
                name: user?.name || "Current User",
                email: user?.email || "user@example.com",
                role: user?.role || "participant",
                userType: user?.userType || "team_member",
                isOnline: false,
                videoEnabled: true,
                audioEnabled: true,
              },
            ],
          };
        }

        // Add meeting ID to session data
        sessionData.meetingId = `meeting-${sessionId}`;

        setSession(sessionData);

        // Check if user can manage session (coach or admin)
        const userCanManage =
          user?.userType === "coach" ||
          user?.userType === "company_admin" ||
          user?.userType === "platform_admin";
        setCanManageSession(userCanManage);
      } catch (error) {
        toast.error("Failed to load session data");
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    loadSessionData();
  }, [sessionId, navigate, user]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (hasJoined && session?.status === "live") {
      interval = setInterval(() => {
        setSessionTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [hasJoined, session?.status]);

  // Cleanup media stream when component unmounts
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [localStream]);

  const setupAudioLevelMonitoring = (stream: MediaStream) => {
    try {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();

      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

      const checkAudioLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average);
          animationRef.current = requestAnimationFrame(checkAudioLevel);
        }
      };

      checkAudioLevel();
    } catch (error) {
      console.warn("Audio level monitoring failed:", error);
    }
  };

  const requestCameraAccess = () => {
    setShowPermissionModal(true);
  };

  const handlePermissionsGranted = (stream: MediaStream) => {
    setLocalStream(stream);
    setHasStreamAccess(true);
    setCameraError(false);

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }

    // Set up audio level monitoring
    setupAudioLevelMonitoring(stream);

    setShowPermissionModal(false);
    toast.success("Camera and microphone access granted!");
  };
  const initializeMedia = async (userInitiated = false) => {
    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera/microphone not supported in this browser");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setLocalStream(stream);
      setHasStreamAccess(true);
      setCameraError(false);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Set up audio level monitoring
      setupAudioLevelMonitoring(stream);

      return stream;
    } catch (error: any) {
      console.error("Failed to access media devices:", error);
      setCameraError(true);
      setHasStreamAccess(false);

      // Provide specific error messages based on error type
      let errorMessage = "Failed to access camera/microphone";

      if (error.name === "NotAllowedError") {
        errorMessage =
          "Camera access denied. Please allow camera access in your browser settings.";
      } else if (error.name === "NotFoundError") {
        errorMessage =
          "No camera/microphone found. Please connect a camera and microphone.";
      } else if (error.name === "NotSupportedError") {
        errorMessage =
          "Camera not supported. Please use HTTPS or a supported browser.";
      } else if (error.name === "NotReadableError") {
        errorMessage = "Camera is already in use by another application.";
      }

      // Only show toast if this is user-initiated or during session join
      if (userInitiated || hasJoined) {
        toast.error(errorMessage);
      }

      throw error;
    }
  };

  const joinSession = async () => {
    if (!session || !user) return;

    // Show permission modal if we don't have stream access
    if (!hasStreamAccess) {
      setShowPermissionModal(true);
      return;
    }

    setIsJoining(true);

    try {
      // Media already initialized through permission modal

      // In real app, this would connect to video service (WebRTC, Zoom SDK, etc.)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Update session status and participant
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: "live",
          participants: prev.participants.map((p) =>
            p.id === user.id
              ? { ...p, isOnline: true, joinedAt: new Date() }
              : p,
          ),
        };
      });

      setHasJoined(true);
      toast.success("Successfully joined the session!");
    } catch (error) {
      toast.error("Failed to join session");
    } finally {
      setIsJoining(false);
    }
  };

  const startSession = async () => {
    if (!session || !canManageSession) return;

    // Show permission modal if we don't have stream access
    if (!hasStreamAccess) {
      setShowPermissionModal(true);
      return;
    }

    setIsJoining(true);

    try {
      // Media already initialized through permission modal

      // Start the session
      setSession((prev) => (prev ? { ...prev, status: "live" } : prev));
      setHasJoined(true);

      toast.success("Session started successfully!");
    } catch (error) {
      toast.error("Failed to start session");
    } finally {
      setIsJoining(false);
    }
  };

  const remindParticipants = async () => {
    if (!session) return;

    try {
      const offlineParticipants = session.participants.filter(
        (p) => !p.isOnline && p.userType !== "coach",
      );

      if (offlineParticipants.length === 0) {
        toast.info("All participants are already online!");
        return;
      }

      // In real app, this would send email/SMS reminders
      toast.success(
        `Reminder sent to ${offlineParticipants.length} participant(s)`,
      );

      // Mock API call for sending reminders
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      toast.error("Failed to send reminders");
    }
  };

  const endSession = async () => {
    if (!session || !canManageSession) return;

    try {
      // End the session
      setSession((prev) => (prev ? { ...prev, status: "completed" } : prev));

      // Clean up media
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        setLocalStream(null);
      }

      toast.success("Session ended successfully!");

      // Redirect after a short delay
      setTimeout(() => {
        const dashboardPath =
          user?.userType === "coach"
            ? "/coach/dashboard"
            : user?.userType === "team_member"
              ? "/team-member/dashboard"
              : "/dashboard";
        navigate(dashboardPath);
      }, 2000);
    } catch (error) {
      toast.error("Failed to end session");
    }
  };

  const markOfflineComplete = async () => {
    if (!session || !canManageSession) return;

    try {
      setSession((prev) => (prev ? { ...prev, status: "completed" } : prev));
      toast.success("Session marked as completed offline");

      // Redirect after a short delay
      setTimeout(() => {
        const dashboardPath =
          user?.userType === "coach"
            ? "/coach/dashboard"
            : user?.userType === "team_member"
              ? "/team-member/dashboard"
              : "/dashboard";
        navigate(dashboardPath);
      }, 2000);
    } catch (error) {
      toast.error("Failed to mark session as complete");
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const leaveSession = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    const dashboardPath =
      user?.userType === "coach"
        ? "/coach/dashboard"
        : user?.userType === "team_member"
          ? "/team-member/dashboard"
          : "/dashboard";
    navigate(dashboardPath);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <p>Session not found</p>
          <Button onClick={() => navigate("/")} className="mt-4">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  // Pre-session view
  if (!hasJoined && session.status !== "live") {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">{session.title}</h1>
              <p className="text-gray-300">{session.description}</p>
              <Badge className="mt-2">
                {session.status === "upcoming"
                  ? "Ready to Start"
                  : session.status}
              </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Video Preview */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Camera Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-64 bg-gray-900 rounded-lg object-cover"
                      style={{ display: hasStreamAccess ? "block" : "none" }}
                    />

                    {/* Initial Camera Setup or Error State */}
                    {!hasStreamAccess && (
                      <div className="absolute inset-0 bg-gray-900 rounded-lg flex items-center justify-center">
                        <div className="text-center text-white p-4">
                          <Video className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                          <p className="text-sm mb-1">Camera Preview</p>
                          <p className="text-xs text-gray-400 mb-4">
                            {cameraError
                              ? "Camera access required for this session"
                              : "Click to test your camera and microphone"}
                          </p>
                          <Button
                            onClick={requestCameraAccess}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Video className="w-4 h-4 mr-2" />
                            Test Camera
                          </Button>

                          {cameraError && (
                            <div className="mt-4 text-xs text-gray-400">
                              <p>If camera access is blocked:</p>
                              <p>
                                1. Click the camera icon in your browser's
                                address bar
                              </p>
                              <p>2. Select "Allow" for camera and microphone</p>
                              <p>3. Refresh this page</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Audio Level Meter */}
                    {hasStreamAccess && audioEnabled && (
                      <div className="absolute top-4 right-4 bg-black bg-opacity-50 rounded-lg p-2">
                        <div className="flex items-center gap-2">
                          <Mic className="w-3 h-3 text-white" />
                          <div className="w-12 h-2 bg-gray-600 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 transition-all duration-100"
                              style={{
                                width: `${Math.min(audioLevel * 2, 100)}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Camera Controls */}
                    {hasStreamAccess && (
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                        <Button
                          variant={videoEnabled ? "default" : "destructive"}
                          size="sm"
                          onClick={toggleVideo}
                        >
                          {videoEnabled ? (
                            <Video className="w-4 h-4" />
                          ) : (
                            <VideoOff className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant={audioEnabled ? "default" : "destructive"}
                          size="sm"
                          onClick={toggleAudio}
                          className="relative"
                        >
                          {audioEnabled ? (
                            <Mic className="w-4 h-4" />
                          ) : (
                            <MicOff className="w-4 h-4" />
                          )}
                          {audioEnabled && audioLevel > 10 && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Session Info */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Session Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={session.coach.avatar} />
                      <AvatarFallback>
                        {session.coach.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-white">
                        {session.coach.name}
                      </p>
                      <p className="text-sm text-gray-300">
                        {session.coach.title}
                      </p>
                    </div>
                  </div>

                  <Separator className="bg-gray-700" />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Duration:</span>
                      <span className="text-white">
                        {session.duration} minutes
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Meeting ID:</span>
                      <span className="text-white font-mono">
                        {session.meetingId}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Participants:</span>
                      <span className="text-white">
                        {session.participants.length}
                      </span>
                    </div>
                  </div>

                  <Separator className="bg-gray-700" />

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {canManageSession ? (
                      <>
                        <Button
                          onClick={startSession}
                          disabled={isJoining}
                          className="w-full bg-green-600 hover:bg-green-700"
                          size="lg"
                        >
                          {isJoining ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                              Starting Session...
                            </>
                          ) : (
                            <>
                              <Video className="w-4 h-4 mr-2" />
                              Start Session
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={markOfflineComplete}
                          variant="outline"
                          className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark as Done Offline
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={joinSession}
                        disabled={isJoining || session.status !== "live"}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        size="lg"
                      >
                        {isJoining ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Joining Session...
                          </>
                        ) : session.status === "live" ? (
                          <>
                            <Video className="w-4 h-4 mr-2" />
                            Join Session
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4 mr-2" />
                            Waiting for Host
                          </>
                        )}
                      </Button>
                    )}

                    <Button
                      onClick={() => navigate(-1)}
                      variant="outline"
                      className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      Back to Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // In-session view
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Session Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">{session.title}</h1>
            <Badge className="bg-red-600">
              LIVE • {formatTime(sessionTimer)}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>{session.participants.filter((p) => p.isOnline).length}</span>
          </div>
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
          {/* Main Video */}
          <div className="lg:col-span-3">
            <div className="relative h-96 lg:h-full bg-gray-900 rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                <Button
                  variant={videoEnabled ? "default" : "destructive"}
                  size="sm"
                  onClick={toggleVideo}
                >
                  {videoEnabled ? (
                    <Video className="w-4 h-4" />
                  ) : (
                    <VideoOff className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant={audioEnabled ? "default" : "destructive"}
                  size="sm"
                  onClick={toggleAudio}
                  className="relative"
                >
                  {audioEnabled ? (
                    <Mic className="w-4 h-4" />
                  ) : (
                    <MicOff className="w-4 h-4" />
                  )}
                  {audioEnabled && audioLevel > 10 && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  )}
                </Button>
                <Button variant="outline" size="sm">
                  <MessageSquare className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Share className="w-4 h-4" />
                </Button>
                {canManageSession && (
                  <Button onClick={endSession} variant="destructive" size="sm">
                    <PhoneOff className="w-4 h-4" />
                  </Button>
                )}
                <Button onClick={leaveSession} variant="outline" size="sm">
                  Leave
                </Button>
              </div>
            </div>
          </div>

          {/* Participants Panel */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-800 border-gray-700 h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Participants (
                    {session.participants.filter((p) => p.isOnline).length}/
                    {session.participants.length})
                  </CardTitle>
                  {canManageSession && (
                    <Button
                      onClick={remindParticipants}
                      size="sm"
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      Remind All
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {session.participants.map((participant) => (
                  <div
                    key={participant.id}
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      participant.isOnline
                        ? "bg-green-900/30 border border-green-700"
                        : "bg-gray-700/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={participant.avatar} />
                        <AvatarFallback className="text-xs">
                          {participant.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {participant.name}
                          {participant.id === user?.id && " (You)"}
                        </p>
                        <div className="flex items-center gap-1">
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              participant.role === "coach"
                                ? "border-blue-500 text-blue-300"
                                : "border-gray-500 text-gray-300"
                            }`}
                          >
                            {participant.role}
                          </Badge>
                          {participant.isOnline && (
                            <Badge className="text-xs bg-green-600">
                              Online
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {participant.isOnline && (
                        <>
                          {participant.videoEnabled ? (
                            <Video className="w-3 h-3 text-green-400" />
                          ) : (
                            <VideoOff className="w-3 h-3 text-red-400" />
                          )}
                          {participant.audioEnabled ? (
                            <Mic className="w-3 h-3 text-green-400" />
                          ) : (
                            <MicOff className="w-3 h-3 text-red-400" />
                          )}
                        </>
                      )}
                      {!participant.isOnline && canManageSession && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
                          onClick={() => {
                            toast.success(
                              `Reminder sent to ${participant.name}`,
                            );
                          }}
                        >
                          Remind
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {session.participants.filter((p) => !p.isOnline).length > 0 && (
                  <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg">
                    <p className="text-xs text-yellow-300">
                      {session.participants.filter((p) => !p.isOnline).length}{" "}
                      participant(s) haven't joined yet
                    </p>
                    {canManageSession && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-2 h-7 text-xs border-yellow-600 text-yellow-300 hover:bg-yellow-700/20"
                        onClick={remindParticipants}
                      >
                        Send Reminder to All Offline
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
              <CardHeader>
                <CardTitle className="text-white text-sm">
                  Participants ({session.participants.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {session.participants.map((participant) => (
                  <div key={participant.id} className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={participant.avatar} />
                        <AvatarFallback className="text-xs">
                          {participant.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      {participant.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {participant.name}
                        {participant.role === "coach" && " (Coach)"}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {participant.role}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {!participant.videoEnabled && (
                        <VideoOff className="w-3 h-3 text-red-400" />
                      )}
                      {!participant.audioEnabled && (
                        <MicOff className="w-3 h-3 text-red-400" />
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Media Permission Modal */}
      <MediaPermissionModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        onPermissionsGranted={handlePermissionsGranted}
        title="Join Video Session"
        description="To participate in this video session, we need access to your camera and microphone."
      />
    </div>
  );
}