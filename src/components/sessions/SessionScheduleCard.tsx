import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, Save, Edit, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface SessionSchedule {
  id: string;
  date: string;
  time: string;
  day: string;
  title: string;
}

interface SessionScheduleCardProps {
  requestId: string;
  programTitle: string;
}

export function SessionScheduleCard({
  requestId,
  programTitle,
}: SessionScheduleCardProps) {
  const [sessions, setSessions] = useState<SessionSchedule[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingSessions, setEditingSessions] = useState<SessionSchedule[]>([]);

  useEffect(() => {
    loadSessionSchedule();
  }, [requestId]);

  const loadSessionSchedule = () => {
    // Check if this is a demo user
    const isDemoUser = localStorage
      .getItem("peptok_token")
      ?.startsWith("demo_token_");
    const demoData = localStorage.getItem("peptok_demo_data");

    if (isDemoUser && demoData) {
      console.log("🎭 Loading demo session schedule");
      const parsedDemoData = JSON.parse(demoData);
      const demoSchedule = parsedDemoData.sessionSchedule || [];
      setSessions(demoSchedule);
      setEditingSessions([...demoSchedule]);
      console.log("✅ Demo session schedule loaded", demoSchedule);
      return;
    }

    // Default sessions for non-demo users
    const defaultSessions: SessionSchedule[] = [
      {
        id: "session_001",
        date: "2024-07-17",
        time: "10:00",
        day: "Wed",
        title: "Session 1: Sales Fundamentals",
      },
      {
        id: "session_002",
        date: "2024-07-24",
        time: "10:00",
        day: "Wed",
        title: "Session 2: Marketing Strategies",
      },
      {
        id: "session_003",
        date: "2024-07-31",
        time: "10:00",
        day: "Wed",
        title: "Session 3: Negotiation Mastery",
      },
    ];

    setSessions(defaultSessions);
    setEditingSessions([...defaultSessions]);
  };

  const handleSessionChange = (
    index: number,
    field: keyof SessionSchedule,
    value: string,
  ) => {
    const updatedSessions = [...editingSessions];
    updatedSessions[index] = { ...updatedSessions[index], [field]: value };
    setEditingSessions(updatedSessions);
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Simulate saving delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update the sessions
      setSessions([...editingSessions]);

      // Update demo data if applicable
      const isDemoUser = localStorage
        .getItem("peptok_token")
        ?.startsWith("demo_token_");
      const demoData = localStorage.getItem("peptok_demo_data");

      if (isDemoUser && demoData) {
        const parsedDemoData = JSON.parse(demoData);
        parsedDemoData.sessionSchedule = editingSessions;
        localStorage.setItem(
          "peptok_demo_data",
          JSON.stringify(parsedDemoData),
        );
        console.log("🎭 Demo session schedule updated");
      }

      setIsEditing(false);
      toast.success("Session schedule saved successfully!");
    } catch (error) {
      console.error("Failed to save session schedule:", error);
      toast.error("Failed to save session schedule");
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Session Schedule
            </CardTitle>
            <CardDescription>
              Manage the session schedule for {programTitle}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Schedule
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setEditingSessions([...sessions]);
                  }}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {(isEditing ? editingSessions : sessions).map((session, index) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-full bg-blue-100">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  {isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <Label htmlFor={`title-${index}`} className="text-xs">
                          Title
                        </Label>
                        <Input
                          id={`title-${index}`}
                          value={session.title}
                          onChange={(e) =>
                            handleSessionChange(index, "title", e.target.value)
                          }
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`date-${index}`} className="text-xs">
                          Date
                        </Label>
                        <Input
                          id={`date-${index}`}
                          type="date"
                          value={session.date}
                          onChange={(e) =>
                            handleSessionChange(index, "date", e.target.value)
                          }
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`time-${index}`} className="text-xs">
                          Time
                        </Label>
                        <Input
                          id={`time-${index}`}
                          type="time"
                          value={session.time}
                          onChange={(e) =>
                            handleSessionChange(index, "time", e.target.value)
                          }
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`day-${index}`} className="text-xs">
                          Day
                        </Label>
                        <Select
                          value={session.day}
                          onValueChange={(value) =>
                            handleSessionChange(index, "day", value)
                          }
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Mon">Monday</SelectItem>
                            <SelectItem value="Tue">Tuesday</SelectItem>
                            <SelectItem value="Wed">Wednesday</SelectItem>
                            <SelectItem value="Thu">Thursday</SelectItem>
                            <SelectItem value="Fri">Friday</SelectItem>
                            <SelectItem value="Sat">Saturday</SelectItem>
                            <SelectItem value="Sun">Sunday</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium">{session.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(session.date)} at {session.time} (
                        {session.day})
                      </p>
                    </div>
                  )}
                </div>
              </div>
              {!isEditing && (
                <Badge variant="outline" className="text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Scheduled
                </Badge>
              )}
            </div>
          ))}
        </div>

        {sessions.length === 0 && (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No sessions scheduled yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Sessions will be scheduled once a coach is assigned
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
