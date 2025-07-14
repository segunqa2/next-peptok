import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, X } from "lucide-react";

interface ExpertSearchProps {
  onSearch: (filters: SearchFilters) => void;
}

interface SearchFilters {
  query: string;
  expertise: string[];
  experience: string;
  rating: string;
  availability: string;
}

const expertiseAreas = [
  "Leadership",
  "Software Development",
  "Data Analysis",
  "Marketing Strategy",
  "Financial Planning",
  "Product Strategy",
  "Sales Management",
  "Project Management",
  "Business Intelligence",
  "Operations",
];

const ExpertSearch = ({ onSearch }: ExpertSearchProps) => {
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    expertise: [],
    experience: "",
    rating: "",
    availability: "",
  });

  const handleExpertiseToggle = (area: string) => {
    const newExpertise = filters.expertise.includes(area)
      ? filters.expertise.filter((e) => e !== area)
      : [...filters.expertise, area];

    const newFilters = { ...filters, expertise: newExpertise };
    setFilters(newFilters);
    onSearch(newFilters);
  };

  const handleInputChange = (field: keyof SearchFilters, value: string) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onSearch(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters: SearchFilters = {
      query: "",
      expertise: [],
      experience: "",
      rating: "",
      availability: "",
    };
    setFilters(clearedFilters);
    onSearch(clearedFilters);
  };

  const hasActiveFilters =
    filters.query ||
    filters.expertise.length > 0 ||
    filters.experience ||
    filters.rating ||
    filters.availability;

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search experts by name, title, or company..."
          value={filters.query}
          onChange={(e) => handleInputChange("query", e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select
          value={filters.experience}
          onValueChange={(value) => handleInputChange("experience", value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Experience" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0-5">0-5 years</SelectItem>
            <SelectItem value="5-10">5-10 years</SelectItem>
            <SelectItem value="10-15">10-15 years</SelectItem>
            <SelectItem value="15-20">15-20 years</SelectItem>
            <SelectItem value="20+">20+ years</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.rating}
          onValueChange={(value) => handleInputChange("rating", value)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="4.5+">4.5+ stars</SelectItem>
            <SelectItem value="4.0+">4.0+ stars</SelectItem>
            <SelectItem value="3.5+">3.5+ stars</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.availability}
          onValueChange={(value) => handleInputChange("availability", value)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Availability" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="this-week">This week</SelectItem>
            <SelectItem value="next-week">Next week</SelectItem>
            <SelectItem value="this-month">This month</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters} className="gap-2">
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Expertise Areas */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Expertise Areas</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {expertiseAreas.map((area) => (
            <Badge
              key={area}
              variant={filters.expertise.includes(area) ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary/10"
              onClick={() => handleExpertiseToggle(area)}
            >
              {area}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExpertSearch;
