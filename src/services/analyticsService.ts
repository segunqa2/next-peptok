import { analytics } from "./analytics";
import { crossBrowserSync, SYNC_CONFIGS } from "./crossBrowserSync";
// Removed: cacheInvalidation service (deleted)

interface AnalyticsSettings {
  enableUserTracking: boolean;
  enableSessionTracking: boolean;
  enablePerformanceTracking: boolean;
  enableErrorTracking: boolean;
  enableCustomEvents: boolean;
  rawDataRetentionDays: number;
  aggregatedDataRetentionDays: number;
  logDataRetentionDays: number;
  anonymizeUserData: boolean;
  respectDoNotTrack: boolean;
  enableGDPRMode: boolean;
  dataProcessingConsent: boolean;
  defaultTimeZone: string;
  defaultDateRange: string;
  autoRefreshInterval: number;
  enableRealTimeUpdates: boolean;
  enabledMetrics: string[];
  customDashboards: CustomDashboard[];
  enableDataExport: boolean;
  exportFormats: string[];
  webhookEndpoints: WebhookEndpoint[];
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

interface MetricData {
  metric: string;
  value: number;
  timestamp: string;
  dimensions?: Record<string, any>;
}

interface AggregatedMetric {
  metric: string;
  period: "hour" | "day" | "week" | "month";
  timestamp: string;
  value: number;
  previousValue?: number;
  changePercent?: number;
}

class AnalyticsService {
  private static instance: AnalyticsService;
  private settings: AnalyticsSettings | null = null;
  private metricData: MetricData[] = [];
  private aggregatedData: AggregatedMetric[] = [];
  private reports: AnalyticsReport[] = [];

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  // Settings Management
  async getAnalyticsSettings(): Promise<AnalyticsSettings> {
    try {
      // Try to get from cross-browser sync first
      const syncedData = crossBrowserSync.get(SYNC_CONFIGS.ANALYTICS_SETTINGS);
      if (syncedData) {
        this.settings = syncedData;
        return syncedData;
      }

      // Fallback to localStorage or default
      const stored = localStorage.getItem("peptok_analytics_settings");
      if (stored) {
        this.settings = JSON.parse(stored);
        return this.settings;
      }

      // Return default settings
      const defaultSettings: AnalyticsSettings = {
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
      };

      this.settings = defaultSettings;
      return defaultSettings;
    } catch (error) {
      console.error("Failed to get analytics settings:", error);
      throw error;
    }
  }

  async updateAnalyticsSettings(settings: AnalyticsSettings): Promise<void> {
    try {
      // Update timestamp
      settings.lastUpdated = new Date().toISOString();

      // Save to localStorage
      localStorage.setItem(
        "peptok_analytics_settings",
        JSON.stringify(settings),
      );

      // Sync across browsers
      crossBrowserSync.save(SYNC_CONFIGS.ANALYTICS_SETTINGS, settings, {
        id: "platform_admin",
        name: "Platform Admin",
      });

      // Note: Cache invalidation removed for simplification

      // Update instance
      this.settings = settings;

      // Track analytics about analytics settings (meta!)
      analytics.track("analytics_settings_updated", {
        settingsCount: Object.keys(settings).length,
        trackingEnabled: settings.enableUserTracking,
        gdprMode: settings.enableGDPRMode,
        enabledMetricsCount: settings.enabledMetrics.length,
        customDashboardsCount: settings.customDashboards.length,
      });
    } catch (error) {
      console.error("Failed to update analytics settings:", error);
      throw error;
    }
  }

  // Data Collection
  trackMetric(
    metric: string,
    value: number,
    dimensions?: Record<string, any>,
  ): void {
    if (!this.settings || !this.settings.enabledMetrics.includes(metric)) {
      return;
    }

    // Check if tracking is enabled
    if (!this.canTrack()) {
      return;
    }

    const metricData: MetricData = {
      metric,
      value,
      timestamp: new Date().toISOString(),
      dimensions: this.settings.anonymizeUserData
        ? this.anonymizeDimensions(dimensions)
        : dimensions,
    };

    this.metricData.push(metricData);
    this.checkDataRetention();

    // Store in localStorage
    localStorage.setItem("peptok_metric_data", JSON.stringify(this.metricData));

    // Check alert thresholds
    this.checkAlertThresholds(metric, value);

    // Trigger webhooks if configured
    this.triggerWebhooks("metric_tracked", { metric, value, dimensions });
  }

