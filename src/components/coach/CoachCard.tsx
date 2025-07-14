import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Star,
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  Award,
  Users,
  Lock,
} from "lucide-react";
import { Coach } from "@/types";

interface CoachCardProps {
  coach: Coach;
  isAuthenticated?: boolean;
  showLimitedDetails?: boolean;
}

const CoachCard = ({
  coach,
  isAuthenticated = false,
  showLimitedDetails = false,
}: CoachCardProps) => {
  const shouldShowLimited = !isAuthenticated || showLimitedDetails;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={coach.avatar} alt={coach.name} />
            <AvatarFallback>
              {coach.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {coach.name}
            </h3>
            <p className="text-sm text-muted-foreground">{coach.title}</p>
            <p className="text-sm text-primary font-medium">{coach.company}</p>
          </div>
          {shouldShowLimited && (
            <Badge variant="outline" className="text-xs">
              <Lock className="w-3 h-3 mr-1" />
              Limited
            </Badge>
          )}
        </div>

        <div className="mt-4">
          <p className="text-sm text-gray-600 line-clamp-2">
            {shouldShowLimited
              ? `${coach.bio?.substring(0, 100)}${coach.bio?.length > 100 ? "..." : ""}`
              : coach.bio}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {coach.coaching.slice(0, shouldShowLimited ? 2 : 3).map((skill) => (
            <Badge key={skill} variant="secondary">
              {skill}
            </Badge>
          ))}
          {coach.coaching.length > (shouldShowLimited ? 2 : 3) && (
            <Badge variant="outline">
              +{coach.coaching.length - (shouldShowLimited ? 2 : 3)} more
            </Badge>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="font-medium">{coach.rating}</span>
            {!shouldShowLimited && (
              <span>({coach.totalSessions} sessions)</span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{coach.experience}y exp</span>
          </div>
        </div>

        {!shouldShowLimited && (
          <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>
                Next available:{" "}
                {coach.availableSlots?.[0] || "Contact for availability"}
              </span>
            </div>
          </div>
        )}

        {shouldShowLimited && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800 text-sm">
              <Lock className="w-4 h-4" />
              <span className="font-medium">Sign in to view full details</span>
            </div>
            <p className="text-blue-700 text-xs mt-1">
              Contact information, availability, and booking options available
              to authenticated users
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-6 pt-0">
        {isAuthenticated ? (
          <Button asChild className="w-full">
            <Link to={`/coaches/${coach.id}`}>View Full Profile</Link>
          </Button>
        ) : (
          <div className="w-full space-y-2">
            <Button asChild className="w-full" variant="outline">
              <Link to="/login">Sign In to Contact</Link>
            </Button>
            <Button asChild className="w-full" size="sm" variant="ghost">
              <Link to={`/coaches/${coach.id}`}>View Limited Profile</Link>
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default CoachCard;
