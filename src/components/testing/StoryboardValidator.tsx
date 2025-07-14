import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  Clock,
  Play,
  Eye,
  Users,
  Target,
  Calendar,
  MessageCircle,
  BarChart3,
  Settings,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StoryboardStep {
  id: string;
  title: string;
  description: string;
  userRole: "admin" | "coach" | "participant";
  component?: string;
  route?: string;
  duration: number; // seconds
  dependencies?: string[];
}

interface StoryboardScenario {
  id: string;
  title: string;
  description: string;
  category: "onboarding" | "matching" | "session" | "analytics" | "admin";
  priority: "high" | "medium" | "low";
  steps: StoryboardStep[];
  expectedOutcome: string;
}

interface ValidationResult {
  scenarioId: string;
  stepId: string;
  status: "pending" | "running" | "passed" | "failed" | "skipped";
  startTime?: Date;
  endTime?: Date;
  errors?: string[];
  screenshot?: string;
}

const storyboardScenarios: StoryboardScenario[] = [
  {
    id: "admin-onboarding",
    title:
      "Admin Onboarding: Create Program → Set Goals → Assign KPIs → Invite Team",
    description:
      "Complete admin journey from account creation to team invitation",
    category: "admin",
    priority: "high",
    expectedOutcome:
      "Team members receive invitations and can join coaching program",
    steps: [
      {
        id: "create-program",
        title: "Create coaching program",
        description: "Admin creates new coaching program with objectives",
        userRole: "admin",
        component: "CompanyDashboard",
        route: "/company-dashboard",
        duration: 120,
      },
      {
        id: "set-goals",
        title: "Set program goals and objectives",
        description: "Define measurable goals and success criteria",
        userRole: "admin",
        component: "GoalSetting",
        duration: 90,
        dependencies: ["create-program"],
      },
      {
        id: "assign-kpis",
        title: "Assign KPIs and metrics",
        description: "Configure key performance indicators and tracking",
        userRole: "admin",
        component: "AnalyticsSettings",
        route: "/admin/analytics-settings",
        duration: 60,
        dependencies: ["set-goals"],
      },
      {
        id: "invite-team",
        title: "Invite team members",
        description: "Send invitations to team members to join program",
        userRole: "admin",
        component: "TeamManagement",
        duration: 180,
        dependencies: ["assign-kpis"],
      },
    ],
  },
  {
    id: "participant-experience",
    title:
      "Participant Experience: Instant Invite → Join Dashboard → See Progress",
    description:
      "End-to-end participant journey from invitation to progress tracking",
    category: "onboarding",
    priority: "high",
    expectedOutcome: "Participant successfully joins and tracks progress",
    steps: [
      {
        id: "receive-invite",
        title: "Receive coaching invitation",
        description: "Participant receives and opens invitation email/link",
        userRole: "participant",
        component: "PendingInvitations",
        route: "/pending-invitations",
        duration: 30,
      },
      {
        id: "join-dashboard",
        title: "Join coaching dashboard",
        description: "Accept invitation and access participant dashboard",
        userRole: "participant",
        component: "EmployeeDashboard",
        route: "/employee-dashboard",
        duration: 60,
        dependencies: ["receive-invite"],
      },
      {
        id: "view-progress",
        title: "View progress tracking",
        description: "Navigate and understand progress visualization",
        userRole: "participant",
        component: "MentorshipRequestProgress",
        duration: 45,
        dependencies: ["join-dashboard"],
      },
    ],
  },
  {
    id: "matching-engine",
    title: "Matching Engine: Rank Coaches → Display Scores → Confirm Match",
    description: "AI-powered coach matching and selection process",
    category: "matching",
    priority: "high",
    expectedOutcome: "Participant is successfully matched with optimal coach",
    steps: [
      {
        id: "rank-coaches",
        title: "AI ranks available coaches",
        description: "System evaluates and ranks coaches based on criteria",
        userRole: "participant",
        component: "CoachMatching",
        route: "/coach-matching",
        duration: 15,
      },
      {
        id: "display-scores",
        title: "Display match scores",
        description: "Show matching scores and coach recommendations",
        userRole: "participant",
        component: "CoachMatchingFilters",
        duration: 60,
        dependencies: ["rank-coaches"],
      },
      {
        id: "confirm-match",
        title: "Confirm coach match",
        description: "Participant selects and confirms coach match",
        userRole: "participant",
        component: "CoachSelection",
        duration: 45,
        dependencies: ["display-scores"],
      },
    ],
  },
  {
    id: "coach-dashboard",
    title: "Coach Dashboard: View Match → Set Price → Accept Program",
    description: "Coach receives and responds to coaching program invitations",
    category: "matching",
    priority: "high",
    expectedOutcome: "Coach accepts program with agreed pricing terms",
    steps: [
      {
        id: "view-match",
        title: "View match notification",
        description: "Coach receives and reviews program match details",
        userRole: "coach",
        component: "CoachDashboard",
        route: "/coach/dashboard",
        duration: 90,
      },
      {
        id: "set-price",
        title: "Set coaching pricing",
        description: "Coach configures session rates and terms",
        userRole: "coach",
        component: "CoachSessionSettings",
        duration: 120,
        dependencies: ["view-match"],
      },
      {
        id: "accept-program",
        title: "Accept coaching program",
        description: "Coach accepts invitation with pricing agreement",
        userRole: "coach",
        component: "ProgramAcceptance",
        duration: 60,
        dependencies: ["set-price"],
      },
    ],
  },
  {
    id: "scheduling",
    title: "Scheduling: Time Proposal & Acceptance",
    description: "Collaborative scheduling between coach and participant",
    category: "session",
    priority: "medium",
    expectedOutcome: "Mutually agreed session time is scheduled",
    steps: [
      {
        id: "propose-time",
        title: "Coach proposes session times",
        description: "Coach offers multiple available time slots",
        userRole: "coach",
        component: "SessionScheduler",
        duration: 90,
      },
      {
        id: "participant-response",
        title: "Participant responds to proposal",
        description: "Participant selects preferred time from options",
        userRole: "participant",
        component: "SessionScheduler",
        duration: 45,
        dependencies: ["propose-time"],
      },
      {
        id: "confirm-session",
        title: "Confirm scheduled session",
        description: "Both parties receive confirmation with meeting details",
        userRole: "participant",
        component: "SessionConfirmation",
        duration: 30,
        dependencies: ["participant-response"],
      },
    ],
  },
  {
    id: "analytics-reporting",
    title: "Analytics & Reporting: Post-session Metrics Automatically Update",
    description: "Real-time analytics and reporting after session completion",
    category: "analytics",
    priority: "medium",
    expectedOutcome: "Dashboards reflect updated metrics and progress",
    steps: [
      {
        id: "session-completion",
        title: "Complete coaching session",
        description: "Session ends and data is captured automatically",
        userRole: "participant",
        component: "VideoConference",
        duration: 60,
      },
      {
        id: "metric-update",
        title: "Automatic metric updates",
        description: "System updates analytics and progress tracking",
        userRole: "admin",
        component: "AnalyticsDashboard",
        route: "/admin/analytics",
        duration: 10,
        dependencies: ["session-completion"],
      },
      {
        id: "dashboard-refresh",
        title: "Dashboard data refresh",
        description: "All relevant dashboards show updated information",
        userRole: "admin",
        component: "EnhancedAnalyticsDashboard",
        duration: 15,
        dependencies: ["metric-update"],
      },
    ],
  },
];

