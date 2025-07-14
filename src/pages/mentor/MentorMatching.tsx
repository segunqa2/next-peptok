import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Sparkles, ArrowLeft, Filter, Grid, List } from "lucide-react";
import Header from "../../components/layout/Header";
import { MentorProfileCard } from "../../components/mentor/MentorProfileCard";
import { MentorMatchingFilters } from "../../components/mentor/MentorMatchingFilters";
import { Mentor, MentorMatch, MatchingFilters } from "../../types/mentor";
import { apiEnhanced as api } from "@/services/apiEnhanced";

export const MentorMatching: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mentorshipRequestId = searchParams.get("requestId");

  const [matches, setMatches] = useState<MentorMatch[]>([]);
  const [allMentors, setAllMentors] = useState<Mentor[]>([]);
  const [filteredMentors, setFilteredMentors] = useState<Mentor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<MatchingFilters>({});
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedMentors, setSelectedMentors] = useState<Set<string>>(
    new Set(),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadMentorMatches();
  }, [mentorshipRequestId]);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [searchQuery, filters, allMentors]);

  const loadMentorMatches = async () => {
    try {
      setIsLoading(true);

      if (mentorshipRequestId) {
        // Load AI-matched mentors for the specific request
        const matchingResult = await api.findMentorMatches(
          mentorshipRequestId,
          filters,
        );
        setMatches(matchingResult.matches);
        setAllMentors(matchingResult.matches.map((match) => match.mentor));
      } else {
        // Load all available mentors
        const mentors = await api.getAllMentors();
        setAllMentors(mentors);
        setMatches([]);
      }
    } catch (error) {
      console.error("Error loading mentors:", error);
      toast.error("Failed to load mentors");
    } finally {
      setIsLoading(false);
    }
  };

  const applyFiltersAndSearch = () => {
    let filtered = allMentors;

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (mentor) =>
          mentor.getFullName().toLowerCase().includes(query) ||
          mentor.title?.toLowerCase().includes(query) ||
          mentor.company?.toLowerCase().includes(query) ||
          mentor
            .getExpertiseCategories()
            .some((cat) => cat.toLowerCase().includes(query)) ||
          mentor.bio?.toLowerCase().includes(query),
      );
    }

    // Apply filters
    if (filters.expertise && filters.expertise.length > 0) {
      filtered = filtered.filter((mentor) =>
        mentor
          .getExpertiseCategories()
          .some((cat) =>
            filters.expertise!.some(
              (exp) =>
                cat.toLowerCase().includes(exp.toLowerCase()) ||
                exp.toLowerCase().includes(cat.toLowerCase()),
            ),
          ),
      );
    }

    if (filters.experienceLevel) {
      const levelOrder = { beginner: 1, intermediate: 2, expert: 3, master: 4 };
      filtered = filtered.filter((mentor) =>
        mentor.expertise.some(
          (exp) =>
            levelOrder[exp.level] >= levelOrder[filters.experienceLevel!],
        ),
      );
    }

    if (filters.minRating) {
      filtered = filtered.filter(
        (mentor) => mentor.metrics.averageRating >= filters.minRating!,
      );
    }

    if (filters.maxHourlyRate) {
      filtered = filtered.filter(
        (mentor) =>
          !mentor.hourlyRate || mentor.hourlyRate <= filters.maxHourlyRate!,
      );
    }

    if (filters.languages && filters.languages.length > 0) {
      filtered = filtered.filter((mentor) =>
        filters.languages!.some((lang) =>
          mentor.languages.some((mentorLang) =>
            mentorLang.toLowerCase().includes(lang.toLowerCase()),
          ),
        ),
      );
    }

    setFilteredMentors(filtered);
  };

  const handleMentorSelect = (mentorId: string) => {
    const newSelected = new Set(selectedMentors);
    if (newSelected.has(mentorId)) {
      newSelected.delete(mentorId);
    } else {
      newSelected.add(mentorId);
    }
    setSelectedMentors(newSelected);
  };

  const handleSendRequests = async () => {
    if (selectedMentors.size === 0) {
      toast.error("Please select at least one mentor");
      return;
    }

    if (!mentorshipRequestId) {
      toast.error("No mentorship request found");
      return;
    }

    try {
      setIsSubmitting(true);

      // Send requests to selected mentors
      const requests = Array.from(selectedMentors).map((mentorId) =>
        api.sendMentorshipRequest(mentorshipRequestId, mentorId),
      );

      await Promise.all(requests);

      toast.success(
        `Mentorship requests sent to ${selectedMentors.size} mentor(s)`,
      );
      navigate("/mentorship/requests");
    } catch (error) {
      console.error("Error sending requests:", error);
      toast.error("Failed to send mentorship requests");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewProfile = (mentor: Mentor) => {
    // TODO: Navigate to mentor profile page
    console.log("View profile for:", mentor.id);
  };

  const getMentorMatch = (mentor: Mentor): MentorMatch | undefined => {
    return matches.find((match) => match.mentor.id === mentor.id);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
          </div>

          <div className="flex items-center space-x-3 mb-2">
            <Sparkles className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              {mentorshipRequestId ? "AI-Matched Mentors" : "Discover Mentors"}
            </h1>
          </div>

          <p className="text-gray-600">
            {mentorshipRequestId
              ? "We've found the best mentors based on your goals and requirements"
              : "Browse our community of expert mentors and find the perfect match"}
          </p>
        </div>

        {/* Filters */}
        <MentorMatchingFilters
          filters={filters}
          onFiltersChange={setFilters}
          onSearch={setSearchQuery}
          searchQuery={searchQuery}
          isLoading={isLoading}
          totalResults={filteredMentors.length}
        />

        {/* View Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg ${
                viewMode === "grid"
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg ${
                viewMode === "list"
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>

          {mentorshipRequestId && selectedMentors.size > 0 && (
            <button
              onClick={handleSendRequests}
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Sending...</span>
                </>
              ) : (
                <span>Send Requests to {selectedMentors.size} Mentor(s)</span>
              )}
            </button>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
            <span className="ml-3 text-gray-600">
              Finding the best mentors for you...
            </span>
          </div>
        )}

        {/* Results */}
        {!isLoading && (
          <>
            {filteredMentors.length === 0 ? (
              <div className="text-center py-12">
                <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No mentors found
                </h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your filters or search terms to find more
                  mentors.
                </p>
                <button
                  onClick={() => {
                    setFilters({});
                    setSearchQuery("");
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div
                className={`${
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                    : "space-y-4"
                }`}
              >
                {filteredMentors.map((mentor) => {
                  const match = getMentorMatch(mentor);
                  const isSelected = selectedMentors.has(mentor.id);

                  return (
                    <div
                      key={mentor.id}
                      className={`relative ${
                        mentorshipRequestId ? "cursor-pointer" : ""
                      } ${
                        isSelected ? "ring-2 ring-blue-500 ring-offset-2" : ""
                      }`}
                      onClick={
                        mentorshipRequestId
                          ? () => handleMentorSelect(mentor.id)
                          : undefined
                      }
                    >
                      {mentorshipRequestId && (
                        <div className="absolute top-2 left-2 z-10">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleMentorSelect(mentor.id)}
                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      )}

                      <MentorProfileCard
                        mentor={mentor}
                        matchScore={match?.matchScore}
                        strengths={match?.strengths}
                        matchReasons={match?.matchReasons}
                        showMatchInfo={Boolean(match)}
                        variant={viewMode === "list" ? "compact" : "default"}
                        onViewProfile={() => handleViewProfile(mentor)}
                        onSendRequest={
                          mentorshipRequestId
                            ? undefined
                            : () => {
                                // TODO: Handle single mentor request
                                console.log("Send request to:", mentor.id);
                              }
                        }
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
