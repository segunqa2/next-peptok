import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Star,
  Clock,
  Globe,
  CheckCircle,
  Sparkles,
  MapPin,
  Calendar,
} from "lucide-react";
import { Coach } from "../../types/coach";

interface CoachMatch {
  coach: Coach;
  matchScore: number;
  strengths: string[];
  matchReasons: string[];
  estimatedSuccessRate: number;
}

interface CoachProfileCardProps {
  coach: Coach;
  matchInfo?: CoachMatch;
  isCompact?: boolean;
  showMatchInfo?: boolean;
  onViewProfile?: () => void;
  onConnect?: () => void;
}

export const CoachProfileCard: React.FC<CoachProfileCardProps> = ({
  coach,
  matchInfo,
  isCompact = false,
  showMatchInfo = false,
  onViewProfile,
  onConnect,
}) => {
  const handleCardClick = () => {
    if (onViewProfile) {
      onViewProfile();
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-100";
    if (score >= 75) return "text-blue-600 bg-blue-100";
    if (score >= 60) return "text-yellow-600 bg-yellow-100";
    return "text-gray-600 bg-gray-100";
  };

  return (
    <Card
      className={`hover:shadow-lg transition-all duration-200 ${
        isCompact ? "flex" : ""
      } cursor-pointer relative overflow-hidden`}
      onClick={handleCardClick}
    >
      {showMatchInfo && matchInfo && (
        <div className="absolute top-2 left-2 z-10">
          <div
            className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getMatchScoreColor(
              matchInfo.matchScore,
            )}`}
          >
            <Sparkles className="w-3 h-3" />
            <span>{Math.round(matchInfo.matchScore)}% match</span>
          </div>
        </div>
      )}

      <div className={`${isCompact ? "w-20 h-20" : ""} flex-shrink-0`}>
        {!isCompact && (
          <div className="flex items-center justify-between p-4 pb-2">
            {coach.isVerified && (
              <div className="flex items-center space-x-1 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs">Verified</span>
              </div>
            )}
            <span className="text-xs text-gray-500">
              {coach.metrics.responseTime}h response
            </span>
          </div>
        )}
      </div>

      <CardContent
        className={`${isCompact ? "flex-1 flex items-center" : ""} p-4`}
      >
        <div className={`${isCompact ? "flex items-center space-x-4" : ""}`}>
          <Avatar
            className={`${isCompact ? "w-12 h-12" : "w-16 h-16 mx-auto mb-4"}`}
          >
            <AvatarImage
              src={
                coach.profilePicture ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${coach.firstName}`
              }
              alt={coach.getFullName()}
            />
            <AvatarFallback>
              {coach.firstName[0]}
              {coach.lastName[0]}
            </AvatarFallback>
          </Avatar>

          <div className={`${isCompact ? "flex-1" : "text-center"}`}>
            <h3
              className={`font-semibold text-gray-900 ${
                isCompact ? "text-base" : "text-lg mb-1"
              }`}
            >
              {coach.getFullName()}
            </h3>
            {coach.isVerified && !showMatchInfo && (
              <div className="flex items-center justify-center space-x-1 text-green-600 mb-2">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs">Verified Coach</span>
              </div>
            )}
          </div>
        </div>

        <div className={`${isCompact ? "ml-4" : ""}`}>
          <p className="text-sm text-gray-600 mb-1">{coach.title}</p>
          {coach.company && (
            <p className="text-sm text-gray-500">{coach.company}</p>
          )}

          <div
            className={`flex items-center ${
              isCompact ? "space-x-4" : "justify-center space-x-2"
            } mt-2`}
          >
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm font-medium">
                {coach.metrics.averageRating.toFixed(1)}
              </span>
              <span className="text-sm text-gray-500">
                ({coach.metrics.totalSessions} sessions)
              </span>
            </div>
            {coach.hourlyRate && (
              <div className="text-sm text-gray-600">
                ${coach.hourlyRate}/
                {coach.currency === "USD" ? "hr" : coach.currency}
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {/* Coaching Tags */}
      {!isCompact && (
        <div className="px-4 pb-4">
          {coach.bio && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {coach.bio}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            {coach
              .getCoachingCategories()
              .slice(0, isCompact ? 2 : 4)
              .map((category) => (
                <Badge key={category} variant="secondary">
                  {category}
                </Badge>
              ))}
            {coach.getCoachingCategories().length > (isCompact ? 2 : 4) && (
              <Badge variant="outline">
                +{coach.getCoachingCategories().length - (isCompact ? 2 : 4)}{" "}
                more
              </Badge>
            )}
          </div>

          {/* Match Information */}
          {showMatchInfo && matchInfo && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">
                  Why this is a great match:
                </span>
                <span className="text-sm text-blue-700">
                  {Math.round(matchInfo.estimatedSuccessRate)}% success rate
                </span>
              </div>
              <div className="space-y-1">
                {matchInfo.matchReasons.slice(0, 2).map((reason, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-xs text-blue-800">{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Info */}
          {!isCompact && coach.languages.length > 0 && (
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <Globe className="w-4 h-4 mr-2" />
              <span className="truncate">{coach.languages.join(", ")}</span>
            </div>
          )}

          {!isCompact && coach.availability.length > 0 && (
            <div className="flex items-center text-sm text-gray-600 mb-4">
              <Calendar className="w-4 h-4 mr-2" />
              <span>Available {coach.availability.length} days/week</span>
            </div>
          )}

          {/* Performance Metrics */}
          {!isCompact && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium text-gray-900">
                  {Math.round(coach.metrics.successRate * 100)}%
                </div>
                <div className="text-gray-500">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-gray-900">
                  {Math.round(coach.metrics.completionRate * 100)}%
                </div>
                <div className="text-gray-500">Completion</div>
              </div>
            </div>
          )}
        </div>
      )}

      {!isCompact && (
        <CardFooter className="p-4 pt-0">
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">
                  {coach.status === "active"
                    ? "Available now"
                    : coach.status === "busy"
                      ? "Busy"
                      : "Offline"}
                </span>
              </div>
              <div
                className={`w-2 h-2 rounded-full ${
                  coach.status === "active"
                    ? "bg-green-500"
                    : coach.status === "busy"
                      ? "bg-yellow-500"
                      : "bg-gray-400"
                }`}
              />
            </div>

            {onConnect && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onConnect();
                }}
                className="w-full"
              >
                Connect
              </Button>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
};
