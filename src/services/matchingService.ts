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
          availability: coach.availability || "available",
          hourlyRate: coach.hourlyRate || 150,
          profileImage: coach.profilePicture || coach.avatar || "",
          bio: coach.bio || "",
          expertise: coach.expertise || coach.skills || [],
          yearsExperience: coach.yearsExperience || 5,
          languages: coach.languages || ["English"],
          timezone: coach.timezone || "UTC",
        }));
      }
    } catch (error) {
      console.warn("Failed to fetch coaches from platform:", error);
    }

    // Fallback to mock data for development
    return this.generateMockCoaches();
  }

  private mapExperienceLevel(years: number | string | undefined): string {
    if (typeof years === "string") {
      return years;
    }
    if (!years) return "mid-level";

    if (years < 2) return "junior";
    if (years < 5) return "mid-level";
    if (years < 10) return "senior";
    return "expert";
  }

  async findMatches(request: MatchingRequest): Promise<MatchingResult> {
    try {
      const weights = await this.getAlgorithmConfiguration();
      const availableCoaches = await this.getAvailableCoaches();

      const matches = availableCoaches
        .map((coach) => {
          const { score, reasons } = this.calculateMatchScore(
            coach,
            request,
            weights,
          );

          // Calculate estimated cost based on timeline
          const timelineStart = new Date(request.timeline.startDate);
          const timelineEnd = new Date(request.timeline.endDate);
          const durationWeeks = Math.ceil(
            (timelineEnd.getTime() - timelineStart.getTime()) /
              (1000 * 60 * 60 * 24 * 7),
          );
          const estimatedHours = durationWeeks * 2; // Assume 2 hours per week
          const estimatedCost = coach.hourlyRate * estimatedHours;

          return {
            ...coach,
            matchScore: score,
            matchReasons: reasons,
            estimatedCost,
          } as CoachMatch;
        })
        .filter((match) => match.matchScore > 0.2) // Only show matches above 20%
        .sort((a, b) => b.matchScore - a.matchScore) // Sort by match score descending
        .slice(0, 10); // Limit to top 10 matches

      return {
        requestId: request.id,
        matches,
        algorithmVersion: "2.0",
        configUsed: weights,
        timestamp: new Date().toISOString(),
        totalMatches: matches.length,
      };
    } catch (error) {
      console.error("Failed to find matches:", error);
      return {
        requestId: request.id,
        matches: [],
        algorithmVersion: "2.0",
        configUsed: await this.getAlgorithmConfiguration(),
        timestamp: new Date().toISOString(),
        totalMatches: 0,
      };
    }
  }

  async getTestMatches(): Promise<MatchingResult> {
    const sampleRequest: MatchingRequest = {
      id: "test-request-1",
      title: "React Development Training",
      description: "Need help with React best practices and TypeScript",
      requiredSkills: ["React", "TypeScript", "JavaScript"],
      preferredExperience: "senior",
      budget: 200,
      timeline: {
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      teamMembers: ["team-member-1", "team-member-2"],
      goals: ["Improve React skills", "Learn TypeScript"],
    };

    return await this.findMatches(sampleRequest);
  }

  async getMatchingResult(requestId: string): Promise<MatchingResult | null> {
    return await getMatchingResult(requestId);
  }
}

export const matchingService = new MatchingService();

export async function findCoachMatches(
  request: MatchingRequest,
): Promise<MatchingResult> {
  return await matchingService.findMatches(request);
}

