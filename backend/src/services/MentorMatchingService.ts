import { Mentor, MentorStatus } from "../models/Mentor.js";
import { MentorshipRequest } from "../models/MentorshipRequest.js";
import { logger } from "../config/logger.js";

export interface MatchingFilters {
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

export interface MentorMatch {
  mentor: Mentor;
  matchScore: number;
  strengths: string[];
  matchReasons: string[];
}

export interface MatchingResult {
  totalMatches: number;
  matches: MentorMatch[];
  filters: MatchingFilters;
  searchTime: number;
}

export class MentorMatchingService {
  private mentors: Map<string, Mentor> = new Map();

  constructor() {
    this.initializeMockMentors();
  }

  private initializeMockMentors(): void {
    // Initialize with comprehensive mock mentor data
    const mockMentors = [
      new Mentor(
        "mentor_1",
        "user_mentor_1",
        "Sarah",
        "Johnson",
        "sarah.johnson@email.com",
        "https://images.unsplash.com/photo-1494790108755-2616b19a6af1?w=400",
        "Senior Software Engineer with 8+ years experience in full-stack development, specializing in React, Node.js, and cloud architecture.",
        "Senior Software Engineer",
        "Tech Corp",
        "https://linkedin.com/in/sarahjohnson",
        [
          {
            id: "exp_1",
            category: "Frontend Development",
            subcategory: "React",
            yearsExperience: 6,
            level: "expert",
          },
          {
            id: "exp_2",
            category: "Backend Development",
            subcategory: "Node.js",
            yearsExperience: 5,
            level: "expert",
          },
          {
            id: "exp_3",
            category: "Cloud Computing",
            subcategory: "AWS",
            yearsExperience: 4,
            level: "intermediate",
          },
        ],
        [
          {
            dayOfWeek: 1,
            startTime: "09:00",
            endTime: "17:00",
            timezone: "UTC-8",
          },
          {
            dayOfWeek: 3,
            startTime: "09:00",
            endTime: "17:00",
            timezone: "UTC-8",
          },
          {
            dayOfWeek: 5,
            startTime: "09:00",
            endTime: "17:00",
            timezone: "UTC-8",
          },
        ],
        150,
        "USD",
        MentorStatus.ACTIVE,
        {
          totalSessions: 127,
          averageRating: 4.8,
          totalStudents: 23,
          successRate: 0.91,
          responseTime: 4,
          completionRate: 0.94,
        },
        ["English", "Spanish"],
      ),
      new Mentor(
        "mentor_2",
        "user_mentor_2",
        "Michael",
        "Chen",
        "michael.chen@email.com",
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
        "Product Manager with expertise in agile methodologies, user research, and data-driven product decisions.",
        "Senior Product Manager",
        "Innovation Labs",
        "https://linkedin.com/in/michaelchen",
        [
          {
            id: "exp_4",
            category: "Product Management",
            subcategory: "Strategy",
            yearsExperience: 7,
            level: "expert",
          },
          {
            id: "exp_5",
            category: "Data Analysis",
            subcategory: "Analytics",
            yearsExperience: 5,
            level: "intermediate",
          },
          {
            id: "exp_6",
            category: "Leadership",
            subcategory: "Team Management",
            yearsExperience: 6,
            level: "expert",
          },
        ],
        [
          {
            dayOfWeek: 2,
            startTime: "10:00",
            endTime: "18:00",
            timezone: "UTC-8",
          },
          {
            dayOfWeek: 4,
            startTime: "10:00",
            endTime: "18:00",
            timezone: "UTC-8",
          },
        ],
        120,
        "USD",
        MentorStatus.ACTIVE,
        {
          totalSessions: 89,
          averageRating: 4.9,
          totalStudents: 18,
          successRate: 0.94,
          responseTime: 2,
          completionRate: 0.96,
        },
        ["English", "Mandarin"],
      ),
      new Mentor(
        "mentor_3",
        "user_mentor_3",
        "Emily",
        "Rodriguez",
        "emily.rodriguez@email.com",
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
        "UX Design lead with 10+ years creating user-centered digital experiences for Fortune 500 companies.",
        "Lead UX Designer",
        "Design Studio",
        "https://linkedin.com/in/emilyrodriguez",
        [
          {
            id: "exp_7",
            category: "UX Design",
            subcategory: "User Research",
            yearsExperience: 8,
            level: "expert",
          },
          {
            id: "exp_8",
            category: "UI Design",
            subcategory: "Prototyping",
            yearsExperience: 10,
            level: "master",
          },
          {
            id: "exp_9",
            category: "Design Systems",
            subcategory: "Component Libraries",
            yearsExperience: 6,
            level: "expert",
          },
        ],
        [
          {
            dayOfWeek: 1,
            startTime: "08:00",
            endTime: "16:00",
            timezone: "UTC-6",
          },
          {
            dayOfWeek: 3,
            startTime: "08:00",
            endTime: "16:00",
            timezone: "UTC-6",
          },
          {
            dayOfWeek: 5,
            startTime: "08:00",
            endTime: "16:00",
            timezone: "UTC-6",
          },
        ],
        180,
        "USD",
        MentorStatus.ACTIVE,
        {
          totalSessions: 156,
          averageRating: 4.7,
          totalStudents: 31,
          successRate: 0.89,
          responseTime: 6,
          completionRate: 0.92,
        },
        ["English", "Spanish", "Portuguese"],
      ),
    ];

    mockMentors.forEach((mentor) => this.mentors.set(mentor.id, mentor));
    logger.info(`Initialized ${mockMentors.length} mock mentors`);
  }

