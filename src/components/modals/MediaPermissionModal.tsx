import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Settings,
  AlertCircle,
  CheckCircle,
  Shield,
} from "lucide-react";

interface MediaPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionsGranted: (stream: MediaStream) => void;
  title?: string;
  description?: string;
}

interface PermissionState {
  camera: "pending" | "granted" | "denied" | "checking";
  microphone: "pending" | "granted" | "denied" | "checking";
  error?: string;
}

export const MediaPermissionModal = ({
  isOpen,
  onClose,
  onPermissionsGranted,
  title = "Camera & Microphone Access",
  description = "This session requires access to your camera and microphone to participate.",
}: MediaPermissionModalProps) => {
  const [permissions, setPermissions] = useState<PermissionState>({
    camera: "pending",
    microphone: "pending",
  });
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  const [step, setStep] = useState<
    "intro" | "requesting" | "testing" | "complete"
  >("intro");
  const [audioLevel, setAudioLevel] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>();

  const requestPermissions = async () => {
    setStep("requesting");
    setPermissions({ camera: "checking", microphone: "checking" });

    try {
      // First request microphone only
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      setPermissions((prev) => ({ ...prev, microphone: "granted" }));

      try {
        // Then request camera
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        // Stop the audio-only stream
        audioStream.getTracks().forEach((track) => track.stop());

        setPermissions((prev) => ({ ...prev, camera: "granted" }));
        setCurrentStream(videoStream);

        // Set up video preview
        if (videoRef.current) {
          videoRef.current.srcObject = videoStream;
        }

        // Set up audio level monitoring
        setupAudioLevelMonitoring(videoStream);

        setStep("testing");
      } catch (videoError: any) {
        console.error("Camera access failed:", videoError);
        setPermissions((prev) => ({
          ...prev,
          camera: "denied",
          error: getErrorMessage(videoError, "camera"),
        }));
      }
    } catch (audioError: any) {
      console.error("Microphone access failed:", audioError);
      setPermissions({
        camera: "pending",
        microphone: "denied",
        error: getErrorMessage(audioError, "microphone"),
      });
    }
  };

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

  const getErrorMessage = (error: any, device: string) => {
    if (error.name === "NotAllowedError") {
      return `${device} access was denied. Please click "Allow" when prompted.`;
    } else if (error.name === "NotFoundError") {
      return `No ${device} found. Please connect a ${device} and try again.`;
    } else if (error.name === "NotSupportedError") {
      return `${device} not supported. Please use HTTPS or a supported browser.`;
    } else if (error.name === "NotReadableError") {
      return `${device} is already in use by another application.`;
    }
    return `Failed to access ${device}. Please check your browser settings.`;
  };

  const handleComplete = () => {
    if (currentStream) {
      onPermissionsGranted(currentStream);
      setStep("complete");
      onClose();
    }
  };

  const handleRetry = () => {
    setPermissions({ camera: "pending", microphone: "pending" });
    setStep("intro");
    if (currentStream) {
      currentStream.getTracks().forEach((track) => track.stop());
      setCurrentStream(null);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setAudioLevel(0);
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [currentStream]);

  const getPermissionIcon = (status: string) => {
    switch (status) {
      case "granted":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "denied":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case "checking":
        return (
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        );
      default:
        return <Shield className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === "intro" && (
            <>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Video className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Camera Access</p>
                    <p className="text-sm text-gray-600">
                      Required to see you during the session
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Mic className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Microphone Access</p>
                    <p className="text-sm text-gray-600">
                      Required to hear you during the session
                    </p>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your browser will ask for permission to access your camera and
                  microphone. Please click "Allow" to continue.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button onClick={requestPermissions} className="flex-1">
                  <Video className="w-4 h-4 mr-2" />
                  Grant Permissions
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </>
          )}

          {step === "requesting" && (
            <>
              <div className="text-center py-4">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="font-medium">Requesting Permissions...</p>
                <p className="text-sm text-gray-600">
                  Please allow access when prompted by your browser
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  {getPermissionIcon(permissions.microphone)}
                  <div className="flex-1">
                    <p className="font-medium">Microphone</p>
                    <p className="text-sm text-gray-600">
                      {permissions.microphone === "checking"
                        ? "Requesting access..."
                        : permissions.microphone === "granted"
                          ? "Access granted"
                          : permissions.microphone === "denied"
                            ? "Access denied"
                            : "Pending"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  {getPermissionIcon(permissions.camera)}
                  <div className="flex-1">
                    <p className="font-medium">Camera</p>
                    <p className="text-sm text-gray-600">
                      {permissions.camera === "checking"
                        ? "Requesting access..."
                        : permissions.camera === "granted"
                          ? "Access granted"
                          : permissions.camera === "denied"
                            ? "Access denied"
                            : "Pending"}
                    </p>
                  </div>
                </div>
              </div>

              {permissions.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{permissions.error}</AlertDescription>
                </Alert>
              )}

              {(permissions.camera === "denied" ||
                permissions.microphone === "denied") && (
                <div className="flex gap-3">
                  <Button
                    onClick={handleRetry}
                    variant="outline"
                    className="flex-1"
                  >
                    Try Again
                  </Button>
                  <Button variant="ghost" onClick={onClose}>
                    Cancel
                  </Button>
                </div>
              )}
            </>
          )}

          {step === "testing" && currentStream && (
            <>
              <div className="text-center mb-4">
                <p className="font-medium">Test Your Setup</p>
                <p className="text-sm text-gray-600">
                  Can you see yourself? Speak to test your microphone - watch
                  the audio level meter.
                </p>
              </div>

              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-48 bg-gray-900 rounded-lg object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                  You
                </div>

                {/* Audio Level Indicator */}
                <div className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-lg p-2">
                  <div className="flex items-center gap-2">
                    <Mic className="w-3 h-3 text-white" />
                    <div className="w-12 h-2 bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all duration-100"
                        style={{ width: `${Math.min(audioLevel * 2, 100)}%` }}
                      ></div>
                    </div>
                    {audioLevel > 10 && (
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                </div>
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Can you see yourself in the video? Does the audio meter move
                  when you speak? If yes, you're ready to join the session!
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button onClick={handleComplete} className="flex-1">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Looks Good!
                </Button>
                <Button variant="outline" onClick={handleRetry}>
                  <Settings className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </>
          )}

          {/* Troubleshooting Help */}
          {(permissions.camera === "denied" ||
            permissions.microphone === "denied") && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Troubleshooting Tips:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>
                  • Click the camera/microphone icon in your browser's address
                  bar
                </li>
                <li>• Select "Always allow" for this site</li>
                <li>• Reload the page and try again</li>
                <li>• Check if another app is using your camera/microphone</li>
                <li>• Make sure you're using HTTPS (secure connection)</li>
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaPermissionModal;
