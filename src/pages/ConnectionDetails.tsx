import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  MessageSquare,
  Video,
  Clock,
  Star,
  MapPin,
  Mail,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

interface Connection {
  id: string;
  coach: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    title: string;
    company: string;
    location: string;
    rating: number;
    expertise: string[];
    bio: string;
  };
  participant: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    title: string;
    company: string;
  };
  status: "active" | "pending" | "completed" | "cancelled";
  startDate: string;
  endDate?: string;
  sessionFrequency: "weekly" | "biweekly" | "monthly";
  totalSessions: number;
  completedSessions: number;
  nextSession?: {
    date: string;
    time: string;
    type: "video" | "phone" | "in-person";
  };
  program?: {
    title: string;
    description: string;
  };
  createdAt: string;
}

export default function ConnectionDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [connection, setConnection] = useState<Connection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConnection = async () => {
      if (!id) return;

      try {
        // For now, create mock data since the API endpoint doesn't exist yet
        const mockConnection: Connection = {
          id,
          coach: {
            id: "coach-1",
            name: "Sarah Johnson",
            email: "sarah.johnson@example.com",
            avatar: "",
            title: "Senior Leadership Coach",
            company: "Executive Coaching Solutions",
            location: "New York, NY",
            rating: 4.9,
            expertise: [
              "Leadership Development",
              "Strategic Planning",
              "Team Management",
              "Executive Presence",
            ],
            bio: "Sarah is a seasoned executive coach with over 15 years of experience helping leaders transform their organizations. She specializes in leadership development and strategic thinking.",
          },
          participant: {
            id: "participant-1",
            name: "John Doe",
            email: "john.doe@company.com",
            avatar: "",
            title: "Director of Operations",
            company: user?.businessDetails?.companyName || "Your Company",
          },
          status: "active",
          startDate: "2024-01-15",
          endDate: "2024-04-15",
          sessionFrequency: "weekly",
          totalSessions: 12,
          completedSessions: 6,
          nextSession: {
            date: "2024-02-15",
            time: "2:00 PM",
            type: "video",
          },
          program: {
            title: "Leadership Development Program",
            description:
              "A comprehensive program focused on developing strategic leadership skills and enhancing team management capabilities.",
          },
          createdAt: "2024-01-10T10:00:00Z",
        };

        setConnection(mockConnection);
      } catch (error) {
        console.error("Failed to fetch connection:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConnection();
  }, [id, user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading connection details...</p>
        </div>
      </div>
    );
  }

  if (!connection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Connection not found.</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const progressPercentage =
    (connection.completedSessions / connection.totalSessions) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {connection.program?.title || "Coaching Connection"}
              </h1>
              <p className="text-gray-600 mt-2">
                {connection.program?.description ||
                  "Mentorship connection details"}
              </p>
            </div>
            <Badge className={getStatusColor(connection.status)}>
              {connection.status.charAt(0).toUpperCase() +
                connection.status.slice(1)}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="sessions">Sessions</TabsTrigger>
                <TabsTrigger value="messages">Messages</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Progress */}
                <Card>
                  <CardHeader>
                    <CardTitle>Program Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Sessions Completed</span>
                          <span>
                            {connection.completedSessions} of{" "}
                            {connection.totalSessions}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">
                            {connection.completedSessions}
                          </p>
                          <p className="text-sm text-gray-600">Sessions Done</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <p className="text-2xl font-bold text-green-600">
                            {connection.totalSessions -
                              connection.completedSessions}
                          </p>
                          <p className="text-sm text-gray-600">Sessions Left</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Coach Profile */}
                <Card>
                  <CardHeader>
                    <CardTitle>Coach Profile</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage
                          src={
                            connection.coach.avatar ||
                            `https://avatar.vercel.sh/${connection.coach.email}`
                          }
                        />
                        <AvatarFallback>
                          {connection.coach.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold">
                          {connection.coach.name}
                        </h3>
                        <p className="text-gray-600">
                          {connection.coach.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {connection.coach.company}
                        </p>
                        <div className="flex items-center gap-1 mt-2">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">
                            {connection.coach.rating}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {connection.coach.location}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-3">
                          {connection.coach.bio}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {connection.coach.expertise.map((skill, index) => (
                            <Badge key={index} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sessions" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Sessions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {connection.nextSession ? (
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">Next Session</p>
                            <p className="text-sm text-gray-600">
                              {new Date(
                                connection.nextSession.date,
                              ).toLocaleDateString()}{" "}
                              at {connection.nextSession.time}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {connection.nextSession.type === "video" && (
                              <Video className="w-5 h-5 text-blue-600" />
                            )}
                            {connection.nextSession.type === "phone" && (
                              <Phone className="w-5 h-5 text-green-600" />
                            )}
                            <Button size="sm">Join Session</Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8">
                        No upcoming sessions scheduled
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="messages" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Messages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center text-gray-500 py-8">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No messages yet</p>
                      <Button className="mt-4">Start Conversation</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Connection Info */}
            <Card>
              <CardHeader>
                <CardTitle>Connection Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Start Date
                  </label>
                  <p className="font-semibold">
                    {new Date(connection.startDate).toLocaleDateString()}
                  </p>
                </div>
                {connection.endDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      End Date
                    </label>
                    <p className="font-semibold">
                      {new Date(connection.endDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Session Frequency
                  </label>
                  <p className="font-semibold capitalize">
                    {connection.sessionFrequency}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Participant Info */}
            <Card>
              <CardHeader>
                <CardTitle>Participant</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage
                      src={
                        connection.participant.avatar ||
                        `https://avatar.vercel.sh/${connection.participant.email}`
                      }
                    />
                    <AvatarFallback>
                      {connection.participant.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{connection.participant.name}</p>
                    <p className="text-sm text-gray-600">
                      {connection.participant.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {connection.participant.company}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
                <Button variant="outline" className="w-full">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Session
                </Button>
                <Button variant="outline" className="w-full">
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Coach
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
