import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import {
  CalendarIcon,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Download,
  Filter,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiEnhanced } from "@/services/apiEnhanced";
import { analytics } from "@/services/analytics";

interface AnalyticsData {
  metric: string;
  data: Array<{
    date: Date;
    value: number;
  }>;
  total: number;
  change?: number;
}

interface MetricCard {
  title: string;
  value: string;
  change: string;
  icon: React.ComponentType<any>;
  color: string;
}

export default function AnalyticsDashboard() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: new Date(),
  });
  const [selectedMetric, setSelectedMetric] = useState("page_views");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [metricCards, setMetricCards] = useState<MetricCard[]>([]);

  // Define available metrics based on user role
  const getAvailableMetrics = () => {
    const baseMetrics = [
      { value: "page_views", label: "Page Views" },
      { value: "user_actions", label: "User Actions" },
      { value: "session_duration", label: "Session Duration" },
    ];

    if (user?.userType === "platform_admin") {
      return [
        ...baseMetrics,
        { value: "user_registrations", label: "User Registrations" },
        { value: "revenue", label: "Revenue" },
        { value: "active_users", label: "Active Users" },
        { value: "company_signups", label: "Company Signups" },
      ];
    }

    if (user?.userType === "company_admin") {
      return [
        ...baseMetrics,
        { value: "employee_engagement", label: "Employee Engagement" },
        { value: "session_completions", label: "Session Completions" },
        { value: "coach_ratings", label: "Coach Ratings" },
      ];
    }

    if (user?.userType === "coach") {
      return [
        { value: "session_completions", label: "Sessions Completed" },
        { value: "client_ratings", label: "Client Ratings" },
        { value: "earnings", label: "Earnings" },
        { value: "profile_views", label: "Profile Views" },
      ];
    }

    return baseMetrics;
  };

  const loadAnalyticsData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const query = {
        metric: selectedMetric,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        groupBy: "day",
      };

      const data = await apiEnhanced.getAnalyticsData(query);
      setAnalyticsData(data);

      // Track analytics usage
      analytics.trackAction({
        action: "analytics_viewed",
        component: "analytics_dashboard",
        metadata: {
          metric: selectedMetric,
          dateRange: `${format(dateRange.startDate, "yyyy-MM-dd")} to ${format(dateRange.endDate, "yyyy-MM-dd")}`,
        },
      });
    } catch (error) {
      console.error("Failed to load analytics data:", error);
      analytics.trackError(
        error instanceof Error ? error : new Error("Analytics load failed"),
        {
          component: "analytics_dashboard",
          metric: selectedMetric,
        },
      );
    } finally {
      setLoading(false);
    }
  };

  const loadMetricCards = async () => {
    if (!user) return;

    try {
      const cards: MetricCard[] = [];

      if (user.userType === "platform_admin") {
        const stats = await apiEnhanced.getPlatformStats();
        cards.push(
          {
            title: "Total Users",
            value: stats.totalUsers.toLocaleString(),
            change: "+12.5%",
            icon: Users,
            color: "text-blue-600",
          },
          {
            title: "Monthly Revenue",
            value: `$${stats.monthlyRevenue.toLocaleString()}`,
            change: "+8.2%",
            icon: DollarSign,
            color: "text-green-600",
          },
          {
            title: "Active Sessions",
            value: stats.totalSessions.toLocaleString(),
            change: "+15.3%",
            icon: Activity,
            color: "text-purple-600",
          },
          {
            title: "Growth Rate",
            value: "12.5%",
            change: "+2.1%",
            icon: TrendingUp,
            color: "text-orange-600",
          },
        );
      } else if (user.userType === "company_admin") {
        const requests = await apiEnhanced.getCompanyRequests();
        const activeRequests = requests.filter(
          (r) => r.status === "in_progress",
        );
        const completedRequests = requests.filter(
          (r) => r.status === "completed",
        );

        cards.push(
          {
            title: "Active Mentorships",
            value: activeRequests.length.toString(),
            change: "+5.2%",
            icon: Activity,
            color: "text-blue-600",
          },
          {
            title: "Completed Sessions",
            value: completedRequests.length.toString(),
            change: "+18.1%",
            icon: Users,
            color: "text-green-600",
          },
          {
            title: "Employee Engagement",
            value: "87%",
            change: "+3.4%",
            icon: TrendingUp,
            color: "text-purple-600",
          },
          {
            title: "Avg. Rating",
            value: "4.8",
            change: "+0.2",
            icon: TrendingUp,
            color: "text-orange-600",
          },
        );
      } else if (user.userType === "coach") {
        const matches = await apiEnhanced.getCoachMatches();
        const activeMatches = matches.filter((m) => m.status === "in_progress");
        const completedMatches = matches.filter(
          (m) => m.status === "completed",
        );

        cards.push(
          {
            title: "Active Clients",
            value: activeMatches.length.toString(),
            change: "+2",
            icon: Users,
            color: "text-blue-600",
          },
          {
            title: "Sessions This Month",
            value: completedMatches.length.toString(),
            change: "+12",
            icon: Activity,
            color: "text-green-600",
          },
          {
            title: "Avg. Rating",
            value: "4.9",
            change: "+0.1",
            icon: TrendingUp,
            color: "text-purple-600",
          },
          {
            title: "Monthly Earnings",
            value: "$2,450",
            change: "+15.2%",
            icon: DollarSign,
            color: "text-orange-600",
          },
        );
      }

      setMetricCards(cards);
    } catch (error) {
      console.error("Failed to load metric cards:", error);
    }
  };

  useEffect(() => {
    loadMetricCards();
  }, [user]);

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedMetric, dateRange, user]);

  const exportData = () => {
    if (!analyticsData) return;

    const csvContent = [
      ["Date", "Value"],
      ...analyticsData.data.map((item) => [
        format(new Date(item.date), "yyyy-MM-dd"),
        item.value.toString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedMetric}_${format(dateRange.startDate, "yyyy-MM-dd")}_to_${format(dateRange.endDate, "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    analytics.trackAction({
      action: "analytics_exported",
      component: "analytics_dashboard",
      metadata: { metric: selectedMetric, format: "csv" },
    });
  };

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">
          Please log in to view analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">
            {user.userType === "platform_admin" &&
              "Platform-wide analytics and insights"}
            {user.userType === "company_admin" &&
              "Company performance and engagement metrics"}
            {user.userType === "coach" &&
              "Your coaching performance and client insights"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={exportData}
            disabled={!analyticsData}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      {metricCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metricCards.map((card, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {card.title}
                    </p>
                    <p className="text-2xl font-bold">{card.value}</p>
                    <p
                      className={`text-sm ${card.change.startsWith("+") ? "text-green-600" : "text-red-600"}`}
                    >
                      {card.change} from last period
                    </p>
                  </div>
                  <card.icon className={`h-8 w-8 ${card.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Metric</label>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableMetrics().map((metric) => (
                    <SelectItem key={metric.value} value={metric.value}>
                      {metric.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Start Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[200px] justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateRange.startDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.startDate}
                    onSelect={(date) =>
                      date && setDateRange({ ...dateRange, startDate: date })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[200px] justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateRange.endDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.endDate}
                    onSelect={(date) =>
                      date && setDateRange({ ...dateRange, endDate: date })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>
            {getAvailableMetrics().find((m) => m.value === selectedMetric)
              ?.label || selectedMetric}
          </CardTitle>
          <CardDescription>
            Data from {format(dateRange.startDate, "MMM d, yyyy")} to{" "}
            {format(dateRange.endDate, "MMM d, yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-muted-foreground">
                Loading analytics data...
              </div>
            </div>
          ) : analyticsData ? (
            <div className="h-64">
              {/* Simple chart representation - in a real app, use a charting library */}
              <div className="h-full flex items-end justify-between gap-1">
                {analyticsData.data.slice(0, 30).map((point, index) => {
                  const maxValue = Math.max(
                    ...analyticsData.data.map((d) => d.value),
                  );
                  const height = (point.value / maxValue) * 100;
                  return (
                    <div
                      key={index}
                      className="bg-primary/20 hover:bg-primary/40 transition-colors min-w-[8px] flex-1 rounded-t"
                      style={{ height: `${height}%` }}
                      title={`${format(new Date(point.date), "MMM d")}: ${point.value}`}
                    />
                  );
                })}
              </div>
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Total: {analyticsData.total.toLocaleString()}
                {analyticsData.change && (
                  <span
                    className={`ml-2 ${analyticsData.change > 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    ({analyticsData.change > 0 ? "+" : ""}
                    {analyticsData.change.toFixed(1)}%)
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <div className="text-muted-foreground">
                No data available for the selected period
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
