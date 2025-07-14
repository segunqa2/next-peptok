import { Injectable } from "@nestjs/common";
import {
  DatabaseService,
  Coach,
  CoachingRequest,
  Match,
} from "./database.service";

@Injectable()
export class MatchingService {
  constructor(private databaseService: DatabaseService) {}

  private calculateExpertiseScore(
    coachExpertise: string[],
    requiredExpertise: string[],
  ): number {
    if (!requiredExpertise || !coachExpertise) return 0.3;

    let matches = 0;
    requiredExpertise.forEach((reqSkill) => {
      coachExpertise.forEach((coachSkill) => {
        if (
          reqSkill.toLowerCase().includes(coachSkill.toLowerCase()) ||
          coachSkill.toLowerCase().includes(reqSkill.toLowerCase())
        ) {
          matches++;
          return; // Break inner loop
        }
      });
    });

    return Math.min(matches / requiredExpertise.length, 1.0);
  }

  private calculateExperienceScore(
    coachExperience: string,
    requiredLevel: string,
  ): number {
    try {
      const coachYears = parseInt(coachExperience.match(/\d+/)?.[0] || "0");
      const requiredYears = parseInt(requiredLevel?.match(/\d+/)?.[0] || "5");

      if (coachYears >= requiredYears) return 1.0;
      return coachYears / requiredYears;
    } catch {
      return 0.5;
    }
  }

  private calculateRatingScore(rating: number): number {
    return Math.min(rating / 5.0, 1.0);
  }

  async generateMatches(requestData: {
    id?: string;
    expertise?: string[];
    goals?: Array<{ title: string }>;
    experience?: string;
  }): Promise<Match[]> {
    const coaches = await this.databaseService.getAllCoaches();
    const requiredExpertise =
      requestData.expertise || requestData.goals?.map((g) => g.title) || [];
    const requiredExperience = requestData.experience || "5+ years";
    const requestId = requestData.id || `request_${Date.now()}`;

    const matches: Match[] = coaches.map((coach) => {
      // Calculate individual scores
      const expertiseScore = this.calculateExpertiseScore(
        coach.expertise,
        requiredExpertise,
      );
      const experienceScore = this.calculateExperienceScore(
        coach.experience,
        requiredExperience,
      );
      const ratingScore = this.calculateRatingScore(coach.rating);

      // Weighted final score
      const finalScore = Math.max(
        expertiseScore * 0.5 + experienceScore * 0.3 + ratingScore * 0.2,
        0.3,
      );

      // Generate reason
      const reasonParts = [];
      if (expertiseScore > 0.7) reasonParts.push("Strong expertise alignment");
      if (experienceScore > 0.8) reasonParts.push("Excellent experience match");
      if (ratingScore > 0.9) reasonParts.push("Outstanding client ratings");

      const reason =
        reasonParts.length > 0
          ? reasonParts.join(", ")
          : `${Math.round(finalScore * 100)}% overall compatibility`;

      return {
        id: `match_${Date.now()}_${coach.id}`,
        coachId: coach.id,
        requestId: requestId,
        matchScore: Math.round(finalScore * 100) / 100,
        reason: reason,
        createdAt: new Date().toISOString(),
      };
    });

    // Sort by score descending
    matches.sort((a, b) => b.matchScore - a.matchScore);

    // Save matches to database
    await this.databaseService.saveMatches(matches);

    console.log(
      `🔍 Generated ${matches.length} matches for request ${requestId}`,
    );
    return matches;
  }

  async getMatchesForRequest(requestId: string): Promise<Match[]> {
    return this.databaseService.getMatches(requestId);
  }

  async searchCoaches(filters: {
    expertise?: string[];
    experience?: string;
    rating?: number;
  }): Promise<Match[]> {
    const requestData = {
      id: `search_${Date.now()}`,
      ...filters,
    };

    return this.generateMatches(requestData);
  }
}
