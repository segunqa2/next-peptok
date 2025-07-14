import React, { useEffect, useRef, useState } from "react";
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IRemoteVideoTrack,
  IRemoteAudioTrack,
} from "agora-rtc-sdk-ng";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  Monitor,
  MessageSquare,
  Settings,
  Users,
  MoreVertical,
  Record,
  StopCircle,
} from "lucide-react";
import { Session, SessionParticipant } from "../../types/session";
import { toast } from "react-hot-toast";

interface VideoCallRoomProps {
  session: Session;
  userId: string;
  agoraToken: string;
  onLeave: () => void;
  onToggleRecording?: (isRecording: boolean) => void;
  onAddNote?: (note: string) => void;
}

interface RemoteUser {
  uid: string;
  videoTrack?: IRemoteVideoTrack;
  audioTrack?: IRemoteAudioTrack;
  participant?: SessionParticipant;
}

export const VideoCallRoom: React.FC<VideoCallRoomProps> = ({
  session,
  userId,
  agoraToken,
  onLeave,
  onToggleRecording,
  onAddNote,
}) => {
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [localVideoTrack, setLocalVideoTrack] =
    useState<ICameraVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] =
    useState<IMicrophoneAudioTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<Map<string, RemoteUser>>(
    new Map(),
  );
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<
    Array<{
      id: string;
      userId: string;
      userName: string;
      message: string;
      timestamp: Date;
    }>
  >([]);
  const [connectionStats, setConnectionStats] = useState({
    rtt: 0,
    uplinkNetworkQuality: 0,
    downlinkNetworkQuality: 0,
  });

  const localVideoRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeAgora();
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const initializeAgora = async () => {
    try {
      // Create Agora client
      const agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      setClient(agoraClient);

      // Set up event listeners
      agoraClient.on("user-published", handleUserPublished);
      agoraClient.on("user-unpublished", handleUserUnpublished);
      agoraClient.on("user-joined", handleUserJoined);
      agoraClient.on("user-left", handleUserLeft);
      agoraClient.on("network-quality", handleNetworkQuality);

      // Join the channel
      await agoraClient.join(
        import.meta.env.VITE_AGORA_APP_ID || "demo_app_id",
        session.agoraChannelName!,
        agoraToken,
        userId,
      );

      // Create and publish local tracks
      await createLocalTracks();
      setIsConnected(true);

      toast.success("Connected to session");
    } catch (error) {
      console.error("Failed to initialize Agora:", error);
      toast.error("Failed to connect to session");
    }
  };

  const createLocalTracks = async () => {
    try {
      const [videoTrack, audioTrack] = await Promise.all([
        AgoraRTC.createCameraVideoTrack({
          optimizationMode: "motion",
          encoderConfig: {
            width: 640,
            height: 480,
            frameRate: 30,
            bitrateMin: 400,
            bitrateMax: 1000,
          },
        }),
        AgoraRTC.createMicrophoneAudioTrack({
          echoCancellation: true,
          noiseSuppression: true,
        }),
      ]);

      setLocalVideoTrack(videoTrack);
      setLocalAudioTrack(audioTrack);

      // Play local video
      if (localVideoRef.current) {
        videoTrack.play(localVideoRef.current);
      }

      // Publish tracks
      if (client) {
        await client.publish([videoTrack, audioTrack]);
      }
    } catch (error) {
      console.error("Failed to create local tracks:", error);
      toast.error("Failed to access camera/microphone");
    }
  };

  const handleUserPublished = async (
    user: any,
    mediaType: "video" | "audio",
  ) => {
    await client?.subscribe(user, mediaType);

    setRemoteUsers((prev) => {
      const updated = new Map(prev);
      const existingUser = updated.get(user.uid) || { uid: user.uid };

      if (mediaType === "video") {
        existingUser.videoTrack = user.videoTrack;
        user.videoTrack?.play(`remote-video-${user.uid}`);
      } else if (mediaType === "audio") {
        existingUser.audioTrack = user.audioTrack;
        user.audioTrack?.play();
      }

      updated.set(user.uid, existingUser);
      return updated;
    });
  };

  const handleUserUnpublished = (user: any, mediaType: "video" | "audio") => {
    setRemoteUsers((prev) => {
      const updated = new Map(prev);
      const existingUser = updated.get(user.uid);

      if (existingUser) {
        if (mediaType === "video") {
          existingUser.videoTrack = undefined;
        } else if (mediaType === "audio") {
          existingUser.audioTrack = undefined;
        }
        updated.set(user.uid, existingUser);
      }

      return updated;
    });
  };

  const handleUserJoined = (user: any) => {
    console.log("User joined:", user.uid);
  };

  const handleUserLeft = (user: any) => {
    setRemoteUsers((prev) => {
      const updated = new Map(prev);
      updated.delete(user.uid);
      return updated;
    });
  };

  const handleNetworkQuality = (stats: any) => {
    setConnectionStats({
      rtt: stats.rtt || 0,
      uplinkNetworkQuality: stats.uplinkNetworkQuality || 0,
      downlinkNetworkQuality: stats.downlinkNetworkQuality || 0,
    });
  };

  const toggleVideo = async () => {
    if (localVideoTrack) {
      await localVideoTrack.setEnabled(!isVideoEnabled);
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleAudio = async () => {
    if (localAudioTrack) {
      await localAudioTrack.setEnabled(!isAudioEnabled);
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const toggleRecording = async () => {
    try {
      const newRecordingState = !isRecording;
      setIsRecording(newRecordingState);

      if (onToggleRecording) {
        await onToggleRecording(newRecordingState);
      }

      toast.success(
        newRecordingState ? "Recording started" : "Recording stopped",
      );
    } catch (error) {
      console.error("Failed to toggle recording:", error);
      toast.error("Failed to toggle recording");
    }
  };

  const startScreenShare = async () => {
    try {
      const screenTrack = await AgoraRTC.createScreenVideoTrack();

      if (localVideoTrack && client) {
        await client.unpublish(localVideoTrack);
        localVideoTrack.close();

        await client.publish(screenTrack);
        setIsScreenSharing(true);

        // Update local video display
        if (localVideoRef.current) {
          screenTrack.play(localVideoRef.current);
        }

        toast.success("Screen sharing started");
      }
    } catch (error) {
      console.error("Failed to start screen share:", error);
      toast.error("Failed to start screen sharing");
    }
  };

  const stopScreenShare = async () => {
    try {
      if (client) {
        await createLocalTracks();
        setIsScreenSharing(false);
        toast.success("Screen sharing stopped");
      }
    } catch (error) {
      console.error("Failed to stop screen share:", error);
      toast.error("Failed to stop screen sharing");
    }
  };

  const sendChatMessage = () => {
    if (chatMessage.trim()) {
      const newMessage = {
        id: `msg_${Date.now()}`,
        userId,
        userName: "You", // TODO: Get actual user name
        message: chatMessage.trim(),
        timestamp: new Date(),
      };

      setChatMessages((prev) => [...prev, newMessage]);
      setChatMessage("");

      // TODO: Send message to other participants via Agora RTM or socket
    }
  };

  const leaveSession = async () => {
    await cleanup();
    onLeave();
  };

  const cleanup = async () => {
    try {
      // Stop and close local tracks
      if (localVideoTrack) {
        localVideoTrack.stop();
        localVideoTrack.close();
      }
      if (localAudioTrack) {
        localAudioTrack.stop();
        localAudioTrack.close();
      }

      // Leave channel
      if (client) {
        await client.leave();
      }

      setIsConnected(false);
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  };

  const getNetworkQualityColor = (quality: number) => {
    if (quality >= 4) return "text-green-500";
    if (quality >= 2) return "text-yellow-500";
    return "text-red-500";
  };

  const formatDuration = (startTime: Date) => {
    const now = new Date();
    const duration = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold">{session.title}</h1>
          {session.actualStartTime && (
            <span className="text-sm text-gray-300">
              {formatDuration(session.actualStartTime)}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
            />
            <span className="text-sm text-gray-300">
              {isConnected ? "Connected" : "Connecting..."}
            </span>
          </div>

          {/* Network Quality */}
          <div
            className={`text-sm ${getNetworkQualityColor(connectionStats.uplinkNetworkQuality)}`}
          >
            RTT: {connectionStats.rtt}ms
          </div>

          {/* Participants Count */}
          <div className="flex items-center space-x-1 text-sm text-gray-300">
            <Users className="w-4 h-4" />
            <span>{remoteUsers.size + 1}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Area */}
        <div
          className={`flex-1 p-4 ${showChat ? "mr-80" : ""} transition-all duration-300`}
        >
          <div
            className="h-full grid gap-4"
            style={{
              gridTemplateColumns:
                remoteUsers.size === 0
                  ? "1fr"
                  : remoteUsers.size === 1
                    ? "1fr 1fr"
                    : remoteUsers.size <= 4
                      ? "repeat(2, 1fr)"
                      : "repeat(3, 1fr)",
              gridTemplateRows:
                remoteUsers.size <= 2
                  ? "1fr"
                  : remoteUsers.size <= 4
                    ? "repeat(2, 1fr)"
                    : "repeat(3, 1fr)",
            }}
          >
            {/* Local Video */}
            <div className="relative bg-gray-800 rounded-lg overflow-hidden">
              <div ref={localVideoRef} className="w-full h-full" />
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                You {isScreenSharing && "(Screen)"}
              </div>
              <div className="absolute top-4 right-4 flex space-x-2">
                {!isVideoEnabled && (
                  <div className="bg-red-500 p-2 rounded-full">
                    <VideoOff className="w-4 h-4 text-white" />
                  </div>
                )}
                {!isAudioEnabled && (
                  <div className="bg-red-500 p-2 rounded-full">
                    <MicOff className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Remote Videos */}
            {Array.from(remoteUsers.entries()).map(([uid, user]) => (
              <div
                key={uid}
                className="relative bg-gray-800 rounded-lg overflow-hidden"
              >
                <div id={`remote-video-${uid}`} className="w-full h-full" />
                <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                  {user.participant?.userId || `User ${uid}`}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold">Session Chat</h3>
            </div>

            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-3"
            >
              {chatMessages.map((msg) => (
                <div key={msg.id} className="break-words">
                  <div className="text-xs text-gray-500 mb-1">
                    {msg.userName} • {msg.timestamp.toLocaleTimeString()}
                  </div>
                  <div className="text-sm">{msg.message}</div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendChatMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!chatMessage.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4 flex items-center justify-center space-x-4">
        {/* Audio Toggle */}
        <button
          onClick={toggleAudio}
          className={`p-3 rounded-full transition-colors ${
            isAudioEnabled
              ? "bg-gray-600 hover:bg-gray-500"
              : "bg-red-600 hover:bg-red-500"
          }`}
        >
          {isAudioEnabled ? (
            <Mic className="w-5 h-5 text-white" />
          ) : (
            <MicOff className="w-5 h-5 text-white" />
          )}
        </button>

        {/* Video Toggle */}
        <button
          onClick={toggleVideo}
          className={`p-3 rounded-full transition-colors ${
            isVideoEnabled
              ? "bg-gray-600 hover:bg-gray-500"
              : "bg-red-600 hover:bg-red-500"
          }`}
        >
          {isVideoEnabled ? (
            <Video className="w-5 h-5 text-white" />
          ) : (
            <VideoOff className="w-5 h-5 text-white" />
          )}
        </button>

        {/* Screen Share */}
        <button
          onClick={isScreenSharing ? stopScreenShare : startScreenShare}
          className={`p-3 rounded-full transition-colors ${
            isScreenSharing
              ? "bg-blue-600 hover:bg-blue-500"
              : "bg-gray-600 hover:bg-gray-500"
          }`}
        >
          <Monitor className="w-5 h-5 text-white" />
        </button>

        {/* Recording */}
        {session.isRecordingEnabled && (
          <button
            onClick={toggleRecording}
            className={`p-3 rounded-full transition-colors ${
              isRecording
                ? "bg-red-600 hover:bg-red-500"
                : "bg-gray-600 hover:bg-gray-500"
            }`}
          >
            {isRecording ? (
              <StopCircle className="w-5 h-5 text-white" />
            ) : (
              <Record className="w-5 h-5 text-white" />
            )}
          </button>
        )}

        {/* Chat Toggle */}
        <button
          onClick={() => setShowChat(!showChat)}
          className={`p-3 rounded-full transition-colors ${
            showChat
              ? "bg-blue-600 hover:bg-blue-500"
              : "bg-gray-600 hover:bg-gray-500"
          }`}
        >
          <MessageSquare className="w-5 h-5 text-white" />
        </button>

        {/* Leave Session */}
        <button
          onClick={leaveSession}
          className="p-3 rounded-full bg-red-600 hover:bg-red-500 transition-colors"
        >
          <Phone className="w-5 h-5 text-white transform rotate-[135deg]" />
        </button>
      </div>
    </div>
  );
};