  public async findMatches(
    mentorshipRequest: MentorshipRequest,
    filters: MatchingFilters = {},
    limit: number = 10,
  ): Promise<MatchingResult> {
    const startTime = Date.now();

    try {
      logger.info(
        `Finding mentor matches for request ${mentorshipRequest.id}`,
        { filters, limit },
      );

      // Get all available mentors
      let availableMentors = Array.from(this.mentors.values()).filter(
        (mentor) => mentor.isAvailable() && mentor.canAcceptNewStudents(),
      );

      // Apply filters
      availableMentors = this.applyFilters(availableMentors, filters);

      // Calculate match scores
      const matches: MentorMatch[] = availableMentors
        .map((mentor) => this.calculateMatch(mentor, mentorshipRequest))
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limit);

      const searchTime = Date.now() - startTime;

      logger.info(`Found ${matches.length} mentor matches in ${searchTime}ms`);

      return {
        totalMatches: matches.length,
        matches,
        filters,
        searchTime,
      };
    } catch (error) {
      logger.error("Error finding mentor matches:", error);
      throw new Error("Failed to find mentor matches");
    }
  }

  private applyFilters(mentors: Mentor[], filters: MatchingFilters): Mentor[] {
    return mentors.filter((mentor) => {
      // Expertise filter
      if (filters.expertise && filters.expertise.length > 0) {
        const mentorCategories = mentor
          .getExpertiseCategories()
          .map((cat) => cat.toLowerCase());
        const hasExpertise = filters.expertise.some((exp) =>
          mentorCategories.some(
            (cat) =>
              cat.includes(exp.toLowerCase()) ||
              exp.toLowerCase().includes(cat),
          ),
        );
        if (!hasExpertise) return false;
      }

      // Experience level filter
      if (filters.experienceLevel) {
        const hasRequiredLevel = mentor.expertise.some((exp) =>
          this.compareExperienceLevel(exp.level, filters.experienceLevel!),
        );
        if (!hasRequiredLevel) return false;
      }

      // Rating filter
      if (
        filters.minRating &&
        mentor.metrics.averageRating < filters.minRating
      ) {
        return false;
      }

      // Hourly rate filter
      if (
        filters.maxHourlyRate &&
        mentor.hourlyRate &&
        mentor.hourlyRate > filters.maxHourlyRate
      ) {
        return false;
      }

      // Language filter
      if (filters.languages && filters.languages.length > 0) {
        const hasLanguage = filters.languages.some((lang) =>
          mentor.languages.some((mentorLang) =>
            mentorLang.toLowerCase().includes(lang.toLowerCase()),
          ),
        );
        if (!hasLanguage) return false;
      }

      // Availability filter
      if (filters.availability) {
        const hasAvailability = mentor.availability.some(
          (avail) => avail.dayOfWeek === filters.availability!.dayOfWeek,
        );
        if (!hasAvailability) return false;
      }

      return true;
    });
  }

