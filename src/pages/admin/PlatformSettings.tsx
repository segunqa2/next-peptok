import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Shield,
  Lock,
  Eye,
  EyeOff,
  Key,
  Clock,
  AlertTriangle,
  CheckCircle,
  Save,
  RefreshCw,
  Settings,
  Users,
  Globe,
  Smartphone,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import { apiEnhanced } from "@/services/apiEnhanced";
import { useCrossBrowserSync } from "@/hooks/useCrossBrowserSync";

interface SecuritySettings {
  // Password Policy
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecialChars: boolean;
  passwordExpiryDays: number;
  passwordHistoryCount: number;

  // Session Management
  sessionTimeoutMinutes: number;
  maxConcurrentSessions: number;
  rememberMeDays: number;
  forceLogoutOnPasswordChange: boolean;

  // Two-Factor Authentication
  twoFactorRequired: boolean;
  twoFactorMethods: string[];

  // Access Control
  loginAttemptLimit: number;
  lockoutDurationMinutes: number;
  allowedDomains: string[];
  blockedCountries: string[];

  // API Security
  apiRateLimitPerMinute: number;
  apiKeyExpiryDays: number;
  requireHttps: boolean;

  // Audit & Compliance
  auditLogRetentionDays: number;
  enableDataEncryption: boolean;
  gdprCompliant: boolean;

  lastUpdated: string;
}

interface SecurityEvent {
  id: string;
  type:
    | "login_failure"
    | "suspicious_activity"
    | "policy_violation"
    | "unauthorized_access";
  severity: "low" | "medium" | "high" | "critical";
  userId?: string;
  userEmail?: string;
  ipAddress: string;
  userAgent: string;
  description: string;
  timestamp: string;
  resolved: boolean;
}

