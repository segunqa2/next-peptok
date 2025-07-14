import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Sparkles, ArrowLeft, Filter, Grid, List } from "lucide-react";
import Header from "../../components/layout/Header";
import { CoachProfileCard } from "../../components/coach/CoachProfileCard";
import { CoachMatchingFilters } from "../../components/coach/CoachMatchingFilters";
import { Coach, CoachMatch, MatchingFilters } from "../../types/coach";
import { apiEnhanced as api } from "@/services/apiEnhanced";

export const CoachMatching: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mentorshipRequestId = searchParams.get("requestId");

  const [matches, setMatches] = useState<CoachMatch[]>([]);
  const [allCoaches, setAllCoaches] = useState<Coach[]>([]);
  const [filteredCoaches, setFilteredCoaches] = useState<Coach[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<MatchingFilters>({});
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCoaches, setSelectedCoaches] = useState<Set<string>>(
    new Set(),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadCoachMatches();
  }, [mentorshipRequestId]);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [searchQuery, filters, allCoaches]);

  const loadCoachMatches = async () => {
    try {
      setIsLoading(true);

      if (mentorshipRequestId) {
        // Load AI-matched coaches for the specific request
        const matchingResult = await api.findCoachMatches(
          mentorshipRequestId,
          filters,
        );
        setMatches(matchingResult.matches);
        setAllCoaches(matchingResult.matches.map((match) => match.coach));
      } else {
        // Load all available coaches
        const coaches = await api.getAllCoaches();
        setAllCoaches(coaches);
      }
    } catch (error) {
      console.error("Error loading coaches:", error);
      toast.error("Failed to load coaches");
    } finally {
      setIsLoading(false);
    }
  };

  const applyFiltersAndSearch = () => {
    let filtered = allCoaches;

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (coach) =>
          coach.getFullName().toLowerCase().includes(query) ||
          coach.title?.toLowerCase().includes(query) ||
          coach.company?.toLowerCase().includes(query) ||
          coach
            .getCoachingCategories()
            .some((cat) => cat.toLowerCase().includes(query)) ||
          coach.bio?.toLowerCase().includes(query),
      );
    }

    // Apply coaching filter
    if (filters.coaching && filters.coaching.length > 0) {
      filtered = filtered.filter((coach) =>
        coach
          .getCoachingCategories()
          .some((category) =>
            filters.coaching!.some(
              (exp) => category.toLowerCase() === exp.toLowerCase(),
            ),
          ),
      );
    }

    // Apply experience level filter
    if (filters.experienceLevel) {
      const levelOrder = { beginner: 1, intermediate: 2, coach: 3, master: 4 };
      filtered = filtered.filter((coach) =>
        coach.coaching.some(
          (exp) =>
            levelOrder[exp.level] >= levelOrder[filters.experienceLevel!],
        ),
      );
    }

    // Apply rating filter
    if (filters.minRating) {
      filtered = filtered.filter(
        (coach) => coach.metrics.averageRating >= filters.minRating!,
      );
    }

    // Apply hourly rate filter
    if (filters.maxHourlyRate) {
      filtered = filtered.filter(
        (coach) =>
          !coach.hourlyRate || coach.hourlyRate <= filters.maxHourlyRate!,
      );
    }

    // Apply language filter
    if (filters.languages && filters.languages.length > 0) {
      filtered = filtered.filter((coach) =>
        filters.languages!.some((lang) =>
          coach.languages.some((coachLang) =>
            coachLang.toLowerCase().includes(lang.toLowerCase()),
          ),
        ),
      );
    }

    setFilteredCoaches(filtered);
  };

  const handleCoachSelect = (coachId: string) => {
    const newSelected = new Set(selectedCoaches);
    if (newSelected.has(coachId)) {
      newSelected.delete(coachId);
    } else {
      newSelected.add(coachId);
    }
    setSelectedCoaches(newSelected);
  };

  const handleSendRequests = async () => {
    if (selectedCoaches.size === 0) {
      toast.error("Please select at least one coach");
      return;
    }

    if (!mentorshipRequestId) {
      toast.error("No mentorship request found");
      return;
    }

    try {
      setIsSubmitting(true);

      // Send requests to selected coaches
      const requests = Array.from(selectedCoaches).map((coachId) =>
        api.sendMentorshipRequest(mentorshipRequestId, coachId),
      );

      await Promise.all(requests);

      toast.success(
        `Mentorship requests sent to ${selectedCoaches.size} coach(s)`,
      );
      navigate("/mentorship/requests");
    } catch (error) {
      console.error("Error sending requests:", error);
      toast.error("Failed to send mentorship requests");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewProfile = (coach: Coach) => {
    // TODO: Navigate to coach profile page
    console.log("View profile for:", coach.id);
  };

  const getCoachMatch = (coach: Coach): CoachMatch | undefined => {
    return matches.find((match) => match.coach.id === coach.id);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {mentorshipRequestId
                    ? "AI-Matched Coaches"
                    : "Discover Coaches"}
                </h1>
                <p className="text-gray-600 mt-1">
                  {mentorshipRequestId
                    ? "We've found the best coaches based on your goals and requirements"
                    : "Browse our community of coach coaches and find the perfect match"}
                </p>
              </div>
            </div>
          </div>

          <CoachMatchingFilters
            onFiltersChange={setFilters}
            onSearchChange={setSearchQuery}
            searchQuery={searchQuery}
            isLoading={isLoading}
            totalResults={filteredCoaches.length}
          />
        </div>

        {/* Results Actions */}
        <div className="mb-6">
          {mentorshipRequestId && selectedCoaches.size > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-900 font-medium">
                    {selectedCoaches.size} coach(s) selected
                  </span>
                </div>
                <button
                  onClick={handleSendRequests}
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <span>Send Requests to {selectedCoaches.size} Coach(s)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">
                Finding the best coaches for you...
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredCoaches.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Filter className="w-12 h-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No coaches found
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Try adjusting your search criteria to find more coaches.
                  </p>
                </div>
              ) : (
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                      : "space-y-4"
                  }
                >
                  {filteredCoaches.map((coach) => {
                    const match = getCoachMatch(coach);
                    const isSelected = selectedCoaches.has(coach.id);

                    return (
                      <div
                        key={coach.id}
                        className={`relative ${
                          mentorshipRequestId ? "cursor-pointer" : ""
                        } ${isSelected ? "ring-2 ring-blue-500" : ""}`}
                        onClick={
                          mentorshipRequestId
                            ? () => handleCoachSelect(coach.id)
                            : undefined
                        }
                      >
                        {mentorshipRequestId && (
                          <div className="absolute top-2 right-2 z-10">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleCoachSelect(coach.id)}
                              className="w-5 h-5 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                            />
                          </div>
                        )}
                        <CoachProfileCard
                          coach={coach}
                          matchInfo={match}
                          isCompact={viewMode === "list"}
                          showMatchInfo={!!match}
                          onViewProfile={() => handleViewProfile(coach)}
                          onConnect={
                            mentorshipRequestId
                              ? undefined
                              : () => {
                                  // TODO: Handle single coach request
                                  console.log("Send request to:", coach.id);
                                }
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