  private compareExperienceLevel(
    mentorLevel: "beginner" | "intermediate" | "expert" | "master",
    requiredLevel: "beginner" | "intermediate" | "expert" | "master",
  ): boolean {
    const levels = { beginner: 1, intermediate: 2, expert: 3, master: 4 };
    return levels[mentorLevel] >= levels[requiredLevel];
  }

  private calculateMatch(
    mentor: Mentor,
    request: MentorshipRequest,
  ): MentorMatch {
    // Extract required skills from goals
    const requiredSkills = request.goals.flatMap((goal) =>
      goal.description
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 3),
    );

    const matchScore = mentor.getMatchScore(
      requiredSkills,
      request.goals.map((g) => g.description),
    );

    const strengths = this.identifyStrengths(mentor, request);
    const matchReasons = this.generateMatchReasons(mentor, request, matchScore);

    return {
      mentor,
      matchScore,
      strengths,
      matchReasons,
    };
  }

  private identifyStrengths(
    mentor: Mentor,
    request: MentorshipRequest,
  ): string[] {
    const strengths: string[] = [];

    // High rating strength
    if (mentor.metrics.averageRating >= 4.5) {
      strengths.push(`Highly rated (${mentor.metrics.averageRating}/5.0)`);
    }

    // Experience strength
    const avgExperience =
      mentor.expertise.reduce((sum, exp) => sum + exp.yearsExperience, 0) /
      mentor.expertise.length;
    if (avgExperience >= 7) {
      strengths.push(`${Math.round(avgExperience)}+ years experience`);
    }

    // Response time strength
    if (mentor.metrics.responseTime <= 4) {
      strengths.push("Quick responder");
    }

    // Success rate strength
    if (mentor.metrics.successRate >= 0.9) {
      strengths.push(
        `${Math.round(mentor.metrics.successRate * 100)}% success rate`,
      );
    }

    // Language strength
    if (mentor.languages.length > 1) {
      strengths.push(`Multilingual (${mentor.languages.join(", ")})`);
    }

    return strengths.slice(0, 3); // Return top 3 strengths
  }

  private generateMatchReasons(
    mentor: Mentor,
    request: MentorshipRequest,
    score: number,
  ): string[] {
    const reasons: string[] = [];

    if (score >= 80) {
      reasons.push("Excellent skill alignment with your goals");
    } else if (score >= 60) {
      reasons.push("Good skill match for your requirements");
    }

    // Specific expertise matches
    const mentorCategories = mentor.getExpertiseCategories();
    mentorCategories.forEach((category) => {
      reasons.push(`Expertise in ${category}`);
    });

    // Company/industry experience
    if (mentor.company) {
      reasons.push(`Experience at ${mentor.company}`);
    }

    return reasons.slice(0, 4); // Return top 4 reasons
  }

  public async getMentorById(mentorId: string): Promise<Mentor | null> {
    return this.mentors.get(mentorId) || null;
  }

  public async getAllMentors(): Promise<Mentor[]> {
    return Array.from(this.mentors.values());
  }

  public async getTopMentors(limit: number = 5): Promise<Mentor[]> {
    return Array.from(this.mentors.values())
      .filter((mentor) => mentor.isAvailable())
      .sort((a, b) => {
        // Sort by rating first, then by success rate
        if (b.metrics.averageRating !== a.metrics.averageRating) {
          return b.metrics.averageRating - a.metrics.averageRating;
        }
        return b.metrics.successRate - a.metrics.successRate;
      })
      .slice(0, limit);
  }

  public async searchMentors(
    query: string,
    filters: MatchingFilters = {},
  ): Promise<Mentor[]> {
    const queryLower = query.toLowerCase();

    return Array.from(this.mentors.values()).filter((mentor) => {
      // Text search
      const searchableText = [
        mentor.firstName,
        mentor.lastName,
        mentor.bio || "",
        mentor.title || "",
        mentor.company || "",
        ...mentor.getExpertiseCategories(),
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery = searchableText.includes(queryLower);

      if (!matchesQuery) return false;

      // Apply additional filters
      return this.applyFilters([mentor], filters).length > 0;
    });
  }

  public updateMentorMetrics(
    mentorId: string,
    metrics: Partial<Mentor["metrics"]>,
  ): void {
    const mentor = this.mentors.get(mentorId);
    if (mentor) {
      mentor.updateMetrics(metrics);
      logger.info(`Updated metrics for mentor ${mentorId}`, metrics);
    }
  }
}

export const mentorMatchingService = new MentorMatchingService();