export default function SecuritySettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SecuritySettings>({
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: false,
    passwordExpiryDays: 90,
    passwordHistoryCount: 5,
    sessionTimeoutMinutes: 30,
    maxConcurrentSessions: 3,
    rememberMeDays: 30,
    forceLogoutOnPasswordChange: true,
    twoFactorRequired: false,
    twoFactorMethods: ["email", "sms"],
    loginAttemptLimit: 5,
    lockoutDurationMinutes: 15,
    allowedDomains: [],
    blockedCountries: [],
    apiRateLimitPerMinute: 60,
    apiKeyExpiryDays: 365,
    requireHttps: true,
    auditLogRetentionDays: 90,
    enableDataEncryption: true,
    gdprCompliant: true,
    lastUpdated: new Date().toISOString(),
  });

  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([
    {
      id: "1",
      type: "login_failure",
      severity: "medium",
      userId: "user_123",
      userEmail: "user@example.com",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 Chrome/120.0.0.0",
      description: "Multiple failed login attempts",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      resolved: false,
    },
    {
      id: "2",
      type: "suspicious_activity",
      severity: "high",
      ipAddress: "203.0.113.195",
      userAgent: "curl/7.68.0",
      description: "Unusual API access pattern detected",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      resolved: true,
    },
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [newCountry, setNewCountry] = useState("");
  const [showSecurityEvents, setShowSecurityEvents] = useState(false);

  // Cross-browser sync
  const { data: syncedData, isLoading: syncLoading } = useCrossBrowserSync({
    syncConfig: {
      storageKey: "peptok_security_settings",
      cookieKey: "peptok_security",
      broadcastChannel: "peptok_security_sync",
      syncInterval: 5000,
    },
  });

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (syncedData && !syncLoading) {
      setSettings(syncedData);
    }
  }, [syncedData, syncLoading]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await apiEnhanced.getSecuritySettings();
      setSettings(response);
    } catch (error) {
      console.error("Failed to load security settings:", error);
      toast.error("Failed to load security settings");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!hasChanges) return;

    try {
      setSaving(true);
      const updatedSettings = {
        ...settings,
        lastUpdated: new Date().toISOString(),
      };

      await apiEnhanced.updateSecuritySettings(updatedSettings);
      setSettings(updatedSettings);
      setHasChanges(false);
      toast.success("Security settings saved successfully");
    } catch (error) {
      console.error("Failed to save security settings:", error);
      toast.error("Failed to save security settings");
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof SecuritySettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const addDomain = () => {
    if (newDomain && !settings.allowedDomains.includes(newDomain)) {
      updateSetting("allowedDomains", [...settings.allowedDomains, newDomain]);
      setNewDomain("");
    }
  };

  const removeDomain = (domain: string) => {
    updateSetting(
      "allowedDomains",
      settings.allowedDomains.filter((d) => d !== domain),
    );
  };

  const addCountry = () => {
    if (newCountry && !settings.blockedCountries.includes(newCountry)) {
      updateSetting("blockedCountries", [
        ...settings.blockedCountries,
        newCountry,
      ]);
      setNewCountry("");
    }
  };

  const removeCountry = (country: string) => {
    updateSetting(
      "blockedCountries",
      settings.blockedCountries.filter((c) => c !== country),
    );
  };

  const resolveSecurityEvent = (eventId: string) => {
    setSecurityEvents((prev) =>
      prev.map((event) =>
        event.id === eventId ? { ...event, resolved: true } : event,
      ),
    );
    toast.success("Security event marked as resolved");
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "critical":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "low":
        return <CheckCircle className="w-4 h-4" />;
      case "medium":
        return <AlertTriangle className="w-4 h-4" />;
      case "high":
        return <Shield className="w-4 h-4" />;
      case "critical":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  if (!user || user.userType !== "platform_admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Settings className="w-8 h-8 text-blue-600" />
                Platform Settings
              </h1>
              <p className="text-gray-600">
                Platform settings, security controls, and AI configuration
              </p>
            </div>
            <div className="flex gap-3">
              <Dialog
                open={showSecurityEvents}
                onOpenChange={setShowSecurityEvents}
              >
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Eye className="w-4 h-4 mr-2" />
                    Security Events
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Security Events</DialogTitle>
                    <DialogDescription>
                      Recent security events and alerts
                    </DialogDescription>
                  </DialogHeader>
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Severity</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {securityEvents.map((event) => (
                          <TableRow key={event.id}>
                            <TableCell className="text-sm">
                              {new Date(event.timestamp).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {event.type.replace("_", " ")}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={getSeverityColor(event.severity)}
                              >
                                {getSeverityIcon(event.severity)}
                                <span className="ml-1">{event.severity}</span>
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {event.userEmail || "Unknown"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {event.description}
                            </TableCell>
                            <TableCell>
                              {event.resolved ? (
                                <Badge className="bg-green-100 text-green-800">
                                  Resolved
                                </Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-800">
                                  Open
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {!event.resolved && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => resolveSecurityEvent(event.id)}
                                >
                                  Resolve
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </DialogContent>
              </Dialog>
              <Button onClick={saveSettings} disabled={!hasChanges || saving}>
                {saving ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </div>

          {hasChanges && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You have unsaved changes. Click "Save Changes" to apply them.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Password Policy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Password Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="passwordMinLength">Minimum Length</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    min="6"
                    max="128"
                    value={settings.passwordMinLength}
                    onChange={(e) =>
                      updateSetting(
                        "passwordMinLength",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="requireUppercase">Require Uppercase</Label>
                    <Switch
                      id="requireUppercase"
                      checked={settings.passwordRequireUppercase}
                      onCheckedChange={(checked) =>
                        updateSetting("passwordRequireUppercase", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="requireLowercase">Require Lowercase</Label>
                    <Switch
                      id="requireLowercase"
                      checked={settings.passwordRequireLowercase}
                      onCheckedChange={(checked) =>
                        updateSetting("passwordRequireLowercase", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="requireNumbers">Require Numbers</Label>
                    <Switch
                      id="requireNumbers"
                      checked={settings.passwordRequireNumbers}
                      onCheckedChange={(checked) =>
                        updateSetting("passwordRequireNumbers", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="requireSpecialChars">
                      Require Special Characters
                    </Label>
                    <Switch
                      id="requireSpecialChars"
                      checked={settings.passwordRequireSpecialChars}
                      onCheckedChange={(checked) =>
                        updateSetting("passwordRequireSpecialChars", checked)
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="passwordExpiryDays">
                    Password Expiry (days)
                  </Label>
                  <Input
                    id="passwordExpiryDays"
                    type="number"
                    min="0"
                    value={settings.passwordExpiryDays}
                    onChange={(e) =>
                      updateSetting(
                        "passwordExpiryDays",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="passwordHistoryCount">
                    Password History Count
                  </Label>
                  <Input
                    id="passwordHistoryCount"
                    type="number"
                    min="0"
                    max="50"
                    value={settings.passwordHistoryCount}
                    onChange={(e) =>
                      updateSetting(
                        "passwordHistoryCount",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Session Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Session Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="sessionTimeout">
                    Session Timeout (minutes)
                  </Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    min="5"
                    max="1440"
                    value={settings.sessionTimeoutMinutes}
                    onChange={(e) =>
                      updateSetting(
                        "sessionTimeoutMinutes",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="maxConcurrentSessions">
                    Max Concurrent Sessions
                  </Label>
                  <Input
                    id="maxConcurrentSessions"
                    type="number"
                    min="1"
                    max="10"
                    value={settings.maxConcurrentSessions}
                    onChange={(e) =>
                      updateSetting(
                        "maxConcurrentSessions",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="rememberMeDays">
                    Remember Me Duration (days)
                  </Label>
                  <Input
                    id="rememberMeDays"
                    type="number"
                    min="1"
                    max="365"
                    value={settings.rememberMeDays}
                    onChange={(e) =>
                      updateSetting("rememberMeDays", parseInt(e.target.value))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="forceLogoutOnPasswordChange">
                    Force Logout on Password Change
                  </Label>
                  <Switch
                    id="forceLogoutOnPasswordChange"
                    checked={settings.forceLogoutOnPasswordChange}
                    onCheckedChange={(checked) =>
                      updateSetting("forceLogoutOnPasswordChange", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Access Control */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Access Control
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="loginAttemptLimit">Login Attempt Limit</Label>
                  <Input
                    id="loginAttemptLimit"
                    type="number"
                    min="3"
                    max="20"
                    value={settings.loginAttemptLimit}
                    onChange={(e) =>
                      updateSetting(
                        "loginAttemptLimit",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="lockoutDuration">
                    Lockout Duration (minutes)
                  </Label>
                  <Input
                    id="lockoutDuration"
                    type="number"
                    min="5"
                    max="1440"
                    value={settings.lockoutDurationMinutes}
                    onChange={(e) =>
                      updateSetting(
                        "lockoutDurationMinutes",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>

                <div>
                  <Label>Allowed Domains</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="example.com"
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addDomain()}
                    />
                    <Button onClick={addDomain} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {settings.allowedDomains.map((domain) => (
                      <Badge
                        key={domain}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {domain}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-4 w-4 p-0"
                          onClick={() => removeDomain(domain)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Blocked Countries</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Country code (e.g., CN)"
                      value={newCountry}
                      onChange={(e) => setNewCountry(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addCountry()}
                    />
                    <Button onClick={addCountry} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {settings.blockedCountries.map((country) => (
                      <Badge
                        key={country}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {country}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-4 w-4 p-0"
                          onClick={() => removeCountry(country)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Two-Factor Authentication */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  Two-Factor Authentication
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="twoFactorRequired">
                    Require Two-Factor Authentication
                  </Label>
                  <Switch
                    id="twoFactorRequired"
                    checked={settings.twoFactorRequired}
                    onCheckedChange={(checked) =>
                      updateSetting("twoFactorRequired", checked)
                    }
                  />
                </div>

                {settings.twoFactorRequired && (
                  <div>
                    <Label>Available Methods</Label>
                    <div className="space-y-2 mt-2">
                      {["email", "sms", "authenticator"].map((method) => (
                        <div
                          key={method}
                          className="flex items-center justify-between"
                        >
                          <span className="capitalize">{method}</span>
                          <Switch
                            checked={settings.twoFactorMethods.includes(method)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                updateSetting("twoFactorMethods", [
                                  ...settings.twoFactorMethods,
                                  method,
                                ]);
                              } else {
                                updateSetting(
                                  "twoFactorMethods",
                                  settings.twoFactorMethods.filter(
                                    (m) => m !== method,
                                  ),
                                );
                              }
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* API Security */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  API Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="apiRateLimit">
                    Rate Limit (requests per minute)
                  </Label>
                  <Input
                    id="apiRateLimit"
                    type="number"
                    min="1"
                    max="1000"
                    value={settings.apiRateLimitPerMinute}
                    onChange={(e) =>
                      updateSetting(
                        "apiRateLimitPerMinute",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="apiKeyExpiry">API Key Expiry (days)</Label>
                  <Input
                    id="apiKeyExpiry"
                    type="number"
                    min="1"
                    max="3650"
                    value={settings.apiKeyExpiryDays}
                    onChange={(e) =>
                      updateSetting(
                        "apiKeyExpiryDays",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="requireHttps">Require HTTPS</Label>
                  <Switch
                    id="requireHttps"
                    checked={settings.requireHttps}
                    onCheckedChange={(checked) =>
                      updateSetting("requireHttps", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Compliance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Compliance & Data Protection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="auditLogRetention">
                    Audit Log Retention (days)
                  </Label>
                  <Input
                    id="auditLogRetention"
                    type="number"
                    min="30"
                    max="2555"
                    value={settings.auditLogRetentionDays}
                    onChange={(e) =>
                      updateSetting(
                        "auditLogRetentionDays",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="enableDataEncryption">
                    Enable Data Encryption
                  </Label>
                  <Switch
                    id="enableDataEncryption"
                    checked={settings.enableDataEncryption}
                    onCheckedChange={(checked) =>
                      updateSetting("enableDataEncryption", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="gdprCompliant">GDPR Compliant</Label>
                  <Switch
                    id="gdprCompliant"
                    checked={settings.gdprCompliant}
                    onCheckedChange={(checked) =>
                      updateSetting("gdprCompliant", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Last Updated */}
          {settings.lastUpdated && (
            <div className="text-center text-sm text-gray-500">
              Last updated: {new Date(settings.lastUpdated).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
