import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";

interface CoachSearchProps {
  onSearch: (filters: {
    query: string;
    coaching: string[];
    experience: string;
    rating: string;
    availability: string;
    priceRange: number[];
    location: string;
  }) => void;
}

const coachingAreas = [
  "Leadership",
  "Software Development",
  "Team Building",
  "Data Analysis",
  "Business Intelligence",
  "Strategy",
  "Marketing",
  "Brand Building",
  "Growth",
  "Financial Planning",
  "Operations",
  "Product Strategy",
  "User Experience",
  "Innovation",
  "Sales Management",
  "Revenue Growth",
];

const CoachSearch = ({ onSearch }: CoachSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    query: "",
    coaching: [],
    experience: "",
    rating: "",
    availability: "",
    priceRange: [0, 500],
    location: "",
  });

  const handleCoachingToggle = (area: string) => {
    const newCoaching = filters.coaching.includes(area)
      ? filters.coaching.filter((e) => e !== area)
      : [...filters.coaching, area];

    const newFilters = { ...filters, coaching: newCoaching };
    setFilters(newFilters);
    onSearch(newFilters);
  };

  const handleSearch = () => {
    const newFilters = { ...filters, query: searchQuery };
    setFilters(newFilters);
    onSearch(newFilters);
  };

  const clearFilters = () => {
    const defaultFilters = {
      query: "",
      coaching: [],
      experience: "",
      rating: "",
      availability: "",
      priceRange: [0, 500],
      location: "",
    };
    setFilters(defaultFilters);
    setSearchQuery("");
    onSearch(defaultFilters);
  };

  const hasActiveFilters =
    filters.coaching.length > 0 ||
    filters.experience ||
    filters.rating ||
    filters.availability ||
    filters.location;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search coaches by name, title, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch}>
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
        </div>

        {/* Coaching Areas */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Coaching Areas</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {coachingAreas.map((area) => (
              <Badge
                key={area}
                variant={
                  filters.coaching.includes(area) ? "default" : "outline"
                }
                className="cursor-pointer"
                onClick={() => handleCoachingToggle(area)}
              >
                {area}
              </Badge>
            ))}
          </div>
        </div>

        {/* Selected Coaching Tags */}
        {filters.coaching && filters.coaching.length > 0 && (
          <div className="mb-4">
            {filters.coaching.map((coaching) => (
              <Badge key={coaching} variant="default" className="mr-2 mb-2">
                {coaching}
                <X
                  className="w-3 h-3 ml-1 cursor-pointer"
                  onClick={() => handleCoachingToggle(coaching)}
                />
              </Badge>
            ))}
          </div>
        )}

        {hasActiveFilters && (
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear all filters
            </Button>
          </div>
        )}

        <div className="text-center text-sm text-gray-500">
          {searchQuery && `Searching for "${searchQuery}"`}
          {filters.coaching.length > 0 &&
            ` • ${filters.coaching.length} coaching areas selected`}
        </div>
      </CardContent>
    </Card>
  );
};

export default CoachSearch;
