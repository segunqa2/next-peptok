import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
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
  Activity,
  BarChart3,
  TrendingUp,
  Database,
  Clock,
  AlertTriangle,
  CheckCircle,
  Save,
  RefreshCw,
  Settings,
  Eye,
  Download,
  Plus,
  Trash2,
  Globe,
  Users,
  DollarSign,
  Calendar,
  Filter,
  PieChart,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import { apiEnhanced } from "@/services/apiEnhanced";
import { useCrossBrowserSync } from "@/hooks/useCrossBrowserSync";

interface AnalyticsSettings {
  // Data Collection
  enableUserTracking: boolean;
  enableSessionTracking: boolean;
  enablePerformanceTracking: boolean;
  enableErrorTracking: boolean;
  enableCustomEvents: boolean;

  // Data Retention
  rawDataRetentionDays: number;
  aggregatedDataRetentionDays: number;
  logDataRetentionDays: number;

  // Privacy & Compliance
  anonymizeUserData: boolean;
  respectDoNotTrack: boolean;
  enableGDPRMode: boolean;
  dataProcessingConsent: boolean;

  // Reporting Configuration
  defaultTimeZone: string;
  defaultDateRange: string;
  autoRefreshInterval: number;
  enableRealTimeUpdates: boolean;

  // Dashboard Settings
  enabledMetrics: string[];
  customDashboards: CustomDashboard[];

  // Export & Integration
  enableDataExport: boolean;
  exportFormats: string[];
  webhookEndpoints: WebhookEndpoint[];

  // Alerts & Notifications
  enableAlerts: boolean;
  alertThresholds: AlertThreshold[];
  notificationChannels: string[];

  lastUpdated: string;
}

interface CustomDashboard {
  id: string;
  name: string;
  description: string;
  metrics: string[];
  layout: "grid" | "list" | "cards";
  refreshInterval: number;
  isDefault: boolean;
}

interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  events: string[];
  enabled: boolean;
  secret: string;
}

interface AlertThreshold {
  id: string;
  metric: string;
  operator: ">" | "<" | "=" | ">=" | "<=";
  value: number;
  enabled: boolean;
  severity: "low" | "medium" | "high";
}

interface AnalyticsReport {
  id: string;
  name: string;
  type: "scheduled" | "one-time";
  frequency: string;
  format: string;
  metrics: string[];
  recipients: string[];
  lastGenerated?: string;
  nextScheduled?: string;
  enabled: boolean;
}

