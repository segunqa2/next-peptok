import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpStatus,
  HttpException,
} from "@nestjs/common";
import { DatabaseService, Coach } from "./database.service";

@Controller("coaches")
export class CoachesController {
  constructor(private databaseService: DatabaseService) {}

  @Get()
  async getAllCoaches(): Promise<{ data: Coach[] }> {
    try {
      const coaches = await this.databaseService.getAllCoaches();
      return { data: coaches };
    } catch (error) {
      console.error("Error fetching coaches:", error);
      throw new HttpException(
        "Failed to fetch coaches",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(":id")
  async getCoach(@Param("id") id: string): Promise<{ data: Coach }> {
    try {
      const coach = await this.databaseService.getCoach(id);
      if (!coach) {
        throw new HttpException("Coach not found", HttpStatus.NOT_FOUND);
      }

      return { data: coach };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error("Error fetching coach:", error);
      throw new HttpException(
        "Failed to fetch coach",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  async createCoach(
    @Body() coachData: Partial<Coach>,
  ): Promise<{ data: Coach }> {
    try {
      const newCoach = await this.databaseService.createCoach(coachData);
      return { data: newCoach };
    } catch (error) {
      console.error("Error creating coach:", error);
      throw new HttpException(
        "Failed to create coach",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
