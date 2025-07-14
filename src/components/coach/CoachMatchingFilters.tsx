import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, Filter, ChevronDown } from "lucide-react";

interface MatchingFilters {
  coaching?: string[];
  experienceLevel?: "beginner" | "intermediate" | "coach" | "master";
  minRating?: number;
  maxHourlyRate?: number;
  languages?: string[];
  availability?: string[];
  location?: string;
}

interface CoachMatchingFiltersProps {
  onFiltersChange: (filters: MatchingFilters) => void;
  onSearchChange: (query: string) => void;
  searchQuery: string;
  isLoading: boolean;
  totalResults: number;
}

const coachingOptions = [
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

const languageOptions = [
  "English",
  "Spanish",
  "French",
  "German",
  "Mandarin",
  "Japanese",
  "Korean",
  "Portuguese",
  "Russian",
  "Arabic",
];

const availabilityOptions = [
  "Weekdays",
  "Weekends",
  "Mornings",
  "Afternoons",
  "Evenings",
  "Flexible",
];

export const CoachMatchingFilters: React.FC<CoachMatchingFiltersProps> = ({
  onFiltersChange,
  onSearchChange,
  searchQuery,
  isLoading,
  totalResults,
}) => {
  const [filters, setFilters] = useState<MatchingFilters>({});
  const [showCoachingDropdown, setShowCoachingDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showAvailabilityDropdown, setShowAvailabilityDropdown] =
    useState(false);
  const [hourlyRateRange, setHourlyRateRange] = useState<number[]>([0, 500]);

  const updateFilter = (key: keyof MatchingFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const toggleCoaching = (coaching: string) => {
    const current = filters.coaching || [];
    const updated = current.includes(coaching)
      ? current.filter((e) => e !== coaching)
      : [...current, coaching];
    updateFilter("coaching", updated);
  };

  const toggleLanguage = (language: string) => {
    const current = filters.languages || [];
    const updated = current.includes(language)
      ? current.filter((l) => l !== language)
      : [...current, language];
    updateFilter("languages", updated);
  };

  const toggleAvailability = (availability: string) => {
    const current = filters.availability || [];
    const updated = current.includes(availability)
      ? current.filter((a) => a !== availability)
      : [...current, availability];
    updateFilter("availability", updated);
  };

  const clearAllFilters = () => {
    setFilters({});
    setHourlyRateRange([0, 500]);
    onFiltersChange({});
    onSearchChange("");
  };

  const hasActiveFilters = Object.keys(filters).some((key) => {
    const value = filters[key as keyof MatchingFilters];
    return Array.isArray(value) ? value.length > 0 : value !== undefined;
  });

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search coaches by name, skills, or company..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Filters</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {isLoading ? "Searching..." : `${totalResults} coaches found`}
              </span>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                  Clear All
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Coaching */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Coaching Areas
              </label>
              <Button
                variant="outline"
                onClick={() => setShowCoachingDropdown(!showCoachingDropdown)}
                className="w-full justify-between"
              >
                <span>
                  {filters.coaching?.length
                    ? `${filters.coaching.length} selected`
                    : "Select coaching areas"}
                </span>
                <ChevronDown className="w-4 h-4" />
              </Button>
              {showCoachingDropdown && (
                <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {coachingOptions.map((coaching) => (
                    <div
                      key={coaching}
                      className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-50"
                    >
                      <Checkbox
                        id={`coaching-${coaching}`}
                        checked={filters.coaching?.includes(coaching) || false}
                        onChange={() => toggleCoaching(coaching)}
                      />
                      <span className="text-sm text-gray-700">{coaching}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Coaching Tags */}
            {filters.coaching && filters.coaching.length > 0 && (
              <div className="md:col-span-2 lg:col-span-4">
                {filters.coaching.map((coaching) => (
                  <Badge key={coaching} variant="default" className="mr-2 mb-2">
                    {coaching}
                    <X
                      className="w-3 h-3 ml-1 cursor-pointer"
                      onClick={() => toggleCoaching(coaching)}
                    />
                  </Badge>
                ))}
              </div>
            )}

            {/* Experience Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Experience Level
              </label>
              <Select
                value={filters.experienceLevel || ""}
                onValueChange={(value) =>
                  updateFilter("experienceLevel", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="coach">Coach</SelectItem>
                  <SelectItem value="master">Master</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Rating
              </label>
              <Select
                value={filters.minRating?.toString() || ""}
                onValueChange={(value) =>
                  updateFilter("minRating", parseFloat(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4.5">4.5+ ⭐</SelectItem>
                  <SelectItem value="4.0">4.0+ ⭐</SelectItem>
                  <SelectItem value="3.5">3.5+ ⭐</SelectItem>
                  <SelectItem value="3.0">3.0+ ⭐</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Hourly Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Hourly Rate: ${hourlyRateRange[1]}
              </label>
              <Slider
                value={hourlyRateRange}
                onValueChange={(value) => {
                  setHourlyRateRange(value);
                  updateFilter("maxHourlyRate", value[1]);
                }}
                max={500}
                min={0}
                step={25}
                className="w-full"
              />
            </div>

            {/* Languages */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Languages
              </label>
              <Button
                variant="outline"
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                className="w-full justify-between"
              >
                <span>
                  {filters.languages?.length
                    ? `${filters.languages.length} selected`
                    : "Any language"}
                </span>
                <ChevronDown className="w-4 h-4" />
              </Button>
              {showLanguageDropdown && (
                <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {languageOptions.map((language) => (
                    <div
                      key={language}
                      className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-50"
                    >
                      <Checkbox
                        id={`language-${language}`}
                        checked={filters.languages?.includes(language) || false}
                        onChange={() => toggleLanguage(language)}
                      />
                      <span className="text-sm text-gray-700">{language}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Click outside to close dropdowns */}
      {(showCoachingDropdown || showLanguageDropdown) && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => {
            setShowCoachingDropdown(false);
            setShowLanguageDropdown(false);
            setShowAvailabilityDropdown(false);
          }}
        />
      )}
    </div>
  );
};
