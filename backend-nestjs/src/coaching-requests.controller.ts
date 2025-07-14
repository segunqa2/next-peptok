import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  HttpStatus,
  HttpException,
} from "@nestjs/common";
import { DatabaseService, CoachingRequest } from "./database.service";
import { MatchingService } from "./matching.service";

@Controller("mentorship-requests")
export class CoachingRequestsController {
  constructor(
    private databaseService: DatabaseService,
    private matchingService: MatchingService,
  ) {}

  @Post()
  async createRequest(
    @Body() requestData: Partial<CoachingRequest>,
  ): Promise<{ data: CoachingRequest; matches: number }> {
    try {
      const newRequest =
        await this.databaseService.createCoachingRequest(requestData);

      // Generate matches for the new request
      const matches = await this.matchingService.generateMatches({
        id: newRequest.id,
        expertise: newRequest.goals?.map((g) => g.title),
        goals: newRequest.goals,
        experience: "5+ years", // Default or extract from request
      });

      return {
        data: newRequest,
        matches: matches.length,
      };
    } catch (error) {
      console.error("Error creating coaching request:", error);
      throw new HttpException(
        "Failed to create coaching request",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  async getAllRequests(): Promise<{ data: CoachingRequest[] }> {
    try {
      const requests = await this.databaseService.getAllCoachingRequests();
      return { data: requests };
    } catch (error) {
      console.error("Error fetching coaching requests:", error);
      throw new HttpException(
        "Failed to fetch coaching requests",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(":id")
  async getRequest(@Param("id") id: string): Promise<{
    data: CoachingRequest;
    matches: any[];
  }> {
    try {
      const request = await this.databaseService.getCoachingRequest(id);
      if (!request) {
        throw new HttpException("Request not found", HttpStatus.NOT_FOUND);
      }

      // Get matches for this request
      const matches = await this.matchingService.getMatchesForRequest(id);

      return {
        data: request,
        matches: matches,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error("Error fetching coaching request:", error);
      throw new HttpException(
        "Failed to fetch coaching request",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(":id")
  async updateRequest(
    @Param("id") id: string,
    @Body() updateData: Partial<CoachingRequest>,
  ): Promise<{ data: CoachingRequest }> {
    try {
      const updatedRequest = await this.databaseService.updateCoachingRequest(
        id,
        updateData,
      );
      if (!updatedRequest) {
        throw new HttpException("Request not found", HttpStatus.NOT_FOUND);
      }

      return { data: updatedRequest };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error("Error updating coaching request:", error);
      throw new HttpException(
        "Failed to update coaching request",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
