import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Brain,
  Target,
  Save,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Users,
  Award,
  Clock,
  DollarSign,
  TestTube,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { apiEnhanced } from "@/services/apiEnhanced";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface MatchingWeights {
  skillMatch: number;
  experience: number;
  rating: number;
  availability: number;
  price: number;
}

interface MatchingConfiguration {
  weights: MatchingWeights;
  algorithm: "python-ml" | "nodejs-basic";
  confidenceThreshold: number;
  maxResults: number;
  lastUpdated: string;
}

interface TestScenario {
  menteeSkills: string[];
  preferredExperience: string;
  budget: number;
  expectedMatches: number;
}

export default function MatchingSettings() {
  const { user } = useAuth();
  const [config, setConfig] = useState<MatchingConfiguration>({
    weights: {
      skillMatch: 30,
      experience: 25,
      rating: 20,
      availability: 15,
      price: 10,
    },
    algorithm: "python-ml",
    confidenceThreshold: 0.7,
    maxResults: 10,
    lastUpdated: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [runningTest, setRunningTest] = useState(false);

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
                  You need platform administrator privileges to access matching
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
      const response = await apiEnhanced.getMatchingConfiguration();
      if (response.success && response.data) {
        setConfig(response.data);
      }
    } catch (error) {
      console.error("Failed to load matching configuration:", error);
      toast.error("Failed to load matching configuration");
    } finally {
      setLoading(false);
    }
  };

  const normalizeWeights = (weights: MatchingWeights): MatchingWeights => {
    const total =
      weights.skillMatch +
      weights.experience +
      weights.rating +
      weights.availability +
      weights.price;
    if (total === 0) return weights;

    return {
      skillMatch: Math.round((weights.skillMatch / total) * 100),
      experience: Math.round((weights.experience / total) * 100),
      rating: Math.round((weights.rating / total) * 100),
      availability: Math.round((weights.availability / total) * 100),
      price: Math.round((weights.price / total) * 100),
    };
  };

  const updateWeight = (weightType: keyof MatchingWeights, value: number[]) => {
    const newWeights = { ...config.weights, [weightType]: value[0] };
    const normalizedWeights = normalizeWeights(newWeights);

    setConfig((prev) => ({
      ...prev,
      weights: normalizedWeights,
    }));
    setHasChanges(true);
  };

  const saveConfiguration = async () => {
    try {
      setSaving(true);
      const updatedConfig = {
        ...config,
        lastUpdated: new Date().toISOString(),
      };

      const response =
        await apiEnhanced.updateMatchingConfiguration(updatedConfig);
      if (response.success) {
        setConfig(updatedConfig);
        setHasChanges(false);
        toast.success("Matching configuration saved successfully");
      } else {
        throw new Error(response.error || "Failed to save configuration");
      }
    } catch (error) {
      console.error("Failed to save configuration:", error);
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setConfig({
      weights: {
        skillMatch: 30,
        experience: 25,
        rating: 20,
        availability: 15,
        price: 10,
      },
      algorithm: "python-ml",
      confidenceThreshold: 0.7,
      maxResults: 10,
      lastUpdated: new Date().toISOString(),
    });
    setHasChanges(true);
    toast.info("Configuration reset to defaults");
  };

  const runTestScenario = async () => {
    try {
      setRunningTest(true);
      const testScenario: TestScenario = {
        menteeSkills: ["JavaScript", "React", "Node.js"],
        preferredExperience: "senior",
        budget: 150,
        expectedMatches: 5,
      };

      const response = await apiEnhanced.testMatchingConfiguration(
        config,
        testScenario,
      );
      if (response.success) {
        setTestResults(response.data.matches || []);
        toast.success(
          `Test completed! Found ${response.data.matches?.length || 0} matches`,
        );
      }
    } catch (error) {
      console.error("Failed to run test scenario:", error);
      toast.error("Failed to run test scenario");
    } finally {
      setRunningTest(false);
    }
  };

  const chartData = [
    { name: "Skill Match", value: config.weights.skillMatch, color: "#8884d8" },
    { name: "Experience", value: config.weights.experience, color: "#82ca9d" },
    { name: "Rating", value: config.weights.rating, color: "#ffc658" },
    {
      name: "Availability",
      value: config.weights.availability,
      color: "#ff7300",
    },
    { name: "Price", value: config.weights.price, color: "#8dd1e1" },
  ];

  const weightTotal =
    config.weights.skillMatch +
    config.weights.experience +
    config.weights.rating +
    config.weights.availability +
    config.weights.price;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            <span>Loading matching configuration...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Brain className="w-8 h-8 text-blue-600" />
                Matching Algorithm Settings
              </h1>
              <p className="text-gray-600 mt-2">
                Configure the matching algorithm weights and parameters for
                mentor-mentee pairing
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

        <Tabs defaultValue="weights" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="weights">Weight Configuration</TabsTrigger>
            <TabsTrigger value="algorithm">Algorithm Settings</TabsTrigger>
            <TabsTrigger value="testing">Testing & Validation</TabsTrigger>
          </TabsList>

          {/* Weight Configuration Tab */}
          <TabsContent value="weights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weight Sliders */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Matching Weights
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Adjust the importance of each factor in the matching
                    algorithm. Weights are automatically normalized to total
                    100%.
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Skill Match Weight */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Skill Match Weight
                      </Label>
                      <Badge variant="secondary">
                        {config.weights.skillMatch}%
                      </Badge>
                    </div>
                    <Slider
                      value={[config.weights.skillMatch]}
                      onValueChange={(value) =>
                        updateWeight("skillMatch", value)
                      }
                      max={100}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">
                      How closely mentee skills should match mentor expertise
                    </p>
                  </div>

                  {/* Experience Weight */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Experience Weight
                      </Label>
                      <Badge variant="secondary">
                        {config.weights.experience}%
                      </Badge>
                    </div>
                    <Slider
                      value={[config.weights.experience]}
                      onValueChange={(value) =>
                        updateWeight("experience", value)
                      }
                      max={100}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">
                      Importance of mentor's years of experience
                    </p>
                  </div>

                  {/* Rating Weight */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        Rating Weight
                      </Label>
                      <Badge variant="secondary">
                        {config.weights.rating}%
                      </Badge>
                    </div>
                    <Slider
                      value={[config.weights.rating]}
                      onValueChange={(value) => updateWeight("rating", value)}
                      max={100}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">
                      Weight given to mentor's average rating from previous
                      sessions
                    </p>
                  </div>

                  {/* Availability Weight */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Availability Weight
                      </Label>
                      <Badge variant="secondary">
                        {config.weights.availability}%
                      </Badge>
                    </div>
                    <Slider
                      value={[config.weights.availability]}
                      onValueChange={(value) =>
                        updateWeight("availability", value)
                      }
                      max={100}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">
                      How much to prioritize mentors with immediate availability
                    </p>
                  </div>

                  {/* Price Weight */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Price Weight
                      </Label>
                      <Badge variant="secondary">{config.weights.price}%</Badge>
                    </div>
                    <Slider
                      value={[config.weights.price]}
                      onValueChange={(value) => updateWeight("price", value)}
                      max={100}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">
                      Importance of pricing in the matching decision
                    </p>
                  </div>

                  <Separator />

                  <div className="text-center">
                    <Badge
                      variant={weightTotal === 100 ? "default" : "destructive"}
                      className="text-sm"
                    >
                      Total Weight: {weightTotal}%
                    </Badge>
                    {weightTotal !== 100 && (
                      <p className="text-xs text-red-600 mt-1">
                        Weights will be automatically normalized to 100%
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Weight Distribution Visualization */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Weight Distribution
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Visual representation of the current weight configuration
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-4 space-y-2">
                    {chartData.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span>{item.name}</span>
                        </div>
                        <span className="font-medium">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Algorithm Settings Tab */}
          <TabsContent value="algorithm" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Algorithm Configuration</CardTitle>
                <p className="text-sm text-gray-600">
                  Configure advanced algorithm settings and parameters
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-8">
                  <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    Algorithm settings panel coming in Phase 2
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Testing Tab */}
          <TabsContent value="testing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="w-5 h-5" />
                  Test Matching Configuration
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Test your current configuration with sample scenarios
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={runTestScenario}
                  disabled={runningTest}
                  className="w-full"
                >
                  {runningTest ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <TestTube className="w-4 h-4 mr-2" />
                  )}
                  Run Test Scenario
                </Button>

                {testResults.length > 0 && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">
                      Test Results
                    </h4>
                    <p className="text-green-700 text-sm">
                      Found {testResults.length} potential matches using current
                      configuration
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              Last updated: {new Date(config.lastUpdated).toLocaleString()}
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline">Algorithm: {config.algorithm}</Badge>
              <Badge variant="outline">Platform Admin</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
