import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Mail,
  Settings,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Info,
  Wrench,
} from "lucide-react";

export function EmailServiceStatus() {
  const [showDetails, setShowDetails] = useState(false);

  const isMockEmail =
    import.meta.env.DEV || import.meta.env.VITE_MOCK_EMAIL === "true";
  const hasEmailJsConfig = !!(
    import.meta.env.VITE_EMAILJS_SERVICE_ID &&
    import.meta.env.VITE_EMAILJS_TEMPLATE_ID &&
    import.meta.env.VITE_EMAILJS_USER_ID
  );

  const getEmailStatus = () => {
    if (isMockEmail) {
      return {
        status: "mock",
        label: "Development Mode",
        description: "Emails are simulated and logged to console",
        color: "bg-orange-100 text-orange-800 border-orange-300",
        icon: <Wrench className="w-4 h-4" />,
      };
    } else if (hasEmailJsConfig) {
      return {
        status: "configured",
        label: "Email Service Active",
        description: "EmailJS configured and ready to send emails",
        color: "bg-green-100 text-green-800 border-green-300",
        icon: <CheckCircle className="w-4 h-4" />,
      };
    } else {
      return {
        status: "not-configured",
        label: "Email Service Not Configured",
        description: "No email service configured for sending invitations",
        color: "bg-red-100 text-red-800 border-red-300",
        icon: <AlertTriangle className="w-4 h-4" />,
      };
    }
  };

  const emailStatus = getEmailStatus();

  if (!showDetails && !isMockEmail) {
    return null; // Don't show if emails are working and user doesn't want details
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="w-5 h-5 text-blue-600" />
            Email Service Status
          </CardTitle>
          <Badge className={emailStatus.color}>
            {emailStatus.icon}
            {emailStatus.label}
          </Badge>
        </div>
        <CardDescription>{emailStatus.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {isMockEmail && (
          <Alert className="border-orange-200 bg-orange-50">
            <Info className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Development Mode Active:</strong> Team member invitations
              are being simulated. Email content is logged to the browser
              console for testing purposes.
            </AlertDescription>
          </Alert>
        )}

        {!hasEmailJsConfig && !isMockEmail && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Email Service Required:</strong> To send real invitations,
              configure an email service.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <Settings className="w-4 h-4 mr-2" />
            {showDetails ? "Hide Details" : "Show Configuration"}
          </Button>

          {isMockEmail && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log("📧 Email Service Configuration Guide");
                console.log("=====================================");
                console.log("Current Settings:");
                console.log(
                  "- VITE_MOCK_EMAIL:",
                  import.meta.env.VITE_MOCK_EMAIL,
                );
                console.log(
                  "- VITE_EMAILJS_SERVICE_ID:",
                  import.meta.env.VITE_EMAILJS_SERVICE_ID || "Not set",
                );
                console.log(
                  "- VITE_EMAILJS_TEMPLATE_ID:",
                  import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "Not set",
                );
                console.log(
                  "- VITE_EMAILJS_USER_ID:",
                  import.meta.env.VITE_EMAILJS_USER_ID || "Not set",
                );
                console.log("\nTo enable real emails:");
                console.log("1. Sign up for EmailJS (https://emailjs.com)");
                console.log("2. Set VITE_EMAILJS_* environment variables");
                console.log("3. Set VITE_MOCK_EMAIL=false");
                console.log("4. Restart the development server");

                window.open("https://emailjs.com", "_blank");
              }}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Setup EmailJS
            </Button>
          )}
        </div>

        {showDetails && (
          <div className="space-y-4 pt-4 border-t">
            <div>
              <h4 className="font-medium text-sm mb-2">
                Current Configuration:
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Mock Mode:</span>
                  <Badge variant={isMockEmail ? "secondary" : "default"}>
                    {isMockEmail ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">EmailJS Service ID:</span>
                  <Badge
                    variant={
                      import.meta.env.VITE_EMAILJS_SERVICE_ID
                        ? "default"
                        : "outline"
                    }
                  >
                    {import.meta.env.VITE_EMAILJS_SERVICE_ID
                      ? "Configured"
                      : "Not Set"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">EmailJS Template ID:</span>
                  <Badge
                    variant={
                      import.meta.env.VITE_EMAILJS_TEMPLATE_ID
                        ? "default"
                        : "outline"
                    }
                  >
                    {import.meta.env.VITE_EMAILJS_TEMPLATE_ID
                      ? "Configured"
                      : "Not Set"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">EmailJS User ID:</span>
                  <Badge
                    variant={
                      import.meta.env.VITE_EMAILJS_USER_ID
                        ? "default"
                        : "outline"
                    }
                  >
                    {import.meta.env.VITE_EMAILJS_USER_ID
                      ? "Configured"
                      : "Not Set"}
                  </Badge>
                </div>
              </div>
            </div>

            {isMockEmail && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>For Development:</strong> Check browser console to see
                  simulated email content.
                </p>
                <p className="text-sm text-blue-700">
                  Team members are added to the program successfully, but no
                  actual emails are sent.
                </p>
              </div>
            )}

            {!isMockEmail && !hasEmailJsConfig && (
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-sm text-yellow-800 mb-2">
                  <strong>Production Mode:</strong> Email service required for
                  sending invitations.
                </p>
                <p className="text-sm text-yellow-700">
                  Configure EmailJS or another email service to enable
                  invitation delivery.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
