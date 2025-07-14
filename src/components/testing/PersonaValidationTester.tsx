import React, { useState, useEffect } from "react";
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
  User,
  Users,
  Target,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
} from "lucide-react";
import {
  allPersonas,
  generateTestData,
  UserPersona,
} from "@/data/userPersonas";
import { cn } from "@/lib/utils";

interface ValidationTest {
  id: string;
  personaId: string;
  scenario: string;
  status: "pending" | "running" | "passed" | "failed";
  startTime?: Date;
  endTime?: Date;
  errors?: string[];
  results?: any;
}

interface PersonaValidationTesterProps {
  onTestComplete?: (results: ValidationTest[]) => void;
}

const PersonaValidationTester: React.FC<PersonaValidationTesterProps> = ({
  onTestComplete,
}) => {
  const [tests, setTests] = useState<ValidationTest[]>([]);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<string>("all");

  // Initialize tests on component mount
  useEffect(() => {
    const testData = generateTestData();
    const initialTests: ValidationTest[] = testData.testScenarios.map(
      (scenario, index) => ({
        id: `test-${index}`,
        personaId: scenario.personaId,
        scenario: scenario.scenario,
        status: "pending",
      }),
    );
    setTests(initialTests);
  }, []);

  const runTest = async (testId: string) => {
    setCurrentTest(testId);
    setTests((prev) =>
      prev.map((test) =>
        test.id === testId
          ? { ...test, status: "running", startTime: new Date() }
          : test,
      ),
    );

    // Simulate test execution
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Simulate random test results for validation
    const success = Math.random() > 0.2; // 80% success rate

    setTests((prev) =>
      prev.map((test) =>
        test.id === testId
          ? {
              ...test,
              status: success ? "passed" : "failed",
              endTime: new Date(),
              errors: success ? [] : ["Simulated validation error for testing"],
              results: success
                ? { validationScore: Math.floor(Math.random() * 100) + 50 }
                : null,
            }
          : test,
      ),
    );

    setCurrentTest(null);
  };

  const runAllTests = async () => {
    for (const test of tests.filter((t) => t.status === "pending")) {
      await runTest(test.id);
    }

    if (onTestComplete) {
      onTestComplete(tests);
    }
  };

  const resetTests = () => {
    setTests((prev) =>
      prev.map((test) => ({
        ...test,
        status: "pending",
        startTime: undefined,
        endTime: undefined,
        errors: undefined,
        results: undefined,
      })),
    );
    setCurrentTest(null);
  };

  const getPersona = (personaId: string): UserPersona | undefined => {
    if (personaId === allPersonas.admin.id) return allPersonas.admin;
    if (personaId === allPersonas.coach.id) return allPersonas.coach;
    return allPersonas.participants.find((p) => p.id === personaId);
  };

  const filteredTests = tests.filter(
    (test) => selectedPersona === "all" || test.personaId === selectedPersona,
  );

  const testStats = {
    total: filteredTests.length,
    passed: filteredTests.filter((t) => t.status === "passed").length,
    failed: filteredTests.filter((t) => t.status === "failed").length,
    running: filteredTests.filter((t) => t.status === "running").length,
    pending: filteredTests.filter((t) => t.status === "pending").length,
  };

  const PersonaCard: React.FC<{ persona: UserPersona }> = ({ persona }) => (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
            {persona.name.charAt(0)}
          </div>
          <div>
            <CardTitle className="text-lg">{persona.name}</CardTitle>
            <CardDescription>{persona.email}</CardDescription>
          </div>
        </div>
        <Badge
          variant={
            persona.role === "admin"
              ? "destructive"
              : persona.role === "coach"
                ? "default"
                : "secondary"
          }
          className="w-fit"
        >
          {persona.role.charAt(0).toUpperCase() + persona.role.slice(1)}
        </Badge>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {persona.background}
        </p>
        <div className="space-y-2">
          <div className="text-sm">
            <strong>Primary Goals:</strong>
            <ul className="list-disc list-inside text-muted-foreground ml-2">
              {persona.goals.slice(0, 2).map((goal, index) => (
                <li key={index}>{goal}</li>
              ))}
            </ul>
          </div>
          <div className="text-sm">
            <strong>Validation Scenarios:</strong>{" "}
            <span className="text-muted-foreground">
              {persona.validationScenarios.length} tests
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Persona Validation Testing</h2>
          <p className="text-muted-foreground">
            Test user journeys with realistic personas
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={runAllTests}
            disabled={currentTest !== null}
            className="gap-2"
          >
            <Play className="h-4 w-4" />
            Run All Tests
          </Button>
          <Button onClick={resetTests} variant="outline" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>

      {/* Test Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{testStats.total}</div>
            <p className="text-sm text-muted-foreground">Total Tests</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {testStats.passed}
            </div>
            <p className="text-sm text-muted-foreground">Passed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {testStats.failed}
            </div>
            <p className="text-sm text-muted-foreground">Failed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {testStats.running}
            </div>
            <p className="text-sm text-muted-foreground">Running</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">
              {testStats.pending}
            </div>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="personas" className="w-full">
        <TabsList>
          <TabsTrigger value="personas">Personas</TabsTrigger>
          <TabsTrigger value="tests">Test Results</TabsTrigger>
          <TabsTrigger value="journey">User Journeys</TabsTrigger>
        </TabsList>

        <TabsContent value="personas" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <PersonaCard persona={allPersonas.admin} />
            <PersonaCard persona={allPersonas.coach} />
            {allPersonas.participants.map((persona) => (
              <PersonaCard key={persona.id} persona={persona} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          <div className="flex gap-4 items-center mb-4">
            <label className="text-sm font-medium">Filter by Persona:</label>
            <select
              value={selectedPersona}
              onChange={(e) => setSelectedPersona(e.target.value)}
              className="border rounded px-3 py-1 text-sm"
            >
              <option value="all">All Personas</option>
              <option value={allPersonas.admin.id}>
                {allPersonas.admin.name} (Admin)
              </option>
              <option value={allPersonas.coach.id}>
                {allPersonas.coach.name} (Coach)
              </option>
              {allPersonas.participants.map((persona) => (
                <option key={persona.id} value={persona.id}>
                  {persona.name} (Participant)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            {filteredTests.map((test) => {
              const persona = getPersona(test.personaId);
              return (
                <Card key={test.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium",
                            test.status === "passed" &&
                              "bg-green-100 text-green-700",
                            test.status === "failed" &&
                              "bg-red-100 text-red-700",
                            test.status === "running" &&
                              "bg-blue-100 text-blue-700",
                            test.status === "pending" &&
                              "bg-gray-100 text-gray-700",
                          )}
                        >
                          {test.status === "passed" && (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          {test.status === "failed" && (
                            <AlertCircle className="h-4 w-4" />
                          )}
                          {test.status === "running" && (
                            <Clock className="h-4 w-4" />
                          )}
                          {test.status === "pending" && (
                            <Target className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{test.scenario}</p>
                          <p className="text-sm text-muted-foreground">
                            {persona?.name} • {persona?.role}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            test.status === "passed"
                              ? "default"
                              : test.status === "failed"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {test.status}
                        </Badge>
                        {test.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => runTest(test.id)}
                            disabled={currentTest !== null}
                          >
                            Run Test
                          </Button>
                        )}
                      </div>
                    </div>
                    {test.errors && test.errors.length > 0 && (
                      <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                        {test.errors.join(", ")}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="journey" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(generateTestData().userJourneys).map(
              ([journeyName, steps]) => (
                <Card key={journeyName}>
                  <CardHeader>
                    <CardTitle className="text-lg capitalize">
                      {journeyName.replace(/([A-Z])/g, " $1").trim()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-2">
                      {steps.map((step, index) => (
                        <li
                          key={index}
                          className="flex items-center gap-2 text-sm"
                        >
                          <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </div>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              ),
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PersonaValidationTester;
