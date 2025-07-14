import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MediaPermissionModal } from "@/components/modals/MediaPermissionModal";
import { Video, Mic, Settings } from "lucide-react";
import Header from "@/components/layout/Header";

export default function TestPermissions() {
  const [showModal, setShowModal] = useState(false);
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePermissionsGranted = (stream: MediaStream) => {
    setCurrentStream(stream);
    console.log("Permissions granted, stream:", stream);
  };

  // Update video element when stream changes
  useEffect(() => {
    if (videoRef.current && currentStream) {
      videoRef.current.srcObject = currentStream;
    }
  }, [currentStream]);

  const stopStream = () => {
    if (currentStream) {
      currentStream.getTracks().forEach((track) => track.stop());
      setCurrentStream(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5" />
                Media Permissions Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Test the new media permission modal that requests camera and
                microphone access with proper pop-ups.
              </p>

              <div className="flex gap-3">
                <Button onClick={() => setShowModal(true)} className="flex-1">
                  <Video className="w-4 h-4 mr-2" />
                  Request Camera & Mic
                </Button>

                {currentStream && (
                  <Button onClick={stopStream} variant="outline">
                    <Settings className="w-4 h-4 mr-2" />
                    Stop Stream
                  </Button>
                )}
              </div>

              {currentStream && (
                <div className="space-y-3">
                  <p className="text-green-600 font-medium">
                    ✅ Permissions granted successfully!
                  </p>

                  <div className="relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-48 bg-gray-900 rounded-lg object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                      Live Preview
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium mb-2">How it works:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>
                    1. Click "Request Camera & Mic" to open the permission modal
                  </li>
                  <li>2. Click "Grant Permissions" in the modal</li>
                  <li>3. Allow access when your browser asks</li>
                  <li>4. Test your camera and microphone</li>
                  <li>5. Click "Looks Good!" to complete the setup</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <MediaPermissionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onPermissionsGranted={handlePermissionsGranted}
        title="Test Media Permissions"
        description="This is a test of the media permission system. Grant access to test your camera and microphone."
      />
    </div>
  );
}