  // Data Aggregation
  async aggregateMetrics(
    period: "hour" | "day" | "week" | "month",
  ): Promise<void> {
    if (!this.settings) return;

    const now = new Date();
    const groupedData = this.groupMetricsByPeriod(this.metricData, period);

    for (const [key, metrics] of Object.entries(groupedData)) {
      const [metric, periodStart] = key.split("|");

      // Calculate aggregated value (sum, average, etc. based on metric type)
      const values = metrics.map((m) => m.value);
      const aggregatedValue = this.calculateAggregatedValue(metric, values);

      // Get previous period value for comparison
      const previousPeriodValue = this.getPreviousPeriodValue(
        metric,
        period,
        new Date(periodStart),
      );
      const changePercent = previousPeriodValue
        ? ((aggregatedValue - previousPeriodValue) / previousPeriodValue) * 100
        : undefined;

      const aggregatedMetric: AggregatedMetric = {
        metric,
        period,
        timestamp: periodStart,
        value: aggregatedValue,
        previousValue: previousPeriodValue,
        changePercent,
      };

      // Update or add aggregated data
      const existingIndex = this.aggregatedData.findIndex(
        (a) =>
          a.metric === metric &&
          a.period === period &&
          a.timestamp === periodStart,
      );

      if (existingIndex !== -1) {
        this.aggregatedData[existingIndex] = aggregatedMetric;
      } else {
        this.aggregatedData.push(aggregatedMetric);
      }
    }

    // Apply retention policy
    this.applyRetentionPolicy();

    // Store in localStorage
    localStorage.setItem(
      "peptok_aggregated_data",
      JSON.stringify(this.aggregatedData),
    );
  }

  // Dashboard Management
  createCustomDashboard(dashboard: Omit<CustomDashboard, "id">): string {
    if (!this.settings) throw new Error("Analytics settings not loaded");

    const newDashboard: CustomDashboard = {
      id: Date.now().toString(),
      ...dashboard,
    };

    this.settings.customDashboards.push(newDashboard);
    this.updateAnalyticsSettings(this.settings);

    return newDashboard.id;
  }

  updateCustomDashboard(
    dashboardId: string,
    updates: Partial<CustomDashboard>,
  ): void {
    if (!this.settings) throw new Error("Analytics settings not loaded");

    const dashboardIndex = this.settings.customDashboards.findIndex(
      (d) => d.id === dashboardId,
    );
    if (dashboardIndex !== -1) {
      this.settings.customDashboards[dashboardIndex] = {
        ...this.settings.customDashboards[dashboardIndex],
        ...updates,
      };
      this.updateAnalyticsSettings(this.settings);
    }
  }

  deleteCustomDashboard(dashboardId: string): void {
    if (!this.settings) throw new Error("Analytics settings not loaded");

    this.settings.customDashboards = this.settings.customDashboards.filter(
      (d) => d.id !== dashboardId,
    );
    this.updateAnalyticsSettings(this.settings);
  }

  // Report Generation
  async generateReport(reportId: string): Promise<void> {
    const report = this.reports.find((r) => r.id === reportId);
    if (!report) throw new Error("Report not found");

    // Generate report data
    const reportData = this.getReportData(report.metrics, report.format);

    // In a real application, this would generate and send the report
    console.log("Generating report:", report.name, reportData);

    // Update last generated timestamp
    const reportIndex = this.reports.findIndex((r) => r.id === reportId);
    if (reportIndex !== -1) {
      this.reports[reportIndex].lastGenerated = new Date().toISOString();
      localStorage.setItem(
        "peptok_analytics_reports",
        JSON.stringify(this.reports),
      );
    }

    // Track report generation
    analytics.track("analytics_report_generated", {
      reportId,
      reportName: report.name,
      format: report.format,
      metricsCount: report.metrics.length,
    });
  }

  // Webhook Management
  async testWebhook(webhookId: string): Promise<void> {
    if (!this.settings) throw new Error("Analytics settings not loaded");

    const webhook = this.settings.webhookEndpoints.find(
      (w) => w.id === webhookId,
    );
    if (!webhook) throw new Error("Webhook not found");

    const testPayload = {
      event: "webhook_test",
      timestamp: new Date().toISOString(),
      data: {
        webhookId,
        webhookName: webhook.name,
        test: true,
      },
    };

    // In a real application, this would make an HTTP request
    console.log("Testing webhook:", webhook.url, testPayload);

    // Track webhook test
    analytics.track("webhook_tested", {
      webhookId,
      webhookName: webhook.name,
      url: webhook.url,
    });
  }

