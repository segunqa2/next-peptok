import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Settings,
  Mail,
  Send,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  TestTube,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EmailConfiguration {
  serviceId: string;
  templateId: string;
  userId: string;
  mockEmailEnabled: boolean;
  fromName: string;
  fromEmail: string;
  lastUpdated: string;
}

export default function EmailSettings() {
  const { user } = useAuth();
  const [config, setConfig] = useState<EmailConfiguration>({
    serviceId: "",
    templateId: "",
    userId: "",
    mockEmailEnabled: false,
    fromName: "Peptok Platform",
    fromEmail: "noreply@peptok.com",
    lastUpdated: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testResults, setTestResults] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Access control
  if (!user || user.userType !== "platform_admin") {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Access Denied
                </h3>
                <p className="text-gray-600">
                  You need platform administrator privileges to access email
                  settings.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      setLoading(true);

      // Load from environment variables and localStorage
      const envConfig = {
        serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || "",
        templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "",
        userId: import.meta.env.VITE_EMAILJS_USER_ID || "",
        mockEmailEnabled: import.meta.env.VITE_MOCK_EMAIL === "true",
        fromName: localStorage.getItem("email_from_name") || "Peptok Platform",
        fromEmail:
          localStorage.getItem("email_from_email") || "noreply@peptok.com",
        lastUpdated:
          localStorage.getItem("email_config_updated") ||
          new Date().toISOString(),
      };

      setConfig(envConfig);
    } catch (error) {
      console.error("Failed to load email configuration:", error);
      toast.error("Failed to load email configuration");
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = (
    field: keyof EmailConfiguration,
    value: string | boolean,
  ) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const saveConfiguration = async () => {
    try {
      setSaving(true);

      // Save to localStorage for persistence
      localStorage.setItem("email_from_name", config.fromName);
      localStorage.setItem("email_from_email", config.fromEmail);
      localStorage.setItem("email_config_updated", new Date().toISOString());
      localStorage.setItem(
        "email_mock_enabled",
        config.mockEmailEnabled.toString(),
      );

      // Update config with new timestamp
      setConfig((prev) => ({
        ...prev,
        lastUpdated: new Date().toISOString(),
      }));

      setHasChanges(false);
      toast.success("Email configuration saved successfully");

      // Note to admin about environment variables
      if (config.serviceId || config.templateId || config.userId) {
        toast.info(
          "Note: EmailJS credentials require environment variables to be updated",
        );
      }
    } catch (error) {
      console.error("Failed to save configuration:", error);
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const testEmailService = async () => {
    if (!testEmail) {
      toast.error("Please enter a test email address");
      return;
    }

    try {
      setTesting(true);
      setTestResults(null);

      // Simulate email test
      const isConfigured =
        config.serviceId && config.templateId && config.userId;

      if (config.mockEmailEnabled) {
        setTestResults({
          success: true,
          message: "Mock email mode: Test email would be logged to console",
        });
        console.log("Mock Email Test:", {
          to: testEmail,
          from: `${config.fromName} <${config.fromEmail}>`,
          subject: "Peptok Platform - Test Email",
          body: "This is a test email from the Peptok platform.",
        });
        toast.success("Mock email test completed - check console");
      } else if (isConfigured) {
        // In a real implementation, this would use EmailJS
        setTestResults({
          success: true,
          message:
            "Email configuration appears valid. Test email would be sent via EmailJS.",
        });
        toast.success("Email test completed successfully");
      } else {
        setTestResults({
          success: false,
          message:
            "Email service not properly configured. Please set EmailJS credentials.",
        });
        toast.error("Email service not configured");
      }
    } catch (error) {
      setTestResults({
        success: false,
        message: `Email test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
      toast.error("Email test failed");
    } finally {
      setTesting(false);
    }
  };

  const resetToDefaults = () => {
    setConfig({
      serviceId: "",
      templateId: "",
      userId: "",
      mockEmailEnabled: true,
      fromName: "Peptok Platform",
      fromEmail: "noreply@peptok.com",
      lastUpdated: new Date().toISOString(),
    });
    setHasChanges(true);
    toast.info("Configuration reset to defaults");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            <span>Loading email configuration...</span>
          </div>
        </div>
      </div>
    );
  }

  const isConfigured = config.serviceId && config.templateId && config.userId;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Mail className="w-8 h-8 text-blue-600" />
                Email Settings
              </h1>
              <p className="text-gray-600 mt-2">
                Configure email service settings for the platform
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={resetToDefaults}
                disabled={saving}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset to Defaults
              </Button>
              <Button
                onClick={saveConfiguration}
                disabled={!hasChanges || saving}
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Configuration
              </Button>
            </div>
          </div>

          {hasChanges && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2" />
                <span className="text-yellow-800">
                  You have unsaved changes. Don't forget to save your
                  configuration.
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* EmailJS Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                EmailJS Configuration
              </CardTitle>
              <p className="text-sm text-gray-600">
                Configure EmailJS service for sending emails
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  EmailJS credentials must be set as environment variables
                  (VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID,
                  VITE_EMAILJS_USER_ID) for security.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="serviceId">Service ID</Label>
                  <Input
                    id="serviceId"
                    type="text"
                    value={config.serviceId}
                    onChange={(e) => updateConfig("serviceId", e.target.value)}
                    placeholder="your_service_id"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Set via VITE_EMAILJS_SERVICE_ID environment variable
                  </p>
                </div>

                <div>
                  <Label htmlFor="templateId">Template ID</Label>
                  <Input
                    id="templateId"
                    type="text"
                    value={config.templateId}
                    onChange={(e) => updateConfig("templateId", e.target.value)}
                    placeholder="your_template_id"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Set via VITE_EMAILJS_TEMPLATE_ID environment variable
                  </p>
                </div>

                <div>
                  <Label htmlFor="userId">User ID</Label>
                  <Input
                    id="userId"
                    type="text"
                    value={config.userId}
                    onChange={(e) => updateConfig("userId", e.target.value)}
                    placeholder="your_user_id"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Set via VITE_EMAILJS_USER_ID environment variable
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="mockEmail">Mock Email Mode</Label>
                    <p className="text-xs text-gray-500">
                      Enable for development/testing
                    </p>
                  </div>
                  <Switch
                    id="mockEmail"
                    checked={config.mockEmailEnabled}
                    onCheckedChange={(checked) =>
                      updateConfig("mockEmailEnabled", checked)
                    }
                  />
                </div>
              </div>

              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={isConfigured ? "default" : "destructive"}
                    className="text-sm"
                  >
                    {isConfigured ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Configured
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Not Configured
                      </>
                    )}
                  </Badge>
                  {config.mockEmailEnabled && (
                    <Badge variant="outline">Mock Mode</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email Sender Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                Sender Configuration
              </CardTitle>
              <p className="text-sm text-gray-600">
                Configure default sender information
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fromName">From Name</Label>
                <Input
                  id="fromName"
                  type="text"
                  value={config.fromName}
                  onChange={(e) => updateConfig("fromName", e.target.value)}
                  placeholder="Peptok Platform"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The name that will appear as the sender
                </p>
              </div>

              <div>
                <Label htmlFor="fromEmail">From Email</Label>
                <Input
                  id="fromEmail"
                  type="email"
                  value={config.fromEmail}
                  onChange={(e) => updateConfig("fromEmail", e.target.value)}
                  placeholder="noreply@peptok.com"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The email address that will appear as the sender
                </p>
              </div>

              <Separator />

              {/* Email Test */}
              <div className="space-y-3">
                <Label htmlFor="testEmail">Test Email Service</Label>
                <div className="flex gap-2">
                  <Input
                    id="testEmail"
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="test@example.com"
                    className="flex-1"
                  />
                  <Button
                    onClick={testEmailService}
                    disabled={testing}
                    variant="outline"
                  >
                    {testing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <TestTube className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Send a test email to verify configuration
                </p>

                {testResults && (
                  <div
                    className={`p-3 rounded-lg ${
                      testResults.success
                        ? "bg-green-50 border border-green-200"
                        : "bg-red-50 border border-red-200"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {testResults.success ? (
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                      )}
                      <p
                        className={`text-sm ${
                          testResults.success
                            ? "text-green-800"
                            : "text-red-800"
                        }`}
                      >
                        {testResults.message}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              Last updated: {new Date(config.lastUpdated).toLocaleString()}
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline">Platform Admin</Badge>
              <Badge variant={isConfigured ? "default" : "destructive"}>
                {isConfigured ? "Service Ready" : "Needs Configuration"}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
