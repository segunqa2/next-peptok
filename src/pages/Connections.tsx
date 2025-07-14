import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  MessageCircle,
  Calendar,
  Star,
  Search,
  Filter,
  Video,
  Phone,
  Clock,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Connection {
  id: string;
  mentorName: string;
  mentorTitle: string;
  mentorCompany: string;
  mentorAvatar?: string;
  status: "active" | "pending" | "completed";
  startDate: string;
  nextSession?: string;
  sessionsCompleted: number;
  totalSessions: number;
  rating: number;
  expertise: string[];
  progress: number;
}

export default function Connections() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [filteredConnections, setFilteredConnections] = useState<Connection[]>(
    [],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConnections();
  }, []);

  useEffect(() => {
    filterConnections();
  }, [connections, searchQuery, statusFilter]);

  const loadConnections = async () => {
    try {
      setIsLoading(true);

      // Mock data - in real app, this would come from API
      const mockConnections: Connection[] = [
        {
          id: "conn_1",
          mentorName: "Sarah Johnson",
          mentorTitle: "Senior Software Engineer",
          mentorCompany: "Tech Corp",
          mentorAvatar:
            "https://images.unsplash.com/photo-1494790108755-2616b19a6af1?w=400",
          status: "active",
          startDate: "2024-01-15",
          nextSession: "2024-06-15T14:00:00Z",
          sessionsCompleted: 8,
          totalSessions: 12,
          rating: 4.9,
          expertise: ["React", "Node.js", "System Design"],
          progress: 67,
        },
        {
          id: "conn_2",
          mentorName: "Michael Chen",
          mentorTitle: "Product Manager",
          mentorCompany: "Innovation Labs",
          mentorAvatar:
            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
          status: "active",
          startDate: "2024-02-01",
          nextSession: "2024-06-16T10:00:00Z",
          sessionsCompleted: 5,
          totalSessions: 10,
          rating: 4.8,
          expertise: ["Product Strategy", "User Research", "Analytics"],
          progress: 50,
        },
        {
          id: "conn_3",
          mentorName: "Emily Rodriguez",
          mentorTitle: "UX Design Lead",
          mentorCompany: "Design Studio",
          mentorAvatar:
            "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
          status: "completed",
          startDate: "2023-11-10",
          sessionsCompleted: 12,
          totalSessions: 12,
          rating: 4.7,
          expertise: ["UX Design", "User Research", "Prototyping"],
          progress: 100,
        },
      ];

      setConnections(mockConnections);
    } catch (error) {
      console.error("Error loading connections:", error);
      toast.error("Failed to load connections");
    } finally {
      setIsLoading(false);
    }
  };

  const filterConnections = () => {
    let filtered = connections;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (conn) =>
          conn.mentorName.toLowerCase().includes(query) ||
          conn.mentorTitle.toLowerCase().includes(query) ||
          conn.mentorCompany.toLowerCase().includes(query) ||
          conn.expertise.some((exp) => exp.toLowerCase().includes(query)),
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((conn) => conn.status === statusFilter);
    }

    setFilteredConnections(filtered);
  };

  const handleStartSession = (connectionId: string) => {
    try {
      // Find the connection to get session details
      const connection = connections.find((c) => c.id === connectionId);
      if (!connection) {
        toast.error("Connection not found");
        return;
      }

      // Create a session ID (in real app, this would come from the backend)
      const sessionId = `session-${connectionId}-${Date.now()}`;

      // Navigate to video session
      navigate(`/session/${sessionId}`);

      toast.success("Starting video session...");
    } catch (error) {
      console.error("Failed to start session:", error);
      toast.error("Failed to start session. Please try again.");
    }
  };

  const handleSendMessage = (connectionId: string) => {
    // In real app, this would open chat
    toast.success("Opening chat...");
  };

  const handleScheduleSession = (connectionId: string) => {
    // In real app, this would open scheduling modal
    toast.success("Opening scheduling interface...");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatNextSession = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays > 0) return `In ${diffDays} days`;
    return "Past session";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
          <span className="ml-3 text-gray-600">Loading connections...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Connections</h1>
          <p className="text-gray-600 mt-2">
            Manage your coaching relationships and upcoming sessions
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search coaches, companies, or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Connections</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Connections
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {connections.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Active Sessions
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {connections.filter((c) => c.status === "active").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Sessions Completed
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {connections.reduce(
                      (sum, c) => sum + c.sessionsCompleted,
                      0,
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Star className="w-8 h-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Avg Rating
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {connections.length > 0
                      ? (
                          connections.reduce((sum, c) => sum + c.rating, 0) /
                          connections.length
                        ).toFixed(1)
                      : "0.0"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Connections List */}
        {filteredConnections.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery || statusFilter !== "all"
                  ? "No matching connections"
                  : "No connections yet"}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Start building your coaching network by exploring our experts"}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Button onClick={() => (window.location.href = "/experts")}>
                  Explore Experts
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredConnections.map((connection) => (
              <Card
                key={connection.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage
                          src={connection.mentorAvatar}
                          alt={connection.mentorName}
                        />
                        <AvatarFallback>
                          {connection.mentorName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {connection.mentorName}
                          </h3>
                          <Badge className={getStatusColor(connection.status)}>
                            {connection.status}
                          </Badge>
                        </div>

                        <p className="text-gray-600 mb-1">
                          {connection.mentorTitle}
                        </p>
                        <p className="text-sm text-gray-500 mb-3">
                          {connection.mentorCompany}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {connection.expertise.map((skill) => (
                            <Badge
                              key={skill}
                              variant="outline"
                              className="text-xs"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Progress</p>
                            <p className="font-medium">
                              {connection.progress}%
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Sessions</p>
                            <p className="font-medium">
                              {connection.sessionsCompleted}/
                              {connection.totalSessions}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Rating</p>
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                              <p className="font-medium">{connection.rating}</p>
                            </div>
                          </div>
                          {connection.nextSession && (
                            <div>
                              <p className="text-gray-500">Next Session</p>
                              <p className="font-medium">
                                {formatNextSession(connection.nextSession)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2">
                      {connection.status === "active" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleStartSession(connection.id)}
                            className="flex items-center space-x-2"
                          >
                            <Video className="w-4 h-4" />
                            <span>Start Session</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendMessage(connection.id)}
                            className="flex items-center space-x-2"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>Message</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleScheduleSession(connection.id)}
                            className="flex items-center space-x-2"
                          >
                            <Calendar className="w-4 h-4" />
                            <span>Schedule</span>
                          </Button>
                        </>
                      )}
                      {connection.status === "completed" && (
                        <Badge className="bg-green-100 text-green-800">
                          Completed
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