export async function getMatchingResult(
  requestId: string,
): Promise<MatchingResult | null> {
  try {
    console.log(`Getting existing matching results for request: ${requestId}`);

    // Check if this is a demo user with demo data
    const isDemoUser = localStorage
      .getItem("peptok_token")
      ?.startsWith("demo_token_");
    const demoData = localStorage.getItem("peptok_demo_data");

    if (isDemoUser && demoData) {
      console.log("🎭 Loading demo matching results");
      const parsedDemoData = JSON.parse(demoData);

      if (requestId === "req_001") {
        // Generate 10 coaches for Sales and Marketing Development program
        const matches = [
          {
            id: "coach_daniel",
            name: "Daniel Martinez",
            title: "Senior Sales & Marketing Strategist",
            skills: [
              "Sales Strategy",
              "Marketing",
              "Negotiation",
              "Customer Segmentation",
            ],
            experience: "senior",
            rating: 4.9,
            availability: "immediate",
            hourlyRate: 185,
            profileImage: "https://avatar.vercel.sh/daniel",
            bio: "Expert sales strategist with 12+ years experience in B2B sales, marketing automation, and negotiation training. Specialized in transforming sales teams through data-driven approaches.",
            expertise: [
              "Sales Strategy",
              "Marketing Automation",
              "Negotiation",
              "Team Leadership",
            ],
            yearsExperience: 12,
            languages: ["English", "Spanish"],
            timezone: "UTC-5",
            matchScore: 0.98,
            matchReasons: [
              "Perfect skill match (98%)",
              "Excellent rating (4.9/5)",
              "Available for immediate start",
              "Specializes in sales and marketing transformation",
            ],
            estimatedCost: 29600, // 16 weeks * 2 hours * $185
          },
          {
            id: "coach_sarah",
            name: "Sarah Chen",
            title: "Marketing Director & Sales Coach",
            skills: [
              "Digital Marketing",
              "Sales Funnel",
              "Lead Generation",
              "Customer Psychology",
            ],
            experience: "senior",
            rating: 4.7,
            availability: "this_week",
            hourlyRate: 165,
            profileImage: "https://avatar.vercel.sh/sarah",
            bio: "Former VP of Marketing with expertise in building high-converting sales funnels and training sales teams on customer psychology and persuasion techniques.",
            expertise: [
              "Digital Marketing",
              "Sales Funnel Optimization",
              "Lead Generation",
              "Customer Psychology",
            ],
            yearsExperience: 10,
            languages: ["English", "Mandarin"],
            timezone: "UTC-8",
            matchScore: 0.92,
            matchReasons: [
              "Strong skill match (92%)",
              "Excellent rating (4.7/5)",
              "Quick availability",
              "Expert in sales funnel optimization",
            ],
            estimatedCost: 26400,
          },
          {
            id: "coach_michael",
            name: "Michael Thompson",
            title: "Enterprise Sales Trainer",
            skills: [
              "B2B Sales",
              "Negotiation",
              "Account Management",
              "Sales Training",
            ],
            experience: "expert",
            rating: 4.8,
            availability: "next_week",
            hourlyRate: 200,
            profileImage: "https://avatar.vercel.sh/michael",
            bio: "20+ years in enterprise sales with focus on complex deal negotiation and large account management. Has trained over 500 sales professionals.",
            expertise: [
              "Enterprise Sales",
              "Complex Negotiations",
              "Account Management",
              "Sales Methodology",
            ],
            yearsExperience: 20,
            languages: ["English"],
            timezone: "UTC-5",
            matchScore: 0.89,
            matchReasons: [
              "Expert-level experience",
              "Outstanding rating (4.8/5)",
              "Specializes in complex negotiations",
              "Extensive training experience",
            ],
            estimatedCost: 32000,
          },
          {
            id: "coach_jessica",
            name: "Jessica Rodriguez",
            title: "Marketing Analytics & Strategy Coach",
            skills: [
              "Marketing Analytics",
              "Customer Segmentation",
              "Campaign Strategy",
              "ROI Optimization",
            ],
            experience: "senior",
            rating: 4.6,
            availability: "immediate",
            hourlyRate: 155,
            profileImage: "https://avatar.vercel.sh/jessica",
            bio: "Data-driven marketing strategist with expertise in customer segmentation, campaign optimization, and ROI measurement. Former CMO of multiple startups.",
            expertise: [
              "Marketing Analytics",
              "Customer Segmentation",
              "Campaign Strategy",
              "Data Analysis",
            ],
            yearsExperience: 8,
            languages: ["English", "Spanish"],
            timezone: "UTC-6",
            matchScore: 0.86,
            matchReasons: [
              "Strong analytics background",
              "Customer segmentation expert",
              "Available immediately",
              "Proven ROI optimization",
            ],
            estimatedCost: 24800,
          },
          {
            id: "coach_david",
            name: "David Kim",
            title: "Sales Operations & Process Optimization",
            skills: [
              "Sales Process",
              "CRM Optimization",
              "Sales Automation",
              "Performance Metrics",
            ],
            experience: "senior",
            rating: 4.5,
            availability: "this_week",
            hourlyRate: 145,
            profileImage: "https://avatar.vercel.sh/david",
            bio: "Sales operations specialist focused on process optimization, CRM implementation, and sales team performance metrics. Helped 50+ companies streamline sales.",
            expertise: [
              "Sales Operations",
              "Process Optimization",
              "CRM Systems",
              "Sales Analytics",
            ],
            yearsExperience: 9,
            languages: ["English", "Korean"],
            timezone: "UTC-8",
            matchScore: 0.83,
            matchReasons: [
              "Process optimization expert",
              "Strong operational background",
              "CRM specialization",
              "Quick availability",
            ],
            estimatedCost: 23200,
          },
          {
            id: "coach_emma",
            name: "Emma Wilson",
            title: "Content Marketing & Sales Enablement",
            skills: [
              "Content Marketing",
              "Sales Enablement",
              "Brand Strategy",
              "Social Selling",
            ],
            experience: "mid-level",
            rating: 4.4,
            availability: "immediate",
            hourlyRate: 125,
            profileImage: "https://avatar.vercel.sh/emma",
            bio: "Content marketing specialist with strong sales enablement background. Expert in creating marketing materials that support sales teams and drive conversions.",
            expertise: [
              "Content Marketing",
              "Sales Enablement",
              "Social Media Strategy",
              "Brand Development",
            ],
            yearsExperience: 6,
            languages: ["English"],
            timezone: "UTC-5",
            matchScore: 0.8,
            matchReasons: [
              "Sales enablement focus",
              "Content marketing expertise",
              "Available immediately",
              "Within budget range",
            ],
            estimatedCost: 20000,
          },
          {
            id: "coach_alex",
            name: "Alex Foster",
            title: "Customer Success & Retention Specialist",
            skills: [
              "Customer Success",
              "Retention Strategies",
              "Relationship Building",
              "Account Growth",
            ],
            experience: "senior",
            rating: 4.3,
            availability: "next_week",
            hourlyRate: 140,
            profileImage: "https://avatar.vercel.sh/alex",
            bio: "Customer success expert with deep understanding of customer lifecycle management, retention strategies, and account expansion techniques.",
            expertise: [
              "Customer Success",
              "Account Management",
              "Retention Strategies",
              "Relationship Building",
            ],
            yearsExperience: 7,
            languages: ["English"],
            timezone: "UTC-7",
            matchScore: 0.77,
            matchReasons: [
              "Customer relationship expertise",
              "Retention specialization",
              "Account growth focus",
              "Good rating (4.3/5)",
            ],
            estimatedCost: 22400,
          },
          {
            id: "coach_maria",
            name: "Maria Santos",
            title: "Digital Sales & E-commerce Coach",
            skills: [
              "E-commerce",
              "Digital Sales",
              "Online Marketing",
              "Conversion Optimization",
            ],
            experience: "senior",
            rating: 4.2,
            availability: "this_week",
            hourlyRate: 135,
            profileImage: "https://avatar.vercel.sh/maria",
            bio: "E-commerce and digital sales specialist with expertise in online conversion optimization, digital marketing strategies, and omnichannel sales approaches.",
            expertise: [
              "E-commerce Strategy",
              "Digital Sales",
              "Conversion Optimization",
              "Online Marketing",
            ],
            yearsExperience: 8,
            languages: ["English", "Portuguese"],
            timezone: "UTC-3",
            matchScore: 0.74,
            matchReasons: [
              "Digital sales expertise",
              "Conversion optimization",
              "E-commerce background",
              "Quick availability",
            ],
            estimatedCost: 21600,
          },
          {
            id: "coach_robert",
            name: "Robert Johnson",
            title: "Sales Training & Team Development",
            skills: [
              "Sales Training",
              "Team Development",
              "Performance Coaching",
              "Leadership",
            ],
            experience: "expert",
            rating: 4.1,
            availability: "immediate",
            hourlyRate: 160,
            profileImage: "https://avatar.vercel.sh/robert",
            bio: "Veteran sales trainer with 15+ years experience developing high-performing sales teams. Specializes in performance coaching and leadership development.",
            expertise: [
              "Sales Training",
              "Team Development",
              "Performance Coaching",
              "Sales Leadership",
            ],
            yearsExperience: 15,
            languages: ["English"],
            timezone: "UTC-5",
            matchScore: 0.71,
            matchReasons: [
              "Extensive training experience",
              "Team development focus",
              "Available immediately",
              "Leadership coaching",
            ],
            estimatedCost: 25600,
          },
          {
            id: "coach_lisa",
            name: "Lisa Brown",
            title: "Market Research & Customer Insights",
            skills: [
              "Market Research",
              "Customer Insights",
              "Competitive Analysis",
              "Data Interpretation",
            ],
            experience: "mid-level",
            rating: 4.0,
            availability: "next_week",
            hourlyRate: 120,
            profileImage: "https://avatar.vercel.sh/lisa",
            bio: "Market research analyst with strong background in customer insights, competitive analysis, and data-driven marketing strategies. Helps teams understand their market better.",
            expertise: [
              "Market Research",
              "Customer Analysis",
              "Competitive Intelligence",
              "Data Analytics",
            ],
            yearsExperience: 5,
            languages: ["English"],
            timezone: "UTC-6",
            matchScore: 0.69,
            matchReasons: [
              "Market research expertise",
              "Customer insights focus",
              "Data analysis skills",
              "Competitive analysis",
            ],
            estimatedCost: 19200,
          },
        ];

        const demoResult: MatchingResult = {
          requestId: requestId,
          matches,
          algorithmVersion: "1.0.0",
          configUsed: {
            skillMatch: 0.4,
            experience: 0.25,
            rating: 0.2,
            availability: 0.1,
            price: 0.05,
          },
          timestamp: new Date().toISOString(),
          totalMatches: matches.length,
        };

        console.log("✅ Demo matching results loaded:", demoResult);
        return demoResult;
      }
    }

    // For non-demo users, try to get from localStorage or API
    const storageKey = `matching_results_${requestId}`;
    const stored = localStorage.getItem(storageKey);

    if (stored) {
      const result = JSON.parse(stored);
      console.log("✅ Found stored matching results:", result);
      return result;
    }

    console.log("No existing matching results found for request:", requestId);
    return null;
  } catch (error) {
    console.error("Failed to get matching results:", error);
    return null;
  }
}

export async function acceptCoachMatch(
  matchId: string,
  requestId: string,
): Promise<boolean> {
  try {
    console.log(`Accepting coach match ${matchId} for request ${requestId}`);

    // Here you would typically make an API call to accept the match
    // await apiEnhanced.acceptMatch(matchId, requestId);

    return true;
  } catch (error) {
    console.error("Failed to accept coach match:", error);
    return false;
  }
}

export async function rejectCoachMatch(
  matchId: string,
  requestId: string,
): Promise<boolean> {
  try {
    console.log(`Rejecting coach match ${matchId} for request ${requestId}`);

    // Here you would typically make an API call to reject the match
    // await apiEnhanced.rejectMatch(matchId, requestId);

    return true;
  } catch (error) {
    console.error("Failed to reject coach match:", error);
    return false;
  }
}
