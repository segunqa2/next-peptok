import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, DollarSign, User, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { companyDashboardApi } from "@/services/companyDashboardApi";

interface SessionGeneratorProps {
  programId: string;
  programTitle: string;
  startDate: string;
  endDate: string;
  defaultFrequency: "weekly" | "bi-weekly" | "monthly";
  onSessionsGenerated?: (sessions: any[]) => void;
  disabled?: boolean;
}

export function SessionGenerator({
  programId,
  programTitle,
  startDate,
  endDate,
  defaultFrequency,
  onSessionsGenerated,
  disabled = false,
}: SessionGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [coachId, setCoachId] = useState("");
  const [coachRate, setCoachRate] = useState("150");
  const [hoursPerSession, setHoursPerSession] = useState("1");
  const [frequency, setFrequency] = useState<
    "weekly" | "bi-weekly" | "monthly"
  >(defaultFrequency);
  const [generatedSessions, setGeneratedSessions] = useState<any[]>([]);

  const calculateSessionDates = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates = [];
    const current = new Date(start);

    const intervalDays =
      frequency === "weekly" ? 7 : frequency === "bi-weekly" ? 14 : 30;

    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + intervalDays);
    }

    return dates;
  };

  const sessionDates = calculateSessionDates();
  const totalCost =
    sessionDates.length * parseFloat(coachRate) * parseFloat(hoursPerSession);

  const handleGenerateSessions = async () => {
    if (!coachId) {
      toast.error("Please select a coach first");
      return;
    }

    setIsGenerating(true);
    try {
      const sessions = await companyDashboardApi.generateSessionsForProgram({
        programId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        frequency,
        hoursPerSession: parseFloat(hoursPerSession),
        coachId,
        coachRate: parseFloat(coachRate),
      });

      setGeneratedSessions(sessions);
      toast.success(
        `Successfully generated ${sessions.length} sessions for the program`,
      );

      if (onSessionsGenerated) {
        onSessionsGenerated(sessions);
      }
    } catch (error) {
      console.error("Error generating sessions:", error);
      toast.error("Failed to generate sessions. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (generatedSessions.length > 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Sessions Generated Successfully
          </CardTitle>
          <CardDescription>
            {generatedSessions.length} sessions have been created for this
            program
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-sm">
                  <strong>{generatedSessions.length}</strong> sessions
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-sm">
                  <strong>{hoursPerSession}h</strong> each
                </span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-sm">
                  <strong>${totalCost.toLocaleString()}</strong> total
                </span>
              </div>
            </div>

            <Alert>
              <CheckCircle className="w-4 h-4" />
              <AlertDescription>
                Sessions are now available for the assigned coach to accept or
                decline. The coach will be notified about these sessions.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Program Sessions</CardTitle>
        <CardDescription>
          Create individual sessions for this coaching program based on the
          schedule
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Session Schedule Preview */}
        <div className="bg-muted/30 p-4 rounded-lg">
          <h4 className="font-medium mb-3">Schedule Preview</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Frequency</Label>
              <p className="font-medium capitalize">
                {frequency.replace("-", " ")}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Sessions</Label>
              <p className="font-medium">{sessionDates.length} sessions</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Duration</Label>
              <p className="font-medium">
                {Math.ceil(
                  (new Date(endDate).getTime() -
                    new Date(startDate).getTime()) /
                    (1000 * 60 * 60 * 24),
                )}{" "}
                days
              </p>
            </div>
          </div>
        </div>

        {/* Coach Selection */}
        <div className="space-y-2">
          <Label htmlFor="coach">Assign Coach</Label>
          <div className="flex gap-2">
            <Input
              id="coach"
              placeholder="Enter coach ID or email"
              value={coachId}
              onChange={(e) => setCoachId(e.target.value)}
              disabled={disabled}
            />
            <Button variant="outline" disabled={disabled}>
              <User className="w-4 h-4 mr-2" />
              Browse
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            In the future, you'll be able to browse and select from available
            coaches
          </p>
        </div>

        {/* Session Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="frequency">Session Frequency</Label>
            <Select
              value={frequency}
              onValueChange={(value: any) => setFrequency(value)}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hours">Hours per Session</Label>
            <Select
              value={hoursPerSession}
              onValueChange={setHoursPerSession}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.5">30 minutes</SelectItem>
                <SelectItem value="1">1 hour</SelectItem>
                <SelectItem value="1.5">1.5 hours</SelectItem>
                <SelectItem value="2">2 hours</SelectItem>
                <SelectItem value="3">3 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rate">Coach Rate ($/hour)</Label>
            <Input
              id="rate"
              type="number"
              value={coachRate}
              onChange={(e) => setCoachRate(e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>

        {/* Cost Calculation */}
        <div className="bg-muted/30 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Cost Breakdown</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                {sessionDates.length} sessions × {hoursPerSession}h × $
                {coachRate}/hour
              </span>
              <span className="font-medium">${totalCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Service fee (10%)</span>
              <span>${(totalCost * 0.1).toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-medium pt-2 border-t">
              <span>Total Estimated Cost</span>
              <span>${(totalCost * 1.1).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerateSessions}
          disabled={disabled || isGenerating || !coachId}
          className="w-full"
        >
          {isGenerating ? "Generating Sessions..." : "Generate Sessions"}
        </Button>

        {disabled && (
          <Alert>
            <AlertDescription>
              Session generation is only available for company admins who
              created this program.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
