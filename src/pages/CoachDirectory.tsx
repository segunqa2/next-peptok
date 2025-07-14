import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CoachCard from "@/components/coach/CoachCard";
import CoachSearch from "@/components/coach/CoachSearch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiEnhanced as api } from "@/services/apiEnhanced";
import { Coach } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import {
  Filter,
  Grid,
  List,
  Search,
  Star,
  MapPin,
  Clock,
  Users,
  Award,
  TrendingUp,
  Info,
} from "lucide-react";

interface SearchFilters {
  query: string;
  coaching: string[];
  experience: string;
  rating: string;
  availability: string;
  priceRange: number[];
  location: string;
}

const CoachDirectory = () => {
  const { user, isAuthenticated } = useAuth();
  const [allCoaches, setAllCoaches] = useState<Coach[]>([]);
  const [filteredCoaches, setFilteredCoaches] = useState<Coach[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("rating");
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    coaching: [],
    experience: "",
    rating: "",
    availability: "",
    priceRange: [0, 500],
    location: "",
  });

  useEffect(() => {
    const loadCoaches = async () => {
      try {
        console.log("Loading coaches from API...");
        const coachesData = await api.getAllCoaches();
        console.log("Fetched coaches:", coachesData);

        setAllCoaches(coachesData);
        setFilteredCoaches(coachesData);
      } catch (error) {
        console.error("Failed to load coaches:", error);
        // Keep empty arrays - API handles fallback
      } finally {
        setLoading(false);
      }
    };

    loadCoaches();
  }, []);

  const handleSearch = (newFilters: SearchFilters) => {
    setFilters(newFilters);

    let filtered = allCoaches;

    // Text search
    if (newFilters.query) {
      const query = newFilters.query.toLowerCase();
      filtered = filtered.filter(
        (coach) =>
          coach.name.toLowerCase().includes(query) ||
          coach.title.toLowerCase().includes(query) ||
          coach.company.toLowerCase().includes(query) ||
          coach.coaching.some((skill) => skill.toLowerCase().includes(query)),
      );
    }

    // Filter by coaching
    if (newFilters.coaching.length > 0) {
      filtered = filtered.filter((coach) =>
        newFilters.coaching.some((skill) => coach.coaching.includes(skill)),
      );
    }

    // Filter by experience
    if (newFilters.experience) {
      const [min, max] = newFilters.experience.split("-").map(Number);
      filtered = filtered.filter(
        (coach) =>
          coach.experience >= min &&
          (max === undefined || coach.experience <= max),
      );
    }

    // Filter by rating
    if (newFilters.rating) {
      const minRating = parseFloat(newFilters.rating);
      filtered = filtered.filter((coach) => coach.rating >= minRating);
    }

    // Sort results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.rating - a.rating;
        case "experience":
          return b.experience - a.experience;
        case "sessions":
          return b.totalSessions - a.totalSessions;
        default:
          return 0;
      }
    });

    setFilteredCoaches(filtered);
  };

  const clearFilters = () => {
    const defaultFilters = {
      query: "",
      coaching: [],
      experience: "",
      rating: "",
      availability: "",
      priceRange: [0, 500] as number[],
      location: "",
    };
    setFilters(defaultFilters);
    setFilteredCoaches(allCoaches);
  };

  const featuredCoaches = allCoaches
    .filter((coach) => coach.rating >= 4.8)
    .slice(0, 4);

  const hasActiveFilters =
    filters.query ||
    filters.coaching.length > 0 ||
    filters.experience ||
    filters.rating ||
    filters.availability ||
    filters.location;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Coach Directory
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Browse our network of {allCoaches.length}+ experienced coaches and
              find the perfect match for your development goals
            </p>
          </div>
        </div>

        {/* Search Section */}
        <div className="mb-8">
          <CoachSearch onSearch={handleSearch} />
        </div>

        {/* Authentication Notice */}
        {!isAuthenticated && (
          <Alert className="mb-8 border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Limited View:</strong> You're viewing limited coach
              profiles.
              <span className="ml-2">
                <Button
                  asChild
                  variant="link"
                  className="h-auto p-0 text-blue-600 underline"
                >
                  <a href="/login">Sign in</a>
                </Button>
                {" or "}
                <Button
                  asChild
                  variant="link"
                  className="h-auto p-0 text-blue-600 underline"
                >
                  <a href="/signup">create an account</a>
                </Button>{" "}
                to view full profiles, contact information, and book sessions.
              </span>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="lg:w-1/4">
              {/* Featured Coaches Banner */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-500" />
                    Featured Coaches
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {featuredCoaches.map((coach) => (
                    <div
                      key={coach.id}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <img
                        src={coach.avatar}
                        alt={coach.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{coach.name}</p>
                        <p className="text-xs text-gray-500">{coach.title}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span className="text-xs font-medium">
                            {coach.rating}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Advanced Filters */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Filters</CardTitle>
                    {hasActiveFilters && (
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        Clear All
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Quick Search */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Search
                    </label>
                    <Input
                      placeholder="Search coaches..."
                      value={filters.query}
                      onChange={(e) =>
                        handleSearch({ ...filters, query: e.target.value })
                      }
                    />
                  </div>

                  <Separator />

                  {/* Experience Level */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Experience Level
                    </label>
                    <Select
                      value={filters.experience}
                      onValueChange={(value) =>
                        handleSearch({ ...filters, experience: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any experience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-5">0-5 years</SelectItem>
                        <SelectItem value="5-10">5-10 years</SelectItem>
                        <SelectItem value="10-15">10-15 years</SelectItem>
                        <SelectItem value="15-20">15-20 years</SelectItem>
                        <SelectItem value="20-100">20+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Rating */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Minimum Rating
                    </label>
                    <Select
                      value={filters.rating}
                      onValueChange={(value) =>
                        handleSearch({ ...filters, rating: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any rating" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4.5">4.5+ stars</SelectItem>
                        <SelectItem value="4.0">4.0+ stars</SelectItem>
                        <SelectItem value="3.5">3.5+ stars</SelectItem>
                        <SelectItem value="3.0">3.0+ stars</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">
                    {filteredCoaches.length} coach
                    {filteredCoaches.length !== 1 ? "s" : ""} found
                  </span>
                  {hasActiveFilters && (
                    <span className="ml-2">• Filtered results</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="experience">Most Experienced</SelectItem>
                    <SelectItem value="sessions">Most Sessions</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex border rounded-md">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    Total Coaches
                  </div>
                  <div className="text-sm text-gray-600">
                    {filteredCoaches.length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    Avg Rating
                  </div>
                  <div className="text-sm text-gray-600">
                    {filteredCoaches.length > 0
                      ? (
                          filteredCoaches.reduce(
                            (sum, coach) => sum + coach.rating,
                            0,
                          ) / filteredCoaches.length
                        ).toFixed(1)
                      : "0.0"}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    Available
                  </div>
                  <div className="text-sm text-gray-600">
                    {
                      filteredCoaches.filter(
                        (coach) => coach.availableSlots.length > 0,
                      ).length
                    }
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    Total Sessions
                  </div>
                  <div className="text-sm text-gray-600">
                    {filteredCoaches.reduce(
                      (sum, coach) => sum + coach.totalSessions,
                      0,
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Results Grid/List */}
            <div className="mb-8">
              {loading ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Loading coaches...
                    </h3>
                    <p className="text-gray-500">
                      Please wait while we fetch the latest coach information.
                    </p>
                  </CardContent>
                </Card>
              ) : filteredCoaches.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No coaches found
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Try adjusting your search criteria to find more coaches.
                    </p>
                    <Button onClick={clearFilters}>Clear Filters</Button>
                  </CardContent>
                </Card>
              ) : (
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                      : "space-y-4"
                  }
                >
                  {filteredCoaches.map((coach) => (
                    <div
                      key={coach.id}
                      className={viewMode === "list" ? "w-full" : ""}
                    >
                      <CoachCard
                        coach={coach}
                        isAuthenticated={isAuthenticated}
                        showLimitedDetails={!isAuthenticated}
                      />
                    </div>
                  ))}
                </div>
              )}

              {filteredCoaches.length > 0 && filteredCoaches.length >= 12 && (
                <div className="text-center mt-8">
                  <Button size="lg">Load More Coaches</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CoachDirectory;
