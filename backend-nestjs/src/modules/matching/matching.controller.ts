import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
  ForbiddenException,
} from "@nestjs/common";
import { MatchingService } from "./matching.service";
import { MatchingRequestStatus } from "./entities/matching-request.entity";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("matching")
@UseGuards(JwtAuthGuard)
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Post()
  create(@Body() createMatchingRequestDto: any, @Request() req: any) {
    const user = req.user;

    // Set the requester ID from the authenticated user
    createMatchingRequestDto.requesterId = user.id;

    // If user is a team member, set company ID from their profile
    if (user.userType === "team_member" && user.companyId) {
      createMatchingRequestDto.companyId = user.companyId;
    }

    return this.matchingService.create(createMatchingRequestDto);
  }

  @Get()
  findAll(@Query() query: any, @Request() req: any) {
    const user = req.user;

    // Filter by user permissions
    if (user.userType === "company_admin" && user.companyId) {
      query.companyId = user.companyId;
    } else if (user.userType === "team_member") {
      query.requesterId = user.id;
    }
    // Platform admins and coaches can see all requests

    return this.matchingService.findAll(query);
  }

  @Get(":id")
  async findOne(@Param("id") id: string, @Request() req: any) {
    const matchingRequest = await this.matchingService.findOne(id);
    const user = req.user;

    // Check permissions
    if (
      user.userType !== "platform_admin" &&
      user.userType !== "coach" &&
      matchingRequest.requesterId !== user.id &&
      (user.userType !== "company_admin" ||
        matchingRequest.companyId !== user.companyId)
    ) {
      throw new ForbiddenException(
        "You don't have access to this matching request",
      );
    }

    return matchingRequest;
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateMatchingRequestDto: any,
    @Request() req: any,
  ) {
    const user = req.user;
    return this.matchingService.update(
      id,
      updateMatchingRequestDto,
      user.id,
      user.userType,
      user.companyId,
    );
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Request() req: any) {
    const user = req.user;
    return this.matchingService.remove(
      id,
      user.id,
      user.userType,
      user.companyId,
    );
  }

  /**
   * Get company's matching requests
   */
  @Get("company/:companyId")
  async getCompanyRequests(
    @Param("companyId") companyId: string,
    @Request() req: any,
  ) {
    const user = req.user;

    // Only allow company admins to access their own company requests or platform admins
    if (
      user.userType !== "platform_admin" &&
      (user.userType !== "company_admin" || user.companyId !== companyId)
    ) {
      throw new ForbiddenException(
        "You can only access your own company's requests",
      );
    }

    return this.matchingService.getCompanyRequests(companyId);
  }

  /**
   * Get user's matching requests
   */
  @Get("user/:userId")
  async getUserRequests(@Param("userId") userId: string, @Request() req: any) {
    const user = req.user;

    // Only allow users to access their own requests, company admins to access their employees' requests, or platform admins
    if (
      user.userType !== "platform_admin" &&
      user.id !== userId &&
      user.userType !== "company_admin"
    ) {
      throw new ForbiddenException(
        "You can only access your own requests or your employees' requests",
      );
    }

    return this.matchingService.getUserRequests(userId);
  }

  /**
   * Update request status
   */
  @Patch(":id/status")
  updateStatus(
    @Param("id") id: string,
    @Body() body: { status: MatchingRequestStatus },
    @Request() req: any,
  ) {
    const user = req.user;
    return this.matchingService.updateStatus(
      id,
      body.status,
      user.id,
      user.userType,
    );
  }

  /**
   * Get pending requests (admin only)
   */
  @Get("status/pending")
  getPendingRequests(@Request() req: any) {
    const user = req.user;
    if (user.userType !== "platform_admin") {
      throw new ForbiddenException("Only platform admins can access this");
    }
    return this.matchingService.getPendingRequests();
  }

  /**
   * Get processing requests (admin only)
   */
  @Get("status/processing")
  getProcessingRequests(@Request() req: any) {
    const user = req.user;
    if (user.userType !== "platform_admin") {
      throw new ForbiddenException("Only platform admins can access this");
    }
    return this.matchingService.getProcessingRequests();
  }
}
