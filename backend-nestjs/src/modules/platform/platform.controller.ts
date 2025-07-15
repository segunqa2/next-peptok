import { Controller, Get, UseGuards } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { PlatformService } from "./platform.service";

@ApiTags("platform")
@Controller("platform")
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Get("statistics")
  @ApiOperation({
    summary: "Get platform-wide statistics",
    description:
      "Returns aggregated statistics including total coaches, sessions, companies, and average rating",
  })
  @ApiResponse({
    status: 200,
    description: "Platform statistics retrieved successfully",
    schema: {
      type: "object",
      properties: {
        totalCoaches: { type: "number", example: 25 },
        totalSessions: { type: "number", example: 150 },
        totalCompanies: { type: "number", example: 8 },
        averageRating: { type: "number", example: 4.6 },
        totalUsers: { type: "number", example: 200 },
        activeSessions: { type: "number", example: 12 },
      },
    },
  })
  async getStatistics() {
    return this.platformService.getStatistics();
  }

  @Get("health")
  @ApiOperation({
    summary: "Platform health check",
    description: "Simple health check endpoint to verify platform status",
  })
  @ApiResponse({
    status: 200,
    description: "Platform is healthy",
    schema: {
      type: "object",
      properties: {
        status: { type: "string", example: "healthy" },
        timestamp: { type: "string", example: "2024-12-15T10:30:00Z" },
        version: { type: "string", example: "1.0.0" },
      },
    },
  })
  getHealth() {
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    };
  }
}
