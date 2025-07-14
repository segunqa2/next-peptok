import React from "react";
import {
  Star,
  Clock,
  Users,
  CheckCircle,
  MessageCircle,
  Calendar,
} from "lucide-react";
import { Mentor } from "../../types/mentor";

interface MentorProfileCardProps {
  mentor: Mentor;
  matchScore?: number;
  strengths?: string[];
  matchReasons?: string[];
  onViewProfile?: () => void;
  onSendRequest?: () => void;
  showMatchInfo?: boolean;
  variant?: "default" | "compact" | "detailed";
}

export const MentorProfileCard: React.FC<MentorProfileCardProps> = ({
  mentor,
  matchScore,
  strengths = [],
  matchReasons = [],
  onViewProfile,
  onSendRequest,
  showMatchInfo = false,
  variant = "default",
}) => {
  const isCompact = variant === "compact";
  const isDetailed = variant === "detailed";

  return (
    <div
      className={`bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-xl hover:scale-[1.02] ${
        isCompact ? "p-4" : "p-6"
      }`}
    >
      {/* Header with Match Score */}
      {showMatchInfo && matchScore && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                matchScore >= 80
                  ? "bg-green-100 text-green-800"
                  : matchScore >= 60
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
              }`}
            >
              {matchScore}% Match
            </div>
            {mentor.isVerified && (
              <CheckCircle className="w-5 h-5 text-blue-500" />
            )}
          </div>
          <div className="flex items-center space-x-1 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>{mentor.metrics.responseTime}h response</span>
          </div>
        </div>
      )}

      {/* Profile Section */}
      <div className="flex items-start space-x-4 mb-4">
        <div className="flex-shrink-0">
          <img
            src={
              mentor.profilePicture ||
              "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400"
            }
            alt={mentor.getFullName()}
            className={`rounded-full object-cover ${
              isCompact ? "w-12 h-12" : "w-16 h-16"
            }`}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3
              className={`font-semibold text-gray-900 truncate ${
                isCompact ? "text-base" : "text-lg"
              }`}
            >
              {mentor.getFullName()}
            </h3>
            {mentor.isVerified && !showMatchInfo && (
              <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
            )}
          </div>

          <p className="text-sm text-gray-600 mb-1">{mentor.title}</p>
          {mentor.company && (
            <p className="text-sm text-gray-500">{mentor.company}</p>
          )}

          {/* Rating and Stats */}
          <div className="flex items-center space-x-4 mt-2">
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm font-medium">
                {mentor.metrics.averageRating.toFixed(1)}
              </span>
            </div>
            <div className="flex items-center space-x-1 text-gray-500">
              <Users className="w-4 h-4" />
              <span className="text-sm">
                {mentor.metrics.totalSessions} sessions
              </span>
            </div>
            {mentor.hourlyRate && (
              <div className="text-sm font-medium text-gray-900">
                ${mentor.hourlyRate}/
                {mentor.currency === "USD" ? "hr" : mentor.currency}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bio (if not compact) */}
      {!isCompact && mentor.bio && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{mentor.bio}</p>
      )}

      {/* Expertise Tags */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {mentor
            .getExpertiseCategories()
            .slice(0, isCompact ? 2 : 4)
            .map((category) => (
              <span
                key={category}
                className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium"
              >
                {category}
              </span>
            ))}
          {mentor.getExpertiseCategories().length > (isCompact ? 2 : 4) && (
            <span className="px-2 py-1 bg-gray-50 text-gray-600 rounded-md text-xs">
              +{mentor.getExpertiseCategories().length - (isCompact ? 2 : 4)}{" "}
              more
            </span>
          )}
        </div>
      </div>

      {/* Strengths (if match info shown) */}
      {showMatchInfo && strengths.length > 0 && !isCompact && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Key Strengths
          </h4>
          <div className="space-y-1">
            {strengths.slice(0, 3).map((strength, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 text-sm text-gray-600"
              >
                <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                <span>{strength}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Match Reasons (if detailed view) */}
      {isDetailed && showMatchInfo && matchReasons.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Why This Match
          </h4>
          <div className="space-y-1">
            {matchReasons.slice(0, 3).map((reason, index) => (
              <div
                key={index}
                className="flex items-start space-x-2 text-sm text-gray-600"
              >
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Languages */}
      {!isCompact && mentor.languages.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {mentor.languages.join(", ")}
            </span>
          </div>
        </div>
      )}

      {/* Availability Indicator */}
      {!isCompact && mentor.availability.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              Available {mentor.availability.length} days/week
            </span>
          </div>
        </div>
      )}

      {/* Success Metrics (if detailed) */}
      {isDetailed && (
        <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {Math.round(mentor.metrics.successRate * 100)}%
            </div>
            <div className="text-xs text-gray-600">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {Math.round(mentor.metrics.completionRate * 100)}%
            </div>
            <div className="text-xs text-gray-600">Completion Rate</div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className={`flex gap-3 ${isCompact ? "flex-col" : ""}`}>
        {onViewProfile && (
          <button
            onClick={onViewProfile}
            className={`flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium ${
              isCompact ? "text-sm" : ""
            }`}
          >
            View Profile
          </button>
        )}
        {onSendRequest && (
          <button
            onClick={onSendRequest}
            className={`flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium ${
              isCompact ? "text-sm" : ""
            }`}
          >
            Send Request
          </button>
        )}
      </div>

      {/* Status Indicator */}
      <div className="absolute top-3 right-3">
        <div
          className={`w-3 h-3 rounded-full ${
            mentor.status === "active"
              ? "bg-green-400"
              : mentor.status === "busy"
                ? "bg-yellow-400"
                : "bg-gray-400"
          }`}
        />
      </div>
    </div>
  );
};
