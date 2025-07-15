import {
  Controller,
  Get,
  UseGuards,
  Request,
  ForbiddenException,
} from "@nestjs/common";
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
    summary: "Get public platform statistics",
    description:
      "Returns basic platform statistics for display on public pages. Shows aggregated counts without sensitive details.",
  })
  @ApiResponse({
    status: 200,
    description: "Public platform statistics retrieved successfully",
    schema: {
      type: "object",
      properties: {
        totalCoaches: { type: "number", example: 25 },
        totalSessions: { type: "number", example: 150 },
        totalCompanies: { type: "number", example: 8 },
        averageRating: { type: "number", example: 4.6 },
      },
    },
  })
  async getStatistics() {
    // Return public statistics (no sensitive data)
    return this.platformService.getPublicStatistics();
  }

  @Get("admin/statistics")
  @ApiOperation({
    summary: "Get detailed platform statistics",
    description:
      "Returns detailed platform statistics including sensitive data. Accessible by platform admins only.",
  })
  @ApiResponse({
    status: 200,
    description: "Detailed platform statistics retrieved successfully",
    schema: {
      type: "object",
      properties: {
        totalCoaches: { type: "number", example: 25 },
        totalSessions: { type: "number", example: 150 },
        totalCompanies: { type: "number", example: 8 },
        averageRating: { type: "number", example: 4.6 },
        totalUsers: { type: "number", example: 200 },
        activeSessions: { type: "number", example: 12 },
        revenue: { type: "number", example: 50000 },
        growth: { type: "object" },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: "Access denied - Platform admin role required",
  })
  async getDetailedStatistics(@Request() req: any) {
    // Only platform admins can access detailed statistics
    if (req.user?.userType !== "platform_admin") {
      throw new ForbiddenException(
        "Access denied - Platform admin role required",
      );
    }
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