const StoryboardValidator: React.FC = () => {
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const runScenario = async (scenarioId: string) => {
    const scenario = storyboardScenarios.find((s) => s.id === scenarioId);
    if (!scenario) return;

    setCurrentTest(scenarioId);

    for (const step of scenario.steps) {
      // Initialize step as running
      const newResult: ValidationResult = {
        scenarioId,
        stepId: step.id,
        status: "running",
        startTime: new Date(),
      };

      setResults((prev) => [
        ...prev.filter(
          (r) => !(r.scenarioId === scenarioId && r.stepId === step.id),
        ),
        newResult,
      ]);

      // Simulate step execution
      await new Promise((resolve) => setTimeout(resolve, step.duration * 10)); // Accelerated for demo

      // Simulate random success/failure
      const success = Math.random() > 0.15; // 85% success rate

      setResults((prev) =>
        prev.map((r) =>
          r.scenarioId === scenarioId && r.stepId === step.id
            ? {
                ...r,
                status: success ? "passed" : "failed",
                endTime: new Date(),
                errors: success ? [] : [`Validation failed for ${step.title}`],
              }
            : r,
        ),
      );

      if (!success) {
        // If step fails, mark remaining steps as skipped
        const remainingSteps = scenario.steps.slice(
          scenario.steps.indexOf(step) + 1,
        );
        const skippedResults = remainingSteps.map(
          (skippedStep): ValidationResult => ({
            scenarioId,
            stepId: skippedStep.id,
            status: "skipped",
          }),
        );

        setResults((prev) => [...prev, ...skippedResults]);
        break;
      }
    }

    setCurrentTest(null);
  };

  const filteredScenarios = storyboardScenarios.filter(
    (scenario) =>
      selectedCategory === "all" || scenario.category === selectedCategory,
  );

  const getScenarioResults = (scenarioId: string) =>
    results.filter((r) => r.scenarioId === scenarioId);

  const getScenarioStatus = (scenarioId: string) => {
    const scenarioResults = getScenarioResults(scenarioId);
    if (scenarioResults.length === 0) return "pending";
    if (scenarioResults.some((r) => r.status === "running")) return "running";
    if (scenarioResults.some((r) => r.status === "failed")) return "failed";
    if (scenarioResults.every((r) => r.status === "passed")) return "passed";
    return "partial";
  };

  const overallStats = {
    total: storyboardScenarios.length,
    passed: storyboardScenarios.filter(
      (s) => getScenarioStatus(s.id) === "passed",
    ).length,
    failed: storyboardScenarios.filter(
      (s) => getScenarioStatus(s.id) === "failed",
    ).length,
    running: storyboardScenarios.filter(
      (s) => getScenarioStatus(s.id) === "running",
    ).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Storyboard Validation</h2>
          <p className="text-muted-foreground">
            Test complete user journey workflows visually
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() =>
              filteredScenarios.forEach((scenario) => runScenario(scenario.id))
            }
            disabled={currentTest !== null}
            className="gap-2"
          >
            <Play className="h-4 w-4" />
            Run All Scenarios
          </Button>
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{overallStats.total}</div>
            <p className="text-sm text-muted-foreground">Total Scenarios</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {overallStats.passed}
            </div>
            <p className="text-sm text-muted-foreground">Passed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {overallStats.failed}
            </div>
            <p className="text-sm text-muted-foreground">Failed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {overallStats.running}
            </div>
            <p className="text-sm text-muted-foreground">Running</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <div className="flex gap-4 items-center">
        <label className="text-sm font-medium">Filter by Category:</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border rounded px-3 py-1 text-sm"
        >
          <option value="all">All Categories</option>
          <option value="admin">Admin</option>
          <option value="onboarding">Onboarding</option>
          <option value="matching">Matching</option>
          <option value="session">Session</option>
          <option value="analytics">Analytics</option>
        </select>
      </div>

      {/* Scenarios */}
      <div className="space-y-6">
        {filteredScenarios.map((scenario) => {
          const scenarioResults = getScenarioResults(scenario.id);
          const scenarioStatus = getScenarioStatus(scenario.id);

          return (
            <Card key={scenario.id} className="w-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center",
                        scenarioStatus === "passed" &&
                          "bg-green-100 text-green-700",
                        scenarioStatus === "failed" &&
                          "bg-red-100 text-red-700",
                        scenarioStatus === "running" &&
                          "bg-blue-100 text-blue-700",
                        scenarioStatus === "pending" &&
                          "bg-gray-100 text-gray-700",
                      )}
                    >
                      {scenario.category === "admin" && (
                        <Settings className="h-5 w-5" />
                      )}
                      {scenario.category === "matching" && (
                        <Target className="h-5 w-5" />
                      )}
                      {scenario.category === "session" && (
                        <Calendar className="h-5 w-5" />
                      )}
                      {scenario.category === "analytics" && (
                        <BarChart3 className="h-5 w-5" />
                      )}
                      {scenario.category === "onboarding" && (
                        <Users className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {scenario.title}
                      </CardTitle>
                      <CardDescription>{scenario.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        scenario.priority === "high"
                          ? "destructive"
                          : scenario.priority === "medium"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {scenario.priority}
                    </Badge>
                    <Badge variant="outline">{scenario.category}</Badge>
                    <Button
                      size="sm"
                      onClick={() => runScenario(scenario.id)}
                      disabled={currentTest !== null}
                      className="gap-2"
                    >
                      <Play className="h-4 w-4" />
                      Run
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Expected Outcome */}
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm">
                      <strong>Expected Outcome:</strong>{" "}
                      {scenario.expectedOutcome}
                    </p>
                  </div>

                  {/* Steps */}
                  <div className="space-y-3">
                    {scenario.steps.map((step, index) => {
                      const stepResult = scenarioResults.find(
                        (r) => r.stepId === step.id,
                      );
                      const isLastStep = index === scenario.steps.length - 1;

                      return (
                        <div key={step.id} className="flex items-center gap-4">
                          <div
                            className={cn(
                              "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium border-2",
                              stepResult?.status === "passed" &&
                                "bg-green-100 text-green-700 border-green-300",
                              stepResult?.status === "failed" &&
                                "bg-red-100 text-red-700 border-red-300",
                              stepResult?.status === "running" &&
                                "bg-blue-100 text-blue-700 border-blue-300",
                              stepResult?.status === "skipped" &&
                                "bg-gray-100 text-gray-500 border-gray-300",
                              !stepResult &&
                                "bg-gray-50 text-gray-400 border-gray-200",
                            )}
                          >
                            {stepResult?.status === "passed" && (
                              <CheckCircle className="h-4 w-4" />
                            )}
                            {stepResult?.status === "running" && (
                              <Clock className="h-4 w-4" />
                            )}
                            {!stepResult ||
                              (stepResult.status === "pending" && index + 1)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{step.title}</h4>
                              <Badge variant="outline" className="text-xs">
                                {step.userRole}
                              </Badge>
                              {step.route && (
                                <Badge variant="secondary" className="text-xs">
                                  {step.route}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {step.description}
                            </p>
                            {stepResult?.errors &&
                              stepResult.errors.length > 0 && (
                                <p className="text-sm text-red-600 mt-1">
                                  {stepResult.errors.join(", ")}
                                </p>
                              )}
                          </div>
                          {!isLastStep && (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default StoryboardValidator;
