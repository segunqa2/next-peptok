import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Calendar, MessageSquare, Video, Clock, Target } from "lucide-react";
import { Connection } from "@/types";
import { Link } from "react-router-dom";

interface ConnectionCardProps {
  connection: Connection;
  viewType?: "employee" | "expert" | "admin";
}

const ConnectionCard = ({
  connection,
  viewType = "employee",
}: ConnectionCardProps) => {
  const displayPerson =
    viewType === "employee" ? connection.expert : connection.employee;
  const statusColors = {
    active: "bg-green-500",
    completed: "bg-blue-500",
    paused: "bg-yellow-500",
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage
                src={displayPerson.avatar}
                alt={displayPerson.name}
              />
              <AvatarFallback>
                {displayPerson.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{displayPerson.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {displayPerson.title}
              </p>
              {viewType === "employee" && (
                <p className="text-xs text-primary font-medium">
                  {connection.expert.company}
                </p>
              )}
            </div>
          </div>
          <Badge
            variant="outline"
            className={`capitalize ${statusColors[connection.status]} text-white border-0`}
          >
            {connection.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {connection.sessionsCompleted} / {connection.totalSessions}{" "}
              sessions
            </span>
          </div>
          <Progress value={connection.progress} className="h-2" />
          <div className="text-xs text-muted-foreground text-right">
            {connection.progress}% complete
          </div>
        </div>

        {/* Goals */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm font-medium">
            <Target className="h-4 w-4 text-primary" />
            <span>Goals</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {connection.goals.slice(0, 2).map((goal, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {goal}
              </Badge>
            ))}
            {connection.goals.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{connection.goals.length - 2} more
              </Badge>
            )}
          </div>
        </div>

        {/* Next Session */}
        {connection.nextSessionDate && connection.status === "active" && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Next session: {formatDate(connection.nextSessionDate)}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1 gap-2">
            <MessageSquare className="h-4 w-4" />
            Message
          </Button>
          <Button variant="outline" size="sm" className="flex-1 gap-2">
            <Video className="h-4 w-4" />
            Video Call
          </Button>
          {connection.status === "active" && (
            <Button size="sm" className="gap-2">
              <Calendar className="h-4 w-4" />
              Schedule
            </Button>
          )}
        </div>

        {/* View Details */}
        <Button variant="ghost" size="sm" asChild className="w-full">
          <Link to={`/connections/${connection.id}`}>View Details</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default ConnectionCard;
