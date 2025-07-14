import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Star,
  Calendar,
} from "lucide-react";
import { MetricDefinition, DashboardStats } from "@/types";

interface MetricsOverviewProps {
  metrics?: MetricDefinition[];
  stats?: DashboardStats;
}

const MetricsOverview = ({ metrics = [], stats }: MetricsOverviewProps) => {
  // Default metrics data if none provided
  const defaultMetrics: MetricDefinition[] = [
    {
      id: "engagement",
      name: "Employee Engagement",
      description: "Overall engagement score across the organization",
      targetValue: 85,
      currentValue: 78,
      unit: "%",
      category: "engagement",
    },
    {
      id: "skill_dev",
      name: "Skill Development",
      description: "Average skill improvement across all programs",
      targetValue: 90,
      currentValue: 82,
      unit: "%",
      category: "skill_development",
    },
    {
      id: "retention",
      name: "Retention Rate",
      description: "Employee retention rate with coaching programs",
      targetValue: 95,
      currentValue: 89,
      unit: "%",
      category: "retention",
    },
    {
      id: "performance",
      name: "Performance Rating",
      description: "Average performance rating improvement",
      targetValue: 4.5,
      currentValue: 4.2,
      unit: "/5",
      category: "performance",
    },
  ];

  const metricsData = metrics.length > 0 ? metrics : defaultMetrics;

  const getMetricIcon = (category: MetricDefinition["category"]) => {
    switch (category) {
      case "engagement":
        return Users;
      case "skill_development":
        return Target;
      case "performance":
        return Star;
      case "retention":
        return Calendar;
      default:
        return TrendingUp;
    }
  };

  const getProgressColor = (current: number, target: number) => {
    const percentage = (current / target) * 100;
    if (percentage >= 90) return "bg-green-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  const isOnTrack = (current: number, target: number) => {
    return current >= target * 0.9;
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {metricsData.map((metric) => {
          const Icon = getMetricIcon(metric.category);
          const progress = (metric.currentValue / metric.targetValue) * 100;
          const onTrack = isOnTrack(metric.currentValue, metric.targetValue);

          return (
            <Card key={metric.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">{metric.name}</p>
                </div>
                {onTrack ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-baseline space-x-1">
                    <span className="text-2xl font-bold">
                      {metric.currentValue}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {metric.unit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Target: {metric.targetValue}
                      {metric.unit}
                    </span>
                    <Badge variant={onTrack ? "default" : "destructive"}>
                      {progress.toFixed(0)}%
                    </Badge>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Placeholder for charts */}
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Performance analytics and trend charts will be displayed here
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Track coaching program effectiveness over time
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Placeholder for department analytics */}
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Department-wise analytics and comparisons will be displayed
                  here
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Compare engagement across different teams
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Filters and Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Time Period
              </label>
              <select className="w-full p-2 border rounded-md">
                <option>Last 30 days</option>
                <option>Last 3 months</option>
                <option>Last 6 months</option>
                <option>Last year</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Department
              </label>
              <select className="w-full p-2 border rounded-md">
                <option>All Departments</option>
                <option>Engineering</option>
                <option>Marketing</option>
                <option>Sales</option>
                <option>Product</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Metric Type
              </label>
              <select className="w-full p-2 border rounded-md">
                <option>All Metrics</option>
                <option>Engagement</option>
                <option>Skill Development</option>
                <option>Performance</option>
                <option>Retention</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MetricsOverview;
