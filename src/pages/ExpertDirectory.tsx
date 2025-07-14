import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ExpertCard from "@/components/expert/ExpertCard";
import ExpertSearch from "@/components/expert/ExpertSearch";
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
import { api } from "@/services/api";
import { Expert } from "@/types";
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
} from "lucide-react";

interface SearchFilters {
  query: string;
  expertise: string[];
  experience: string;
  rating: string;
  availability: string;
  priceRange: number[];
  location: string;
}

const ExpertDirectory = () => {
  const [filteredExperts, setFilteredExperts] = useState<Expert[]>(mockExperts);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("rating");
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    expertise: [],
    experience: "",
    rating: "",
    availability: "",
    priceRange: [0, 500],
    location: "",
  });

  const handleSearch = (newFilters: any) => {
    let filtered = mockExperts;

    // Filter by search query
    if (newFilters.query) {
      const query = newFilters.query.toLowerCase();
      filtered = filtered.filter(
        (expert) =>
          expert.name.toLowerCase().includes(query) ||
          expert.title.toLowerCase().includes(query) ||
          expert.company.toLowerCase().includes(query) ||
          expert.expertise.some((skill) => skill.toLowerCase().includes(query)),
      );
    }

    // Filter by expertise
    if (newFilters.expertise.length > 0) {
      filtered = filtered.filter((expert) =>
        newFilters.expertise.some((skill) => expert.expertise.includes(skill)),
      );
    }

    // Filter by experience
    if (newFilters.experience) {
      const [min, max] = newFilters.experience.includes("+")
        ? [parseInt(newFilters.experience), Infinity]
        : newFilters.experience.split("-").map(Number);

      filtered = filtered.filter(
        (expert) =>
          expert.experience >= min &&
          (max === undefined || expert.experience <= max),
      );
    }

    // Filter by rating
    if (newFilters.rating) {
      const minRating = parseFloat(newFilters.rating.replace("+", ""));
      filtered = filtered.filter((expert) => expert.rating >= minRating);
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
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    setFilteredExperts(filtered);
    setFilters({ ...filters, ...newFilters });
  };

  const clearFilters = () => {
    const clearedFilters = {
      query: "",
      expertise: [],
      experience: "",
      rating: "",
      availability: "",
      priceRange: [0, 500],
      location: "",
    };
    setFilters(clearedFilters);
    setFilteredExperts(mockExperts);
  };

  const featuredExperts = mockExperts
    .filter((expert) => expert.rating >= 4.8)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-white to-blue-100/30"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl"></div>
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgb(59 130 246 / 0.05) 1px, transparent 0)`,
            backgroundSize: "50px 50px",
          }}
        ></div>
      </div>

      <div className="relative z-10">
        <Header userType="employee" />

        <main className="container py-8">
          <div className="space-y-8">
            {/* Enhanced Header */}
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="space-y-2">
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                    Expert Directory
                  </h1>
                  <p className="text-xl text-muted-foreground">
                    Browse our network of {mockExperts.length}+ experienced
                    mentors and find the perfect match for your development
                    goals.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </div>
              </div>

              {/* Featured Experts Banner */}
              <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Award className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-blue-900">
                      Featured Experts
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {featuredExperts.map((expert) => (
                      <div
                        key={expert.id}
                        className="flex items-center space-x-3 p-3 bg-white/80 rounded-lg border border-blue-200"
                      >
                        <img
                          src={expert.avatar}
                          alt={expert.name}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">
                            {expert.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {expert.title}
                          </p>
                          <div className="flex items-center space-x-1 mt-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs font-medium">
                              {expert.rating}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Enhanced Filters Sidebar */}
              {showFilters && (
                <div className="lg:col-span-1 space-y-6">
                  <Card className="sticky top-4">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center space-x-2">
                          <Filter className="h-5 w-5" />
                          <span>Filters</span>
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearFilters}
                        >
                          Clear
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Search */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Search</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search experts..."
                            value={filters.query}
                            onChange={(e) =>
                              handleSearch({
                                ...filters,
                                query: e.target.value,
                              })
                            }
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <Separator />

                      {/* Experience Level */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Experience
                        </label>
                        <Select
                          value={filters.experience}
                          onValueChange={(value) =>
                            handleSearch({ ...filters, experience: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select experience" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0-5">0-5 years</SelectItem>
                            <SelectItem value="5-10">5-10 years</SelectItem>
                            <SelectItem value="10-15">10-15 years</SelectItem>
                            <SelectItem value="15-20">15-20 years</SelectItem>
                            <SelectItem value="20+">20+ years</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Rating */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Minimum Rating
                        </label>
                        <Select
                          value={filters.rating}
                          onValueChange={(value) =>
                            handleSearch({ ...filters, rating: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select rating" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="4.5+">4.5+ stars</SelectItem>
                            <SelectItem value="4.0+">4.0+ stars</SelectItem>
                            <SelectItem value="3.5+">3.5+ stars</SelectItem>
                            <SelectItem value="3.0+">3.0+ stars</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Availability */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Availability
                        </label>
                        <Select
                          value={filters.availability}
                          onValueChange={(value) =>
                            handleSearch({ ...filters, availability: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select availability" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="this-week">This week</SelectItem>
                            <SelectItem value="next-week">Next week</SelectItem>
                            <SelectItem value="this-month">
                              This month
                            </SelectItem>
                            <SelectItem value="flexible">Flexible</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Price Range */}
                      <div className="space-y-3">
                        <label className="text-sm font-medium">
                          Price Range (per hour)
                        </label>
                        <Slider
                          value={filters.priceRange}
                          onValueChange={(value) =>
                            handleSearch({ ...filters, priceRange: value })
                          }
                          max={500}
                          min={0}
                          step={25}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>${filters.priceRange[0]}</span>
                          <span>${filters.priceRange[1]}+</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Results Section */}
              <div className={showFilters ? "lg:col-span-3" : "lg:col-span-4"}>
                <div className="space-y-6">
                  {/* Results Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <p className="text-muted-foreground">
                        {filteredExperts.length} expert
                        {filteredExperts.length !== 1 ? "s" : ""} found
                      </p>
                      {(filters.query ||
                        filters.expertise.length > 0 ||
                        filters.experience ||
                        filters.rating) && (
                        <Badge variant="secondary">Filtered</Badge>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        Sort by:
                      </span>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rating">Rating</SelectItem>
                          <SelectItem value="experience">Experience</SelectItem>
                          <SelectItem value="sessions">Sessions</SelectItem>
                          <SelectItem value="name">Name</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="p-4">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Total Experts
                          </p>
                          <p className="text-lg font-semibold">
                            {filteredExperts.length}
                          </p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-yellow-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Avg Rating
                          </p>
                          <p className="text-lg font-semibold">
                            {filteredExperts.length > 0
                              ? (
                                  filteredExperts.reduce(
                                    (sum, expert) => sum + expert.rating,
                                    0,
                                  ) / filteredExperts.length
                                ).toFixed(1)
                              : "0.0"}
                          </p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Available Now
                          </p>
                          <p className="text-lg font-semibold">
                            {
                              filteredExperts.filter(
                                (expert) => expert.availableSlots.length > 0,
                              ).length
                            }
                          </p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Total Sessions
                          </p>
                          <p className="text-lg font-semibold">
                            {filteredExperts.reduce(
                              (sum, expert) => sum + expert.totalSessions,
                              0,
                            )}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Results Grid/List */}
                  {filteredExperts.length === 0 ? (
                    <Card className="p-12 text-center">
                      <div className="space-y-4">
                        <Search className="h-12 w-12 text-muted-foreground mx-auto" />
                        <h3 className="text-lg font-semibold">
                          No experts found
                        </h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                          Try adjusting your search criteria or removing some
                          filters to see more results.
                        </p>
                        <Button onClick={clearFilters} variant="outline">
                          Clear all filters
                        </Button>
                      </div>
                    </Card>
                  ) : (
                    <div
                      className={
                        viewMode === "grid"
                          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                          : "space-y-4"
                      }
                    >
                      {filteredExperts.map((expert) => (
                        <div
                          key={expert.id}
                          className={`transition-all duration-300 hover:scale-105 ${
                            viewMode === "list"
                              ? "transform-none hover:scale-100"
                              : ""
                          }`}
                        >
                          <ExpertCard expert={expert} />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Load More Button */}
                  {filteredExperts.length > 0 &&
                    filteredExperts.length >= 12 && (
                      <div className="text-center pt-8">
                        <Button variant="outline" size="lg">
                          Load More Experts
                        </Button>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default ExpertDirectory;
