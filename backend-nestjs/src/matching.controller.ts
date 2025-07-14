import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpStatus,
  HttpException,
} from "@nestjs/common";
import { MatchingService } from "./matching.service";
import { DatabaseService } from "./database.service";

@Controller("matching")
export class MatchingController {
  constructor(
    private matchingService: MatchingService,
    private databaseService: DatabaseService,
  ) {}

  @Post("search")
  async searchMatches(
    @Body()
    searchData: {
      filters?: {
        expertise?: string[];
        experience?: string;
        rating?: number;
      };
      requestId?: string;
    },
  ): Promise<{ data: any[] }> {
    try {
      const { filters, requestId } = searchData;
      const requestData = {
        id: requestId || `search_${Date.now()}`,
        ...filters,
      };

      const matches = await this.matchingService.generateMatches(requestData);

      // Enrich matches with coach data
      const coaches = await this.databaseService.getAllCoaches();
      const enrichedMatches = matches.map((match) => {
        const coach = coaches.find((c) => c.id === match.coachId);
        return {
          ...match,
          coach: coach,
        };
      });

      return { data: enrichedMatches };
    } catch (error) {
      console.error("Error generating matches:", error);
      throw new HttpException(
        "Failed to generate matches",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get("requests/:requestId")
  async getMatchesForRequest(
    @Param("requestId") requestId: string,
  ): Promise<{ data: any[] }> {
    try {
      const matches =
        await this.matchingService.getMatchesForRequest(requestId);

      // Enrich matches with coach data
      const coaches = await this.databaseService.getAllCoaches();
      const enrichedMatches = matches.map((match) => {
        const coach = coaches.find((c) => c.id === match.coachId);
        return {
          ...match,
          coach: coach,
        };
      });

      return { data: enrichedMatches };
    } catch (error) {
      console.error("Error fetching matches:", error);
      throw new HttpException(
        "Failed to fetch matches",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post("coaches/search")
  async searchCoaches(
    @Body()
    filters: {
      expertise?: string[];
      experience?: string;
      rating?: number;
    },
  ): Promise<{ data: any[] }> {
    try {
      const matches = await this.matchingService.searchCoaches(filters);

      // Enrich matches with coach data
      const coaches = await this.databaseService.getAllCoaches();
      const enrichedMatches = matches.map((match) => {
        const coach = coaches.find((c) => c.id === match.coachId);
        return {
          ...match,
          coach: coach,
        };
      });

      return { data: enrichedMatches };
    } catch (error) {
      console.error("Error searching coaches:", error);
      throw new HttpException(
        "Failed to search coaches",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
