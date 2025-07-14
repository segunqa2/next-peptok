import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Star,
  Clock,
  DollarSign,
  Users,
  Filter,
  MapPin,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { Coach } from "@/types";
import { api } from "@/services/api";
import { toast } from "sonner";

interface CoachSearchProps {
  selectedExpertise: string[];
  budgetRange?: { min: number; max: number };
  onCoachSelect?: (coach: Coach) => void;
  selectedCoaches?: Coach[];
  className?: string;
}

export function CoachSearch({
  selectedExpertise,
  budgetRange,
  onCoachSelect,
  selectedCoaches = [],
  className,
}: CoachSearchProps) {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    expertise: selectedExpertise,
    hourlyRateMin: budgetRange?.min || undefined,
    hourlyRateMax: budgetRange?.max || undefined,
    availability: true,
    location: "",
  });

  // Search coaches when filters change
  useEffect(() => {
    searchCoaches();
  }, [filters]);

  // Update filters when props change
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      expertise: selectedExpertise,
      hourlyRateMin: budgetRange?.min || undefined,
      hourlyRateMax: budgetRange?.max || undefined,
    }));
  }, [selectedExpertise, budgetRange]);

  const searchCoaches = async () => {
    try {
      setLoading(true);
      const results = await api.searchCoachesForMentorship(filters);

      // Apply client-side text search if query exists
      let filteredResults = results;
      if (searchQuery.trim()) {
        filteredResults = results.filter(
          (coach) =>
            coach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            coach.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            coach.coaching.some((skill) =>
              skill.toLowerCase().includes(searchQuery.toLowerCase()),
            ),
        );
      }

      setCoaches(filteredResults);
    } catch (error) {
      console.error("Failed to search coaches:", error);
      toast.error("Failed to search coaches. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    searchCoaches();
  };

  const isCoachSelected = (coachId: string) => {
    return selectedCoaches.some((c) => c.id === coachId);
  };

  const getExpertiseMatch = (coach: Coach) => {
    if (!selectedExpertise.length) return 0;

    const matches = coach.coaching.filter((skill) =>
      selectedExpertise.some(
        (exp) =>
          skill.toLowerCase().includes(exp.toLowerCase()) ||
          exp.toLowerCase().includes(skill.toLowerCase()),
      ),
    );

    return Math.round((matches.length / selectedExpertise.length) * 100);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          Find Coaches
        </CardTitle>
        <CardDescription>
          Search and select coaches that match your program requirements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Search by name, title, or expertise..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} disabled={loading}>
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <Label className="text-xs font-medium">Location</Label>
            <Input
              placeholder="Any location"
              value={filters.location}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, location: e.target.value }))
              }
            />
          </div>
          <div>
            <Label className="text-xs font-medium">Min Rate ($/hr)</Label>
            <Input
              type="number"
              placeholder="Min"
              value={filters.hourlyRateMin || ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  hourlyRateMin: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                }))
              }
            />
          </div>
          <div>
            <Label className="text-xs font-medium">Max Rate ($/hr)</Label>
            <Input
              type="number"
              placeholder="Max"
              value={filters.hourlyRateMax || ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  hourlyRateMax: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                }))
              }
            />
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Searching coaches...</p>
            </div>
          ) : coaches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No coaches found matching your criteria.</p>
              <p className="text-sm">
                Try adjusting your filters or search terms.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Found {coaches.length} coach{coaches.length !== 1 ? "es" : ""}
                </p>
                <Badge variant="outline">
                  {selectedCoaches.length} selected
                </Badge>
              </div>

              {coaches.map((coach) => {
                const expertiseMatch = getExpertiseMatch(coach);
                const isSelected = isCoachSelected(coach.id);

                return (
                  <Card
                    key={coach.id}
                    className={`transition-all cursor-pointer hover:shadow-md ${
                      isSelected ? "ring-2 ring-primary bg-primary/5" : ""
                    }`}
                    onClick={() => onCoachSelect?.(coach)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={coach.avatar} alt={coach.name} />
                          <AvatarFallback>
                            {coach.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg flex items-center gap-2">
                                {coach.name}
                                {isSelected && (
                                  <CheckCircle className="w-4 h-4 text-primary" />
                                )}
                              </h3>
                              <p className="text-muted-foreground">
                                {coach.title}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {coach.company}
                              </p>
                            </div>

                            <div className="text-right">
                              <div className="flex items-center gap-1 mb-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-medium">
                                  {coach.rating}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {coach.totalSessions} sessions
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {coach.coaching.slice(0, 4).map((skill) => {
                              const isMatch = selectedExpertise.some(
                                (exp) =>
                                  skill
                                    .toLowerCase()
                                    .includes(exp.toLowerCase()) ||
                                  exp
                                    .toLowerCase()
                                    .includes(skill.toLowerCase()),
                              );

                              return (
                                <Badge
                                  key={skill}
                                  variant={isMatch ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {skill}
                                </Badge>
                              );
                            })}
                            {coach.coaching.length > 4 && (
                              <Badge variant="outline" className="text-xs">
                                +{coach.coaching.length - 4} more
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {coach.experience} years
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Available {coach.availableSlots?.length || 0}{" "}
                              slots
                            </div>
                            {expertiseMatch > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {expertiseMatch}% match
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {selectedCoaches.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-3">
              Selected Coaches ({selectedCoaches.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {selectedCoaches.map((coach) => (
                <Badge
                  key={coach.id}
                  variant="default"
                  className="flex items-center gap-1"
                >
                  {coach.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1 hover:bg-transparent"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCoachSelect?.(coach); // This will toggle selection
                    }}
                  >
                    ×
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
