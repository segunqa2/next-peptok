import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Settings, Clock, DollarSign, Users, Save } from "lucide-react";
import { CoachSessionLimits } from "@/types";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

interface CoachSessionSettingsProps {
  programId?: string;
  onSettingsUpdated?: (settings: CoachSessionLimits) => void;
}

export function CoachSessionSettings({
  programId,
  onSettingsUpdated,
}: CoachSessionSettingsProps) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<CoachSessionLimits>({
    id: "",
    coachId: user?.id || "",
    programId,
    minSessionsPerProgram: 1,
    maxSessionsPerProgram: 10,
    sessionDurationMinutes: 60,
    coachHourlyRate: 150,
    isAvailable: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing settings
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.id) {
        console.warn("No user ID available, cannot load session settings");
        return;
      }

      console.log(
        `Loading session settings for coach: ${user.id}${programId ? `, program: ${programId}` : ""}`,
      );
      setIsLoading(true);

      try {
        const existingSettings = await api.getCoachSessionLimits(
          user.id,
          programId,
        );

        if (existingSettings) {
          console.log(
            "Successfully loaded session settings:",
            existingSettings,
          );
          setSettings(existingSettings);

          // Show user feedback about where settings were loaded from
          if (existingSettings.id?.startsWith("local-")) {
            toast.info("Loaded session settings from local storage");
          } else if (existingSettings.id?.startsWith("default-")) {
            toast.info("Using default session settings");
          } else {
            toast.success("Loaded session settings from database");
          }
        } else {
          console.warn("No existing settings found, using defaults");
        }
      } catch (error) {
        console.error("Failed to load session settings:", error);
        toast.error("Failed to load session settings");
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [user?.id, programId]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const updatedSettings = await api.updateCoachSessionLimits(settings);
      setSettings(updatedSettings);

      // Check if settings were saved to backend or localStorage
      if (updatedSettings.id?.startsWith("local-")) {
        toast.success("Session settings saved locally (will sync when online)");
      } else {
        toast.success("Session settings updated successfully!");
      }

      onSettingsUpdated?.(updatedSettings);
    } catch (error) {
      toast.error("Failed to update session settings. Please try again.");
      console.error("Error updating session settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (key: keyof CoachSessionLimits, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const calculateEarnings = () => {
    const minEarnings =
      settings.minSessionsPerProgram * settings.coachHourlyRate;
    const maxEarnings =
      settings.maxSessionsPerProgram * settings.coachHourlyRate;
    return { minEarnings, maxEarnings };
  };

  const { minEarnings, maxEarnings } = calculateEarnings();

  // Debug utility to check localStorage
  const checkLocalStorage = () => {
    if (!user?.id) return;

    const storageKey = `coach_session_limits_${user.id}${programId ? `_${programId}` : ""}`;
    const storedData = localStorage.getItem(storageKey);

    console.log("=== Session Settings Debug Info ===");
    console.log("Storage key:", storageKey);
    console.log("Stored data:", storedData);
    console.log("Current settings:", settings);
    console.log("User ID:", user.id);
    console.log("Program ID:", programId);

    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        console.log("Parsed data:", parsed);
        toast.success("Check console for localStorage debug info");
      } catch (e) {
        console.error("Failed to parse stored data:", e);
        toast.error("Failed to parse stored session settings");
      }
    } else {
      toast.info("No session settings found in localStorage");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading session settings...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Session Settings
          {programId && <Badge variant="outline">Program Specific</Badge>}
        </CardTitle>
        <CardDescription>
          Configure your session limits and pricing for{" "}
          {programId ? "this program" : "all programs"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Availability Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="availability">Available for Sessions</Label>
            <p className="text-sm text-muted-foreground">
              Toggle your availability for new session bookings
            </p>
          </div>
          <Switch
            id="availability"
            checked={settings.isAvailable}
            onCheckedChange={(checked) => updateSetting("isAvailable", checked)}
          />
        </div>

        {/* Session Limits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="minSessions">Minimum Sessions per Program</Label>
            <Input
              id="minSessions"
              type="number"
              min="1"
              max="50"
              value={settings.minSessionsPerProgram}
              onChange={(e) =>
                updateSetting(
                  "minSessionsPerProgram",
                  parseInt(e.target.value) || 1,
                )
              }
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Minimum sessions you're willing to commit to
            </p>
          </div>

          <div>
            <Label htmlFor="maxSessions">Maximum Sessions per Program</Label>
            <Input
              id="maxSessions"
              type="number"
              min={settings.minSessionsPerProgram}
              max="100"
              value={settings.maxSessionsPerProgram}
              onChange={(e) =>
                updateSetting(
                  "maxSessionsPerProgram",
                  parseInt(e.target.value) || 10,
                )
              }
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Maximum sessions you can handle per program
            </p>
          </div>
        </div>

        {/* Session Duration and Rate */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="duration">Session Duration</Label>
            <Select
              value={settings.sessionDurationMinutes.toString()}
              onValueChange={(value) =>
                updateSetting("sessionDurationMinutes", parseInt(value))
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
                <SelectItem value="90">90 minutes</SelectItem>
                <SelectItem value="120">120 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="hourlyRate">Your Hourly Rate (CAD)</Label>
            <div className="relative mt-1">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="hourlyRate"
                type="number"
                min="50"
                max="1000"
                step="10"
                value={settings.coachHourlyRate}
                onChange={(e) =>
                  updateSetting(
                    "coachHourlyRate",
                    parseInt(e.target.value) || 150,
                  )
                }
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Your rate per hour of coaching
            </p>
          </div>
        </div>

        {/* Earnings Preview */}
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-green-600" />
              <h4 className="font-medium">Estimated Earnings per Program</h4>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Minimum</p>
                <p className="text-lg font-semibold text-green-600">
                  ${minEarnings}
                </p>
                <p className="text-xs text-muted-foreground">
                  {settings.minSessionsPerProgram} sessions ×{" "}
                  {settings.sessionDurationMinutes}min
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Maximum</p>
                <p className="text-lg font-semibold text-green-600">
                  ${maxEarnings}
                </p>
                <p className="text-xs text-muted-foreground">
                  {settings.maxSessionsPerProgram} sessions ×{" "}
                  {settings.sessionDurationMinutes}min
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSaveSettings}
          disabled={isSaving || !settings.isAvailable}
          className="w-full"
        >
          {isSaving ? (
            <>
              <Clock className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Session Settings
            </>
          )}
        </Button>

        {!settings.isAvailable && (
          <p className="text-sm text-muted-foreground text-center">
            Enable availability to save your session settings
          </p>
        )}

        {/* Debug Button (only in development) */}
        {import.meta.env.DEV && (
          <Button
            onClick={checkLocalStorage}
            variant="outline"
            size="sm"
            className="w-full mt-2"
          >
            Debug: Check Saved Settings
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