export default function AnalyticsSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AnalyticsSettings>({
    enableUserTracking: true,
    enableSessionTracking: true,
    enablePerformanceTracking: true,
    enableErrorTracking: true,
    enableCustomEvents: false,
    rawDataRetentionDays: 90,
    aggregatedDataRetentionDays: 730,
    logDataRetentionDays: 30,
    anonymizeUserData: true,
    respectDoNotTrack: true,
    enableGDPRMode: true,
    dataProcessingConsent: true,
    defaultTimeZone: "UTC",
    defaultDateRange: "30d",
    autoRefreshInterval: 300,
    enableRealTimeUpdates: true,
    enabledMetrics: [
      "user_registrations",
      "session_duration",
      "page_views",
      "conversion_rate",
      "revenue",
      "error_rate",
      "employee_engagement",
      "performance_ratings",
      "goal_achievement",
      "retention_rate",
    ],
    customDashboards: [
      {
        id: "1",
        name: "Executive Summary",
        description: "High-level KPIs for executives",
        metrics: ["user_registrations", "revenue", "conversion_rate"],
        layout: "cards",
        refreshInterval: 300,
        isDefault: true,
      },
    ],
    enableDataExport: true,
    exportFormats: ["csv", "json", "pdf"],
    webhookEndpoints: [],
    enableAlerts: true,
    alertThresholds: [
      {
        id: "1",
        metric: "error_rate",
        operator: ">",
        value: 5,
        enabled: true,
        severity: "high",
      },
    ],
    notificationChannels: ["email", "webhook"],
    lastUpdated: new Date().toISOString(),
  });

  const [reports, setReports] = useState<AnalyticsReport[]>([
    {
      id: "1",
      name: "Weekly Executive Report",
      type: "scheduled",
      frequency: "weekly",
      format: "pdf",
      metrics: ["user_registrations", "revenue", "conversion_rate"],
      recipients: ["exec@company.com"],
      lastGenerated: new Date(Date.now() - 86400000 * 7).toISOString(),
      nextScheduled: new Date(Date.now() + 86400000).toISOString(),
      enabled: true,
    },
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showWebhooks, setShowWebhooks] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    name: "",
    url: "",
    events: [] as string[],
  });

  // Cross-browser sync
  const { data: syncedData, isLoading: syncLoading } = useCrossBrowserSync({
    syncConfig: {
      storageKey: "peptok_analytics_settings",
      cookieKey: "peptok_analytics",
      broadcastChannel: "peptok_analytics_sync",
      syncInterval: 6000,
    },
  });

  const availableMetrics = [
    // Technical/Platform Metrics
    "user_registrations",
    "session_duration",
    "page_views",
    "conversion_rate",
    "revenue",
    "error_rate",
    "bounce_rate",
    "api_calls",
    "load_time",
    "active_users",
    "churn_rate",
    // Coaching Program Metrics (synchronized with CoachingRequestForm)
    "employee_engagement",
    "performance_ratings",
    "skill_assessments",
    "goal_achievement",
    "team_collaboration",
    "leadership_effectiveness",
    "innovation_metrics",
    "time_to_proficiency",
    "retention_rate",
    "customer_satisfaction",
  ];

  const availableEvents = [
    "user_registered",
    "session_started",
    "payment_completed",
    "error_occurred",
    "threshold_exceeded",
    "report_generated",
  ];

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
      const response = await apiEnhanced.getAnalyticsSettings();
      setSettings(response);
    } catch (error) {
      console.error("Failed to load analytics settings:", error);
      toast.error("Failed to load analytics settings");
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

      await apiEnhanced.updateAnalyticsSettings(updatedSettings);
      setSettings(updatedSettings);
      setHasChanges(false);
      toast.success("Analytics settings saved successfully");
    } catch (error) {
      console.error("Failed to save analytics settings:", error);
      toast.error("Failed to save analytics settings");
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof AnalyticsSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const toggleMetric = (metric: string) => {
    const currentMetrics = settings.enabledMetrics;
    if (currentMetrics.includes(metric)) {
      updateSetting(
        "enabledMetrics",
        currentMetrics.filter((m) => m !== metric),
      );
    } else {
      updateSetting("enabledMetrics", [...currentMetrics, metric]);
    }
  };

  const addWebhook = () => {
    if (newWebhook.name && newWebhook.url && newWebhook.events.length > 0) {
      const webhook: WebhookEndpoint = {
        id: Date.now().toString(),
        name: newWebhook.name,
        url: newWebhook.url,
        events: newWebhook.events,
        enabled: true,
        secret: Math.random().toString(36).substring(2, 15),
      };

      updateSetting("webhookEndpoints", [
        ...settings.webhookEndpoints,
        webhook,
      ]);
      setNewWebhook({ name: "", url: "", events: [] });
      toast.success("Webhook endpoint added");
    }
  };

  const removeWebhook = (webhookId: string) => {
    updateSetting(
      "webhookEndpoints",
      settings.webhookEndpoints.filter((w) => w.id !== webhookId),
    );
    toast.success("Webhook endpoint removed");
  };

  const generateReport = async (reportId: string) => {
    try {
      await apiEnhanced.generateAnalyticsReport(reportId);
      toast.success("Report generation started");
    } catch (error) {
      toast.error("Failed to generate report");
    }
  };

  const testWebhook = async (webhookId: string) => {
    try {
      await apiEnhanced.testWebhook(webhookId);
      toast.success("Test webhook sent successfully");
    } catch (error) {
      toast.error("Failed to send test webhook");
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
                <BarChart3 className="w-8 h-8 text-green-600" />
                Analytics Settings
              </h1>
              <p className="text-gray-600">Configure analytics and reporting</p>
            </div>
            <div className="flex gap-3">
              <Dialog open={showReports} onOpenChange={setShowReports}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Reports
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Analytics Reports</DialogTitle>
                    <DialogDescription>
                      Scheduled and on-demand reports
                    </DialogDescription>
                  </DialogHeader>
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Report Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Frequency</TableHead>
                          <TableHead>Format</TableHead>
                          <TableHead>Last Generated</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reports.map((report) => (
                          <TableRow key={report.id}>
                            <TableCell className="font-medium">
                              {report.name}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{report.type}</Badge>
                            </TableCell>
                            <TableCell>{report.frequency}</TableCell>
                            <TableCell className="uppercase">
                              {report.format}
                            </TableCell>
                            <TableCell className="text-sm">
                              {report.lastGenerated
                                ? new Date(
                                    report.lastGenerated,
                                  ).toLocaleDateString()
                                : "Never"}
                            </TableCell>
                            <TableCell>
                              {report.enabled ? (
                                <Badge className="bg-green-100 text-green-800">
                                  Active
                                </Badge>
                              ) : (
                                <Badge className="bg-gray-100 text-gray-800">
                                  Disabled
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => generateReport(report.id)}
                              >
                                Generate
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showWebhooks} onOpenChange={setShowWebhooks}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Globe className="w-4 h-4 mr-2" />
                    Webhooks
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Webhook Endpoints</DialogTitle>
                    <DialogDescription>
                      Configure webhook integrations
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Add new webhook */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Add New Webhook
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Name</Label>
                            <Input
                              value={newWebhook.name}
                              onChange={(e) =>
                                setNewWebhook({
                                  ...newWebhook,
                                  name: e.target.value,
                                })
                              }
                              placeholder="Webhook name"
                            />
                          </div>
                          <div>
                            <Label>URL</Label>
                            <Input
                              value={newWebhook.url}
                              onChange={(e) =>
                                setNewWebhook({
                                  ...newWebhook,
                                  url: e.target.value,
                                })
                              }
                              placeholder="https://api.example.com/webhook"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Events</Label>
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            {availableEvents.map((event) => (
                              <div
                                key={event}
                                className="flex items-center space-x-2"
                              >
                                <input
                                  type="checkbox"
                                  id={event}
                                  checked={newWebhook.events.includes(event)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setNewWebhook({
                                        ...newWebhook,
                                        events: [...newWebhook.events, event],
                                      });
                                    } else {
                                      setNewWebhook({
                                        ...newWebhook,
                                        events: newWebhook.events.filter(
                                          (ev) => ev !== event,
                                        ),
                                      });
                                    }
                                  }}
                                />
                                <Label htmlFor={event} className="text-sm">
                                  {event.replace("_", " ")}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                        <Button onClick={addWebhook}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Webhook
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Existing webhooks */}
                    <div className="max-h-64 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>URL</TableHead>
                            <TableHead>Events</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {settings.webhookEndpoints.map((webhook) => (
                            <TableRow key={webhook.id}>
                              <TableCell className="font-medium">
                                {webhook.name}
                              </TableCell>
                              <TableCell className="text-sm font-mono">
                                {webhook.url}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {webhook.events.slice(0, 2).map((event) => (
                                    <Badge
                                      key={event}
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {event}
                                    </Badge>
                                  ))}
                                  {webhook.events.length > 2 && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      +{webhook.events.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {webhook.enabled ? (
                                  <Badge className="bg-green-100 text-green-800">
                                    Active
                                  </Badge>
                                ) : (
                                  <Badge className="bg-gray-100 text-gray-800">
                                    Disabled
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => testWebhook(webhook.id)}
                                  >
                                    Test
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => removeWebhook(webhook.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
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
            {/* Data Collection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Data Collection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enableUserTracking">User Tracking</Label>
                    <Switch
                      id="enableUserTracking"
                      checked={settings.enableUserTracking}
                      onCheckedChange={(checked) =>
                        updateSetting("enableUserTracking", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="enableSessionTracking">
                      Session Tracking
                    </Label>
                    <Switch
                      id="enableSessionTracking"
                      checked={settings.enableSessionTracking}
                      onCheckedChange={(checked) =>
                        updateSetting("enableSessionTracking", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="enablePerformanceTracking">
                      Performance Tracking
                    </Label>
                    <Switch
                      id="enablePerformanceTracking"
                      checked={settings.enablePerformanceTracking}
                      onCheckedChange={(checked) =>
                        updateSetting("enablePerformanceTracking", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="enableErrorTracking">Error Tracking</Label>
                    <Switch
                      id="enableErrorTracking"
                      checked={settings.enableErrorTracking}
                      onCheckedChange={(checked) =>
                        updateSetting("enableErrorTracking", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="enableCustomEvents">Custom Events</Label>
                    <Switch
                      id="enableCustomEvents"
                      checked={settings.enableCustomEvents}
                      onCheckedChange={(checked) =>
                        updateSetting("enableCustomEvents", checked)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Retention */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Data Retention
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="rawDataRetention">
                    Raw Data Retention (days)
                  </Label>
                  <Input
                    id="rawDataRetention"
                    type="number"
                    min="1"
                    max="3650"
                    value={settings.rawDataRetentionDays}
                    onChange={(e) =>
                      updateSetting(
                        "rawDataRetentionDays",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="aggregatedDataRetention">
                    Aggregated Data Retention (days)
                  </Label>
                  <Input
                    id="aggregatedDataRetention"
                    type="number"
                    min="1"
                    max="3650"
                    value={settings.aggregatedDataRetentionDays}
                    onChange={(e) =>
                      updateSetting(
                        "aggregatedDataRetentionDays",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="logDataRetention">
                    Log Data Retention (days)
                  </Label>
                  <Input
                    id="logDataRetention"
                    type="number"
                    min="1"
                    max="365"
                    value={settings.logDataRetentionDays}
                    onChange={(e) =>
                      updateSetting(
                        "logDataRetentionDays",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Privacy & Compliance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Privacy & Compliance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="anonymizeUserData">
                      Anonymize User Data
                    </Label>
                    <Switch
                      id="anonymizeUserData"
                      checked={settings.anonymizeUserData}
                      onCheckedChange={(checked) =>
                        updateSetting("anonymizeUserData", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="respectDoNotTrack">
                      Respect Do Not Track
                    </Label>
                    <Switch
                      id="respectDoNotTrack"
                      checked={settings.respectDoNotTrack}
                      onCheckedChange={(checked) =>
                        updateSetting("respectDoNotTrack", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="enableGDPRMode">Enable GDPR Mode</Label>
                    <Switch
                      id="enableGDPRMode"
                      checked={settings.enableGDPRMode}
                      onCheckedChange={(checked) =>
                        updateSetting("enableGDPRMode", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="dataProcessingConsent">
                      Require Data Processing Consent
                    </Label>
                    <Switch
                      id="dataProcessingConsent"
                      checked={settings.dataProcessingConsent}
                      onCheckedChange={(checked) =>
                        updateSetting("dataProcessingConsent", checked)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reporting Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Reporting Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="defaultTimeZone">Default Time Zone</Label>
                  <Select
                    value={settings.defaultTimeZone}
                    onValueChange={(value) =>
                      updateSetting("defaultTimeZone", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">
                        Eastern Time
                      </SelectItem>
                      <SelectItem value="America/Chicago">
                        Central Time
                      </SelectItem>
                      <SelectItem value="America/Denver">
                        Mountain Time
                      </SelectItem>
                      <SelectItem value="America/Los_Angeles">
                        Pacific Time
                      </SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Europe/Paris">Paris</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="defaultDateRange">Default Date Range</Label>
                  <Select
                    value={settings.defaultDateRange}
                    onValueChange={(value) =>
                      updateSetting("defaultDateRange", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                      <SelectItem value="90d">Last 90 days</SelectItem>
                      <SelectItem value="1y">Last year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="autoRefreshInterval">
                    Auto Refresh Interval (seconds)
                  </Label>
                  <Input
                    id="autoRefreshInterval"
                    type="number"
                    min="30"
                    max="3600"
                    value={settings.autoRefreshInterval}
                    onChange={(e) =>
                      updateSetting(
                        "autoRefreshInterval",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="enableRealTimeUpdates">
                    Enable Real-time Updates
                  </Label>
                  <Switch
                    id="enableRealTimeUpdates"
                    checked={settings.enableRealTimeUpdates}
                    onCheckedChange={(checked) =>
                      updateSetting("enableRealTimeUpdates", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Enabled Metrics */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Enabled Metrics
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  Metrics selected here will be available for tracking in
                  coaching programs
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {availableMetrics.map((metric) => (
                    <div
                      key={metric}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        settings.enabledMetrics.includes(metric)
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => toggleMetric(metric)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {metric
                            .replace("_", " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </span>
                        {settings.enabledMetrics.includes(metric) && (
                          <CheckCircle className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                    </div>
                  ))}
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
