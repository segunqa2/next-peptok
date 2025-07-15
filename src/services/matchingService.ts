import { apiEnhanced } from "./apiEnhanced";

export interface MatchingWeights {
  skillMatch: number;
  experience: number;
  rating: number;
  availability: number;
  price: number;
}

export interface MatchingRequest {
  id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  preferredExperience: string;
  budget: number;
  timeline: {
    startDate: string;
    endDate: string;
  };
  teamMembers: string[];
  goals: string[];
}

export interface CoachMatch {
  id: string;
  name: string;
  title: string;
  skills: string[];
  experience: string;
  rating: number;
  availability: string;
  hourlyRate: number;
  profileImage?: string;
  bio: string;
  expertise: string[];
  yearsExperience: number;
  languages: string[];
  timezone: string;
  matchScore: number;
  matchReasons: string[];
  estimatedCost: number;
}

export interface MatchingResult {
  requestId: string;
  matches: CoachMatch[];
  algorithmVersion: string;
  configUsed: MatchingWeights;
  timestamp: string;
  totalMatches: number;
}

class MatchingService {
  private async getAlgorithmConfiguration(): Promise<MatchingWeights> {
    try {
      const response = await apiEnhanced.getMatchingConfiguration();
      if (response.success && response.data) {
        return response.data.weights;
      }
    } catch (error) {
      console.warn(
        "Failed to load algorithm configuration, using defaults:",
        error,
      );
    }

    // Default weights if admin configuration is not available
    return {
      skillMatch: 30,
      experience: 25,
      rating: 20,
      availability: 15,
      price: 10,
    };
  }

  private calculateMatchScore(
    coach: Omit<CoachMatch, "matchScore" | "matchReasons" | "estimatedCost">,
    request: MatchingRequest,
    weights: MatchingWeights,
  ): { score: number; reasons: string[] } {
    let totalScore = 0;
    const reasons: string[] = [];

    // 1. Skill Match Score
    const skillOverlap = coach.skills.filter((skill) =>
      request.requiredSkills.some(
        (reqSkill) =>
          skill.toLowerCase().includes(reqSkill.toLowerCase()) ||
          reqSkill.toLowerCase().includes(skill.toLowerCase()),
      ),
    );
    const skillScore = Math.min(
      skillOverlap.length / Math.max(request.requiredSkills.length, 1),
      1,
    );
    totalScore += skillScore * (weights.skillMatch / 100);

    if (skillScore > 0.7) {
      reasons.push(`Strong skill match (${Math.round(skillScore * 100)}%)`);
    }

    // 2. Experience Score
    const experienceMapping = {
      junior: 1,
      "mid-level": 2,
      senior: 3,
      expert: 4,
    };
    const coachExp =
      experienceMapping[coach.experience as keyof typeof experienceMapping] ||
      2;
    const reqExp =
      experienceMapping[
        request.preferredExperience as keyof typeof experienceMapping
      ] || 2;
    const experienceScore = Math.max(0, 1 - Math.abs(coachExp - reqExp) / 3);
    totalScore += experienceScore * (weights.experience / 100);

    if (experienceScore > 0.8) {
      reasons.push(`Perfect experience level match`);
    }

    // 3. Rating Score
    const ratingScore = Math.min(coach.rating / 5, 1);
    totalScore += ratingScore * (weights.rating / 100);

    if (coach.rating >= 4.5) {
      reasons.push(`Excellent rating (${coach.rating}/5)`);
    }

    // 4. Availability Score
    const availabilityScore =
      coach.availability === "immediate"
        ? 1
        : coach.availability === "this_week"
          ? 0.8
          : coach.availability === "next_week"
            ? 0.6
            : 0.4;
    totalScore += availabilityScore * (weights.availability / 100);

    if (availabilityScore >= 0.8) {
      reasons.push(`Quick availability`);
    }

    // 5. Price Score (inverse relationship - lower price = higher score)
    const maxBudget = request.budget || 200;
    const priceScore = Math.max(
      0,
      1 - Math.max(0, coach.hourlyRate - maxBudget) / maxBudget,
    );
    totalScore += priceScore * (weights.price / 100);

    if (coach.hourlyRate <= maxBudget * 0.8) {
      reasons.push(`Within budget ($${coach.hourlyRate}/hr)`);
    }

    return {
      score: Math.round(totalScore * 100) / 100,
      reasons: reasons.length > 0 ? reasons : ["Basic compatibility match"],
    };
  }