  // Data Export
  async exportData(
    metrics: string[],
    format: "csv" | "json" | "pdf",
    dateRange: { start: Date; end: Date },
  ): Promise<string> {
    if (!this.settings?.enableDataExport) {
      throw new Error("Data export is disabled");
    }

    if (!this.settings.exportFormats.includes(format)) {
      throw new Error(`Export format ${format} is not enabled`);
    }

    // Filter data by date range and metrics
    const filteredData = this.metricData.filter((data) => {
      const timestamp = new Date(data.timestamp);
      return (
        timestamp >= dateRange.start &&
        timestamp <= dateRange.end &&
        metrics.includes(data.metric)
      );
    });

    // Convert to requested format
    let exportData: string;
    switch (format) {
      case "csv":
        exportData = this.convertToCSV(filteredData);
        break;
      case "json":
        exportData = JSON.stringify(filteredData, null, 2);
        break;
      case "pdf":
        exportData = this.convertToPDF(filteredData);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    // Track export
    analytics.track("analytics_data_exported", {
      format,
      metricsCount: metrics.length,
      recordCount: filteredData.length,
      dateRange: {
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString(),
      },
    });

    return exportData;
  }

  // Private Helper Methods
  private canTrack(): boolean {
    if (!this.settings) return false;

    // Check Do Not Track
    if (this.settings.respectDoNotTrack && navigator.doNotTrack === "1") {
      return false;
    }

    // Check GDPR consent
    if (this.settings.enableGDPRMode && !this.settings.dataProcessingConsent) {
      return false;
    }

    return true;
  }

  private anonymizeDimensions(
    dimensions?: Record<string, any>,
  ): Record<string, any> | undefined {
    if (!dimensions) return dimensions;

    const anonymized = { ...dimensions };

    // Remove or hash sensitive fields
    if (anonymized.userId) {
      anonymized.userId = this.hashValue(anonymized.userId);
    }
    if (anonymized.email) {
      delete anonymized.email;
    }
    if (anonymized.ipAddress) {
      anonymized.ipAddress = this.anonymizeIP(anonymized.ipAddress);
    }

    return anonymized;
  }

  private hashValue(value: string): string {
    // Simple hash function - in production, use a proper cryptographic hash
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      const char = value.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private anonymizeIP(ip: string): string {
    const parts = ip.split(".");
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }
    return "0.0.0.0";
  }

  private checkDataRetention(): void {
    if (!this.settings) return;

    const now = new Date();
    const retentionDate = new Date();
    retentionDate.setDate(
      retentionDate.getDate() - this.settings.rawDataRetentionDays,
    );

    this.metricData = this.metricData.filter(
      (data) => new Date(data.timestamp) > retentionDate,
    );
  }

  private applyRetentionPolicy(): void {
    if (!this.settings) return;

    const now = new Date();
    const retentionDate = new Date();
    retentionDate.setDate(
      retentionDate.getDate() - this.settings.aggregatedDataRetentionDays,
    );

    this.aggregatedData = this.aggregatedData.filter(
      (data) => new Date(data.timestamp) > retentionDate,
    );
  }

  private groupMetricsByPeriod(
    metrics: MetricData[],
    period: string,
  ): Record<string, MetricData[]> {
    const grouped: Record<string, MetricData[]> = {};

    metrics.forEach((metric) => {
      const periodStart = this.getPeriodStart(
        new Date(metric.timestamp),
        period as any,
      );
      const key = `${metric.metric}|${periodStart.toISOString()}`;

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(metric);
    });

    return grouped;
  }

  private getPeriodStart(
    date: Date,
    period: "hour" | "day" | "week" | "month",
  ): Date {
    const result = new Date(date);

    switch (period) {
      case "hour":
        result.setMinutes(0, 0, 0);
        break;
      case "day":
        result.setHours(0, 0, 0, 0);
        break;
      case "week":
        const dayOfWeek = result.getDay();
        result.setDate(result.getDate() - dayOfWeek);
        result.setHours(0, 0, 0, 0);
        break;
      case "month":
        result.setDate(1);
        result.setHours(0, 0, 0, 0);
        break;
    }

    return result;
  }

  private calculateAggregatedValue(metric: string, values: number[]): number {
    // Different aggregation methods based on metric type
    switch (metric) {
      case "error_rate":
      case "conversion_rate":
      case "bounce_rate":
        return values.reduce((sum, val) => sum + val, 0) / values.length; // Average
      case "revenue":
      case "user_registrations":
      case "page_views":
        return values.reduce((sum, val) => sum + val, 0); // Sum
      case "session_duration":
      case "load_time":
        return values.reduce((sum, val) => sum + val, 0) / values.length; // Average
      default:
        return values.reduce((sum, val) => sum + val, 0); // Default to sum
    }
  }

  private getPreviousPeriodValue(
    metric: string,
    period: string,
    currentPeriodStart: Date,
  ): number | undefined {
    const previousPeriodStart = new Date(currentPeriodStart);

    switch (period) {
      case "hour":
        previousPeriodStart.setHours(previousPeriodStart.getHours() - 1);
        break;
      case "day":
        previousPeriodStart.setDate(previousPeriodStart.getDate() - 1);
        break;
      case "week":
        previousPeriodStart.setDate(previousPeriodStart.getDate() - 7);
        break;
      case "month":
        previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1);
        break;
    }

    const previousData = this.aggregatedData.find(
      (a) =>
        a.metric === metric &&
        a.period === period &&
        a.timestamp === previousPeriodStart.toISOString(),
    );

    return previousData?.value;
  }

