import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Calendar,
  Star,
  Download,
  RefreshCw,
  BarChart3,
  Globe,
  Smartphone,
  Monitor,
} from "lucide-react";
import { toast } from "sonner";
import {
  analyticsDashboardService,
  LandingPageMetrics,
  CoachDashboardMetrics,
  EnterpriseDashboardMetrics,
} from "@/services/analyticsDashboardService";
import { useAuth } from "@/contexts/AuthContext";

interface EnhancedAnalyticsDashboardProps {
  dashboardType: "landing" | "coach" | "enterprise";
  targetId?: string; // Coach ID or Company ID
}

export const EnhancedAnalyticsDashboard: React.FC<
  EnhancedAnalyticsDashboardProps
> = ({ dashboardType, targetId }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState("30d");

  // State for different dashboard types
  const [landingMetrics, setLandingMetrics] = useState<LandingPageMetrics>();
  const [coachMetrics, setCoachMetrics] = useState<CoachDashboardMetrics>();
  const [enterpriseMetrics, setEnterpriseMetrics] =
    useState<EnterpriseDashboardMetrics>();

  useEffect(() => {
    loadDashboardData();
  }, [dashboardType, targetId, selectedTimeRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      switch (dashboardType) {
        case "landing":
          const landingData =
            await analyticsDashboardService.getLandingPageMetrics();
          setLandingMetrics(landingData);
          break;

        case "coach":
          if (targetId) {
            const coachData =
              await analyticsDashboardService.getCoachDashboardMetrics(
                targetId,
              );
            setCoachMetrics(coachData);
          } else if (user?.userType === "coach") {
            const coachData =
              await analyticsDashboardService.getCoachDashboardMetrics(user.id);
            setCoachMetrics(coachData);
          }
          break;

        case "enterprise":
          if (targetId) {
            const enterpriseData =
              await analyticsDashboardService.getEnterpriseDashboardMetrics(
                targetId,
              );
            setEnterpriseMetrics(enterpriseData);
          } else if (user?.companyId) {
            const enterpriseData =
              await analyticsDashboardService.getEnterpriseDashboardMetrics(
                user.companyId,
              );
            setEnterpriseMetrics(enterpriseData);
          }
          break;
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: "csv" | "xlsx" | "pdf") => {
    setExporting(true);
    try {
      const blob = await analyticsDashboardService.exportData(
        dashboardType,
        targetId,
        format,
      );

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${dashboardType}-analytics.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success(`Analytics exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error("Failed to export analytics:", error);
      toast.error("Export functionality not available");
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatPercentage = (value: number, decimals: number = 1) => {
    return `${value.toFixed(decimals)}%`;
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin mr-3" />
          <span className="text-lg">Loading analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {dashboardType === "landing" && "Landing Page Analytics"}
            {dashboardType === "coach" && "Coach Performance Dashboard"}
            {dashboardType === "enterprise" && "Enterprise Analytics"}
          </h1>
          <p className="text-gray-600">
            {dashboardType === "landing" &&
              "Track visitor behavior and conversion metrics"}
            {dashboardType === "coach" &&
              "Monitor your coaching performance and earnings"}
            {dashboardType === "enterprise" &&
              "Analyze program adoption and employee engagement"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>

          <Button variant="outline" onClick={loadDashboardData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>

          <Button
            variant="outline"
            onClick={() => handleExport("csv")}
            disabled={exporting}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Landing Page Dashboard */}
      {dashboardType === "landing" && landingMetrics && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Visitors
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {landingMetrics.totalVisitors.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  +12.3% from last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Signups</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {landingMetrics.signups.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  +8.7% conversion improvement
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Conversion Rate
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercentage(landingMetrics.conversionRate)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Industry avg: 2.1%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Bounce Rate
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercentage(landingMetrics.bounceRate)}
                </div>
                <p className="text-xs text-muted-foreground">
                  -5.2% improvement
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Traffic Sources */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Traffic Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {landingMetrics.topReferrers.map((source, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <span className="font-medium">{source.source}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {source.visits.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatPercentage(source.conversionRate)} conv.
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Device Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {landingMetrics.deviceBreakdown.map((device, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        {device.device === "Desktop" && (
                          <Monitor className="w-4 h-4" />
                        )}
                        {device.device === "Mobile" && (
                          <Smartphone className="w-4 h-4" />
                        )}
                        {device.device === "Tablet" && (
                          <Globe className="w-4 h-4" />
                        )}
                        <span>{device.device}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${device.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {formatPercentage(device.percentage, 0)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Coach Dashboard */}
      {dashboardType === "coach" && coachMetrics && (
        <div className="space-y-6">
          {/* Coach Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Sessions Completed
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {coachMetrics.sessionsCompleted}
                </div>
                <p className="text-xs text-muted-foreground">
                  {coachMetrics.totalSessionHours} total hours
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Revenue Earned
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(coachMetrics.revenueEarned)}
                </div>
                <p className="text-xs text-muted-foreground">
                  +23.4% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Average Rating
                </CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-1">
                  {coachMetrics.averageRating.toFixed(1)}
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                </div>
                <p className="text-xs text-muted-foreground">
                  {coachMetrics.totalReviews} reviews
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Clients
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {coachMetrics.activeClients}
                </div>
                <p className="text-xs text-muted-foreground">
                  {coachMetrics.completedPrograms} programs completed
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Next Session & Recent Feedback */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {coachMetrics.nextSession && (
              <Card>
                <CardHeader>
                  <CardTitle>Next Scheduled Session</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="font-medium">
                      {coachMetrics.nextSession.title}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {new Intl.DateTimeFormat("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      }).format(coachMetrics.nextSession.scheduledTime)}
                    </p>
                    <Badge variant="outline">
                      {coachMetrics.nextSession.participantCount} participants
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Recent Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {coachMetrics.recentFeedback
                    .slice(0, 3)
                    .map((feedback, index) => (
                      <div
                        key={index}
                        className="border-b pb-2 last:border-b-0"
                      >
                        <div className="flex items-center gap-1 mb-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < feedback.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                          <span className="text-sm text-gray-500 ml-2">
                            {feedback.clientName}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {feedback.comment}
                        </p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Enterprise Dashboard */}
      {dashboardType === "enterprise" && enterpriseMetrics && (
        <div className="space-y-6">
          {/* Program Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Program Adoption
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercentage(
                    enterpriseMetrics.programAdoption.adoptionRate,
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {enterpriseMetrics.programAdoption.activePrograms}/
                  {enterpriseMetrics.programAdoption.totalPrograms} programs
                  active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Employee Engagement
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercentage(
                    enterpriseMetrics.employeeUsage.engagementRate,
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {enterpriseMetrics.employeeUsage.activeEmployees}/
                  {enterpriseMetrics.employeeUsage.totalEmployees} employees
                  active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Session Completion
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercentage(
                    enterpriseMetrics.sessionMetrics.completionRate,
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {enterpriseMetrics.sessionMetrics.sessionsCompleted}/
                  {enterpriseMetrics.sessionMetrics.totalSessionsBooked}{" "}
                  sessions completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ROI</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercentage(
                    enterpriseMetrics.costAnalysis.estimatedROI,
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(
                    enterpriseMetrics.costAnalysis.totalInvestment,
                  )}{" "}
                  invested
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Program Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Program Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {enterpriseMetrics.trends.programPerformance.map(
                  (program, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium">{program.programName}</h4>
                        <p className="text-sm text-gray-600">
                          {program.participants} participants
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatPercentage(program.completionRate)} completion
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">
                            {program.satisfaction.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </CardContent>
          </Card>

          {/* Employee Feedback */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {enterpriseMetrics.feedback.topBenefits.map(
                    (benefit, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm">{benefit.benefit}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${benefit.percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {benefit.percentage}%
                          </span>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Areas for Improvement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {enterpriseMetrics.feedback.improvementAreas.map(
                    (area, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm">{area.area}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-orange-500 h-2 rounded-full"
                              style={{ width: `${area.percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {area.percentage}%
                          </span>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
