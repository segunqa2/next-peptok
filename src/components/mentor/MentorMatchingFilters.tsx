import React, { useState } from "react";
import {
  Search,
  Filter,
  X,
  ChevronDown,
  Star,
  DollarSign,
  Clock,
  Globe,
} from "lucide-react";

interface MatchingFilters {
  expertise?: string[];
  experienceLevel?: "beginner" | "intermediate" | "expert" | "master";
  minRating?: number;
  maxHourlyRate?: number;
  languages?: string[];
  availability?: {
    dayOfWeek: number;
    timeSlot: string;
  };
  timezone?: string;
}

interface MentorMatchingFiltersProps {
  filters: MatchingFilters;
  onFiltersChange: (filters: MatchingFilters) => void;
  onSearch: (query: string) => void;
  searchQuery: string;
  isLoading?: boolean;
  totalResults?: number;
}

const expertiseOptions = [
  "Frontend Development",
  "Backend Development",
  "Full Stack Development",
  "Mobile Development",
  "DevOps",
  "Data Science",
  "Machine Learning",
  "Product Management",
  "UX Design",
  "UI Design",
  "Marketing",
  "Sales",
  "Leadership",
  "Project Management",
  "Entrepreneurship",
];

const languageOptions = [
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Mandarin",
  "Japanese",
  "Korean",
  "Arabic",
  "Hindi",
  "Russian",
];

const timeSlots = [
  "Early Morning (6-9 AM)",
  "Morning (9-12 PM)",
  "Afternoon (12-5 PM)",
  "Evening (5-8 PM)",
  "Late Evening (8-11 PM)",
];

const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const MentorMatchingFilters: React.FC<MentorMatchingFiltersProps> = ({
  filters,
  onFiltersChange,
  onSearch,
  searchQuery,
  isLoading = false,
  totalResults = 0,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showExpertiseDropdown, setShowExpertiseDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  const updateFilter = (key: keyof MatchingFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleExpertise = (expertise: string) => {
    const current = filters.expertise || [];
    const updated = current.includes(expertise)
      ? current.filter((e) => e !== expertise)
      : [...current, expertise];
    updateFilter("expertise", updated);
  };

  const toggleLanguage = (language: string) => {
    const current = filters.languages || [];
    const updated = current.includes(language)
      ? current.filter((l) => l !== language)
      : [...current, language];
    updateFilter("languages", updated);
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const activeFilterCount = Object.keys(filters).filter((key) => {
    const value = filters[key as keyof MatchingFilters];
    return (
      value !== undefined &&
      value !== null &&
      (Array.isArray(value) ? value.length > 0 : true)
    );
  }).length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search coaches by name, skills, or company..."
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <Filter className="w-5 h-5" />
          <span className="font-medium">Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          />
        </button>

        <div className="text-sm text-gray-500">
          {isLoading ? "Searching..." : `${totalResults} mentors found`}
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="space-y-6 pt-4 border-t border-gray-200">
          {/* Expertise */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expertise Areas
            </label>
            <div className="relative">
              <button
                onClick={() => setShowExpertiseDropdown(!showExpertiseDropdown)}
                className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
              >
                <span className="text-gray-700">
                  {filters.expertise?.length
                    ? `${filters.expertise.length} selected`
                    : "Select expertise areas"}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {showExpertiseDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {expertiseOptions.map((expertise) => (
                    <label
                      key={expertise}
                      className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={
                          filters.expertise?.includes(expertise) || false
                        }
                        onChange={() => toggleExpertise(expertise)}
                        className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{expertise}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Expertise Tags */}
            {filters.expertise && filters.expertise.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {filters.expertise.map((expertise) => (
                  <span
                    key={expertise}
                    className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs"
                  >
                    {expertise}
                    <button
                      onClick={() => toggleExpertise(expertise)}
                      className="ml-1 hover:text-blue-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Experience Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Experience Level
            </label>
            <select
              value={filters.experienceLevel || ""}
              onChange={(e) =>
                updateFilter("experienceLevel", e.target.value || undefined)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Any level</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="expert">Expert</option>
              <option value="master">Master</option>
            </select>
          </div>

          {/* Rating and Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Minimum Rating */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Star className="w-4 h-4 mr-1" />
                Minimum Rating
              </label>
              <select
                value={filters.minRating || ""}
                onChange={(e) =>
                  updateFilter(
                    "minRating",
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Any rating</option>
                <option value="4.5">4.5+ stars</option>
                <option value="4.0">4.0+ stars</option>
                <option value="3.5">3.5+ stars</option>
                <option value="3.0">3.0+ stars</option>
              </select>
            </div>

            {/* Maximum Hourly Rate */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 mr-1" />
                Max Hourly Rate
              </label>
              <select
                value={filters.maxHourlyRate || ""}
                onChange={(e) =>
                  updateFilter(
                    "maxHourlyRate",
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Any rate</option>
                <option value="50">Under $50/hr</option>
                <option value="100">Under $100/hr</option>
                <option value="150">Under $150/hr</option>
                <option value="200">Under $200/hr</option>
                <option value="300">Under $300/hr</option>
              </select>
            </div>
          </div>

          {/* Languages */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Globe className="w-4 h-4 mr-1" />
              Languages
            </label>
            <div className="relative">
              <button
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
              >
                <span className="text-gray-700">
                  {filters.languages?.length
                    ? `${filters.languages.length} selected`
                    : "Select languages"}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {showLanguageDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {languageOptions.map((language) => (
                    <label
                      key={language}
                      className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.languages?.includes(language) || false}
                        onChange={() => toggleLanguage(language)}
                        className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{language}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Language Tags */}
            {filters.languages && filters.languages.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {filters.languages.map((language) => (
                  <span
                    key={language}
                    className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs"
                  >
                    {language}
                    <button
                      onClick={() => toggleLanguage(language)}
                      className="ml-1 hover:text-green-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Availability */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 mr-1" />
              Availability
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={filters.availability?.dayOfWeek || ""}
                onChange={(e) =>
                  updateFilter(
                    "availability",
                    e.target.value
                      ? {
                          ...filters.availability,
                          dayOfWeek: Number(e.target.value),
                        }
                      : undefined,
                  )
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Any day</option>
                {daysOfWeek.map((day, index) => (
                  <option key={day} value={index}>
                    {day}
                  </option>
                ))}
              </select>

              <select
                value={filters.availability?.timeSlot || ""}
                onChange={(e) =>
                  updateFilter(
                    "availability",
                    e.target.value
                      ? { ...filters.availability, timeSlot: e.target.value }
                      : undefined,
                  )
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Any time</option>
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {activeFilterCount > 0 && (
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                onClick={clearAllFilters}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Clear all filters</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Click outside to close dropdowns */}
      {(showExpertiseDropdown || showLanguageDropdown) && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => {
            setShowExpertiseDropdown(false);
            setShowLanguageDropdown(false);
          }}
        />
      )}
    </div>
  );
};