  private checkAlertThresholds(metric: string, value: number): void {
    if (!this.settings?.enableAlerts) return;

    const thresholds = this.settings.alertThresholds.filter(
      (t) => t.enabled && t.metric === metric,
    );

    thresholds.forEach((threshold) => {
      let triggered = false;

      switch (threshold.operator) {
        case ">":
          triggered = value > threshold.value;
          break;
        case "<":
          triggered = value < threshold.value;
          break;
        case "=":
          triggered = value === threshold.value;
          break;
        case ">=":
          triggered = value >= threshold.value;
          break;
        case "<=":
          triggered = value <= threshold.value;
          break;
      }

      if (triggered) {
        this.triggerAlert(threshold, value);
      }
    });
  }

  private triggerAlert(threshold: AlertThreshold, currentValue: number): void {
    const alert = {
      thresholdId: threshold.id,
      metric: threshold.metric,
      severity: threshold.severity,
      threshold: threshold.value,
      currentValue,
      timestamp: new Date().toISOString(),
    };

    // Track alert
    analytics.track("analytics_alert_triggered", alert);

    // Trigger webhooks
    this.triggerWebhooks("alert_triggered", alert);

    console.warn("Analytics alert triggered:", alert);
  }

  private triggerWebhooks(event: string, data: any): void {
    if (!this.settings) return;

    const relevantWebhooks = this.settings.webhookEndpoints.filter(
      (w) => w.enabled && w.events.includes(event),
    );

    relevantWebhooks.forEach((webhook) => {
      const payload = {
        event,
        timestamp: new Date().toISOString(),
        data,
        webhook: {
          id: webhook.id,
          name: webhook.name,
        },
      };

      // In a real application, make HTTP request to webhook.url
      console.log("Triggering webhook:", webhook.url, payload);
    });
  }

  private getReportData(metrics: string[], format: string): any {
    const data = this.aggregatedData.filter((a) => metrics.includes(a.metric));

    // Group by metric
    const grouped = data.reduce(
      (acc, item) => {
        if (!acc[item.metric]) {
          acc[item.metric] = [];
        }
        acc[item.metric].push(item);
        return acc;
      },
      {} as Record<string, AggregatedMetric[]>,
    );

    return grouped;
  }

  private convertToCSV(data: MetricData[]): string {
    if (data.length === 0) return "";

    const headers = ["metric", "value", "timestamp", "dimensions"];
    const rows = data.map((item) => [
      item.metric,
      item.value.toString(),
      item.timestamp,
      JSON.stringify(item.dimensions || {}),
    ]);

    return [headers, ...rows].map((row) => row.join(",")).join("\n");
  }

  private convertToPDF(data: MetricData[]): string {
    // In a real application, generate actual PDF
    return `PDF Report\n\nGenerated: ${new Date().toISOString()}\nRecords: ${data.length}`;
  }
}

export const analyticsService = AnalyticsService.getInstance();