  private generateMockCoaches(): Omit<
    CoachMatch,
    "matchScore" | "matchReasons" | "estimatedCost"
  >[] {
        console.warn("Mock coaches disabled - use backend API instead");
    return []; // All mock data removed - use backend API instead

    // Disabled mock data below:
    /* return [
      {
        id: "coach_1",
        name: "Olivia Hayes",
        title: "Senior Marketing Strategist & Sales Consultant",
        skills: [
          "Marketing",
          "Sales Funnel Optimization",
          "Persuasion and Negotiation",
          "Customer Segmentation",
        ],
        experience: "senior",
        rating: 4.9,
        availability: "immediate",
        hourlyRate: 180,
        profileImage:
          "https://images.unsplash.com/photo-1494790108755-2616b612b1-3c?w=150",
        bio: "Senior marketing strategist and sales consultant with over 10 years of experience in building sales funnels and optimizing customer segmentation.",
        expertise: [
          "Marketing Strategy",
          "Sales Funnel Optimization",
          "Negotiation Coaching",
          "Customer Segmentation",
        ],
        yearsExperience: 10,
        languages: ["English"],
        timezone: "PST",
      },
      {
        id: "coach_2",
        name: "John Peters",
        title: "Sales & Marketing Expert",
        skills: [
          "Marketing Strategy",
          "Sales Funnel Optimization",
          "Negotiation Tactics",
          "Customer Segmentation",
        ],
        experience: "senior",
        rating: 4.8,
        availability: "this_week",
        hourlyRate: 160,
        profileImage:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
        bio: "Sales and marketing expert with 15 years of experience helping organizations optimize their sales pipelines and improve conversion rates.",
        expertise: [
          "Sales Funnel Optimization",
          "Marketing Strategy",
          "Negotiation Coaching",
          "Customer Segmentation",
        ],
        yearsExperience: 15,
        languages: ["English"],
        timezone: "EST",
      },
      {
        id: "coach_3",
        name: "Charlotte Brooks",
        title: "Marketing Director & Growth Hacker",
        skills: [
          "Marketing",
          "Sales Funnel Optimization",
          "Persuasion",
          "Customer Segmentation",
        ],
        experience: "senior",
        rating: 4.7,
        availability: "next_week",
        hourlyRate: 150,
        profileImage:
          "https://images.unsplash.com/photo-1494790108755-2616b612b1-c?w=150",
        bio: "Marketing director and growth hacker with expertise in scaling businesses and optimizing sales funnels through strategic marketing.",
        expertise: [
          "Growth Hacking",
          "Sales Funnel Optimization",
          "Customer Segmentation",
          "Marketing Strategy",
        ],
        yearsExperience: 12,
        languages: ["English"],
        timezone: "PST",
      },
      {
        id: "coach_4",
        name: "Michael Bell",
        title: "Sales Consultant & Business Development Expert",
        skills: [
          "Sales Funnel Optimization",
          "Persuasion and Negotiation",
          "Marketing Strategy",
          "Customer Segmentation",
        ],
        experience: "senior",
        rating: 4.8,
        availability: "immediate",
        hourlyRate: 140,
        profileImage:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
        bio: "Sales consultant with expertise in optimizing sales processes and teaching advanced negotiation techniques to drive conversions.",
        expertise: [
          "Sales Funnel Optimization",
          "Negotiation Coaching",
          "Marketing Strategy",
          "Customer Segmentation",
        ],
        yearsExperience: 8,
        languages: ["English"],
        timezone: "PST",
      },
      {
        id: "coach_5",
        name: "Samantha Kelly",
        title: "Marketing Strategist & Negotiation Coach",
        skills: [
          "Marketing",
          "Sales Funnel Optimization",
          "Persuasion and Negotiation",
          "Customer Segmentation",
        ],
        experience: "senior",
        rating: 4.9,
        availability: "this_week",
        hourlyRate: 175,
        profileImage:
          "https://images.unsplash.com/photo-1494790108755-2616b612b1-c?w=150",
        bio: "Experienced marketing strategist and negotiation coach with a strong track record of improving sales performance and customer acquisition.",
        expertise: [
          "Sales Funnel Optimization",
          "Negotiation Coaching",
          "Customer Segmentation",
          "Marketing Strategy",
        ],
        yearsExperience: 10,
        languages: ["English"],
        timezone: "EST",
      },
      {
        id: "coach_6",
        name: "Tom Richards",
        title: "Head of Marketing & Sales Operations",
        skills: [
          "Marketing",
          "Sales Funnel Optimization",
          "Persuasion and Negotiation",
          "Customer Segmentation",
        ],
        experience: "senior",
        rating: 4.7,
        availability: "this_week",
        hourlyRate: 160,
        profileImage:
          "https://images.unsplash.com/photo-1494790108755-2616b612b1-c?w=150",
        bio: "Head of marketing and sales operations with 13 years of experience in leading sales teams and optimizing marketing strategies for better results.",
        expertise: [
          "Sales Funnel Optimization",
          "Marketing Strategy",
          "Customer Segmentation",
          "Negotiation Coaching",
        ],
        yearsExperience: 13,
        languages: ["English"],
        timezone: "EST",
      },
      {
        id: "coach_7",
        name: "Emily Roberts",
        title: "Sales and Marketing Coach",
        skills: [
          "Marketing",
          "Sales Funnel Optimization",
          "Persuasion",
          "Customer Segmentation",
        ],
        experience: "senior",
        rating: 4.6,
        availability: "next_week",
        hourlyRate: 145,
        profileImage:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
        bio: "Sales and marketing coach focused on sales funnel optimization and customer segmentation for businesses looking to improve their conversion rates.",
        expertise: [
          "Sales Funnel Optimization",
          "Customer Segmentation",
          "Marketing Strategy",
          "Persuasion Coaching",
        ],
        yearsExperience: 9,
        languages: ["English"],
        timezone: "CST",
      },
      {
        id: "coach_8",
        name: "James Stewart",
        title: "Senior Sales Funnel Consultant",
        skills: [
          "Sales Funnel Optimization",
          "Persuasion and Negotiation",
          "Customer Segmentation",
          "Marketing Strategy",
        ],
        experience: "senior",
        rating: 4.9,
        availability: "immediate",
        hourlyRate: 155,
        profileImage:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
        bio: "Specialist in sales funnel optimization with 11 years of experience helping companies build effective funnels and improve conversion rates.",
        expertise: [
          "Sales Funnel Optimization",
          "Negotiation Coaching",
          "Customer Segmentation",
          "Marketing Strategy",
        ],
        yearsExperience: 11,
        languages: ["English"],
        timezone: "EST",
      },
      {
        id: "coach_9",
        name: "Sophia Turner",
        title: "Marketing and Sales Performance Coach",
        skills: [
          "Marketing",
          "Sales Funnel Optimization",
          "Persuasion",
          "Customer Segmentation",
        ],
        experience: "senior",
        rating: 4.8,
        availability: "this_week",
        hourlyRate: 150,
        profileImage:
          "https://images.unsplash.com/photo-1494790108755-2616b612b1-c?w=150",
        bio: "Experienced marketing and sales performance coach with a focus on improving sales funnels and boosting marketing results.",
        expertise: [
          "Sales Funnel Optimization",
          "Customer Segmentation",
          "Marketing Strategy",
          "Persuasion Coaching",
        ],
        yearsExperience: 10,
        languages: ["English"],
        timezone: "PST",
      },
      {
        id: "coach_10",
        name: "David Marshall",
        title: "Chief Marketing Officer & Negotiation Trainer",
        skills: [
          "Marketing Strategy",
          "Sales Funnel Optimization",
          "Persuasion and Negotiation",
          "Customer Segmentation",
        ],
        experience: "senior",
        rating: 4.9,
        availability: "next_week",
        hourlyRate: 170,
        profileImage:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
        bio: "Chief marketing officer with extensive experience in B2B and B2C marketing leadership and negotiation coaching.",
        expertise: [
          "Sales Funnel Optimization",
          "Negotiation Coaching",
          "Marketing Strategy",
          "Customer Segmentation",
        ],
        yearsExperience: 15,
        languages: ["English"],
        timezone: "EST",
      },
      {
        id: "coach_11",
        name: "Sophia Adams",
        title: "Senior Marketing Analyst & Funnel Optimization Coach",
        skills: [
          "Marketing",
          "Sales Funnel Optimization",
          "Persuasion and Negotiation",
          "Customer Segmentation",
        ],
        experience: "senior",
        rating: 4.8,
        availability: "immediate",
        hourlyRate: 145,
        profileImage:
          "https://images.unsplash.com/photo-1494790108755-2616b612b1-c?w=150",
        bio: "Marketing analyst with a focus on sales funnel optimization and customer journey mapping to maximize conversions.",
        expertise: [
          "Sales Funnel Optimization",
          "Customer Segmentation",
          "Marketing Strategy",
          "Persuasion Coaching",
        ],
        yearsExperience: 12,
        languages: ["English"],
        timezone: "PST",
      },
      {
        id: "coach_12",
        name: "Jack Thompson",
        title: "Sales Enablement & Marketing Specialist",
        skills: [
          "Marketing",
          "Sales Funnel Optimization",
          "Persuasion and Negotiation",
          "Customer Segmentation",
        ],
        experience: "senior",
        rating: 4.7,
        availability: "this_week",
        hourlyRate: 160,
        profileImage:
          "https://images.unsplash.com/photo-1494790108755-2616b612b1-c?w=150",
        bio: "Sales enablement specialist with expertise in sales funnel optimization and improving customer segmentation processes.",
        expertise: [
          "Sales Funnel Optimization",
          "Marketing Strategy",
          "Customer Segmentation",
          "Persuasion Coaching",
        ],
        yearsExperience: 10,
        languages: ["English"],
        timezone: "EST",
      },
    ];
  }

  private async getAvailableCoaches(): Promise<
    Omit<CoachMatch, "matchScore" | "matchReasons" | "estimatedCost">[]
  > {
    try {
      // Try to get real coaches from the platform
      const coaches = await apiEnhanced.getAllCoaches();

      if (coaches && coaches.length > 0) {
        // Transform platform coaches to matching format
        return coaches.map((coach: any) => ({
          id: coach.id,
          name: `${coach.firstName} ${coach.lastName}`,
          title: coach.title || "Professional Coach",
          skills: coach.skills || coach.coaching?.map((c: any) => c.name) || [],
          experience: this.mapExperienceLevel(
            coach.yearsExperience || coach.experience,
          ),
          rating: coach.metrics?.averageRating || coach.rating || 4.0,
          availability: coach.status === "active" ? "immediate" : "next_week",
          hourlyRate: coach.hourlyRate || 120,
          profileImage: coach.profilePicture || coach.avatar || "",
          bio:
            coach.bio ||
            "Experienced professional coach dedicated to helping individuals and teams achieve their goals.",
          expertise: coach.specializations || coach.expertise || [],
          yearsExperience: coach.yearsExperience || coach.experience || 3,
          languages: coach.languages || ["English"],
          timezone: coach.timezone || "EST",
        }));
      }
    } catch (error) {
      console.warn("Could not fetch real coaches, using mock data:", error);
    }

    // Fallback to mock coaches if real ones are not available
    const mockCoaches = this.generateMockCoaches();
    console.log("🤖 Using mock coaches for matching");
    return mockCoaches;
  }

  private mapExperienceLevel(years: number | string): string {
    if (typeof years === "string") return years;
    if (years < 2) return "junior";
    if (years < 5) return "mid-level";
    if (years < 10) return "senior";
    return "expert";
  }

  async findMatches(request: MatchingRequest): Promise<MatchingResult> {
    try {
      // Get current algorithm configuration from admin settings
      const weights = await this.getAlgorithmConfiguration();

      // Get available coaches from the platform
      const availableCoaches = await this.getAvailableCoaches();

      // Calculate match scores for each coach
      const matchedCoaches: CoachMatch[] = availableCoaches.map((coach) => {
        const { score, reasons } = this.calculateMatchScore(
          coach,
          request,
          weights,
        );

        // Calculate estimated cost based on timeline
        const startDate = new Date(request.timeline.startDate);
        const endDate = new Date(request.timeline.endDate);
        const weeks = Math.max(
          1,
          Math.ceil(
            (endDate.getTime() - startDate.getTime()) /
              (1000 * 60 * 60 * 24 * 7),
          ),
        );
        const estimatedHours = weeks * 3; // Assuming 3 hours per week
        const estimatedCost = estimatedHours * coach.hourlyRate;

        return {
          ...coach,
          matchScore: score,
          matchReasons: reasons,
          estimatedCost,
        };
      });

      // Sort by match score (highest first) and limit to top 10
      const sortedMatches = matchedCoaches
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 10);

      const result: MatchingResult = {
        requestId: request.id,
        matches: sortedMatches,
        algorithmVersion: "1.0.0",
        configUsed: weights,
        timestamp: new Date().toISOString(),
        totalMatches: sortedMatches.length,
      };

      // Store the result for later retrieval
      this.storeMatchingResult(result);

      console.log(`🎯 Matching completed for request ${request.id}:`, {
        totalMatches: result.totalMatches,
        topScore: sortedMatches[0]?.matchScore,
        weightsUsed: weights,
      });

      return result;
    } catch (error) {
      console.error("Matching service error:", error);
      throw new Error("Failed to find matches");
    }
  }

  private storeMatchingResult(result: MatchingResult): void {
    // Store in localStorage for demo purposes
    // In production, this would be stored in a database
    const key = `matching_result_${result.requestId}`;
    localStorage.setItem(key, JSON.stringify(result));

    // Also store in a general results index
    const allResults = this.getAllResults();
    const existingIndex = allResults.findIndex(
      (r) => r.requestId === result.requestId,
    );

    if (existingIndex >= 0) {
      allResults[existingIndex] = result;
    } else {
      allResults.push(result);
    }

    localStorage.setItem("all_matching_results", JSON.stringify(allResults));
  }

  async getMatchingResult(requestId: string): Promise<MatchingResult | null> {
    try {
      const key = `matching_result_${requestId}`;
      const stored = localStorage.getItem(key);

      if (stored) {
        return JSON.parse(stored);
      }

      return null;
    } catch (error) {
      console.error("Failed to retrieve matching result:", error);
      return null;
    }
  }

  getAllResults(): MatchingResult[] {
    try {
      const stored = localStorage.getItem("all_matching_results");
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Failed to retrieve all results:", error);
      return [];
    }
  }

  async rerunMatching(requestId: string): Promise<MatchingResult | null> {
    // Find the original request and re-run matching with current settings
    // This would typically fetch the original request from storage
    console.log(
      `Re-running matching for request ${requestId} with current algorithm settings`,
    );

    // For demo purposes, we'll create a sample request
    // In production, this would fetch the actual request data
    const sampleRequest: MatchingRequest = {
      id: requestId,
      title: "Updated Matching Request",
      description: "Re-running with new algorithm settings",
      requiredSkills: ["JavaScript", "React"],
      preferredExperience: "senior",
      budget: 150,
      timeline: {
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      teamMembers: [],
      goals: [],
    };

    return await this.findMatches(sampleRequest);
  }
}

export const matchingService = new MatchingService();

// Type alias for compatibility
export type MatchedCoach = CoachMatch;

// Wrapper functions for coach-specific matching
export async function findCoachMatches(
  request: MatchingRequest,
): Promise<MatchingResult> {
  return await matchingService.findMatches(request);
}

export async function acceptCoachMatch(
  requestId: string,
  coachId: string,
): Promise<boolean> {
  try {
    console.log(
      `🎯 Accepting coach match: ${coachId} for request ${requestId}`,
    );

    // Store the acceptance in localStorage for demo purposes
    const acceptanceKey = `acceptance_${requestId}_${coachId}`;
    localStorage.setItem(
      acceptanceKey,
      JSON.stringify({
        requestId,
        coachId,
        status: "accepted",
        timestamp: new Date().toISOString(),
      }),
    );

    // Update the request status
    const requestKey = `coaching_request_${requestId}`;
    const existingRequest = localStorage.getItem(requestKey);
    if (existingRequest) {
      const request = JSON.parse(existingRequest);
      request.status = "matched";
      request.matchedCoachId = coachId;
      request.updatedAt = new Date().toISOString();
      localStorage.setItem(requestKey, JSON.stringify(request));
    }

    return true;
  } catch (error) {
    console.error("Failed to accept coach match:", error);
    return false;
  }
}

export async function rejectCoachMatch(
  requestId: string,
  coachId: string,
  reason?: string,
): Promise<boolean> {
  try {
    console.log(
      `🎯 Rejecting coach match: ${coachId} for request ${requestId}`,
    );

    // Store the rejection in localStorage for demo purposes
    const rejectionKey = `rejection_${requestId}_${coachId}`;
    localStorage.setItem(
      rejectionKey,
      JSON.stringify({
        requestId,
        coachId,
        status: "rejected",
        reason: reason || "No reason provided",
        timestamp: new Date().toISOString(),
      }),
    );

    return true;
  } catch (error) {
    console.error("Failed to reject coach match:", error);
    return false;
  }
}