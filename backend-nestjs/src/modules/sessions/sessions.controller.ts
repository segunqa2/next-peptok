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
import { SessionsService } from "./sessions.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("sessions")
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  create(@Body() createSessionDto: any) {
    return this.sessionsService.create(createSessionDto);
  }

  @Get()
  findAll(@Query() query: any, @Request() req: any) {
    const user = req.user;

    // Filter by user permissions
    if (user.userType === "company_admin" && user.companyId) {
      query.companyId = user.companyId;
    } else if (user.userType === "coach") {
      query.coachId = user.id;
    } else if (user.userType === "team_member") {
      query.employeeId = user.id;
    }
    // Platform admins can see all sessions

    return this.sessionsService.findAll(query);
  }

  @Get(":id")
  async findOne(@Param("id") id: string, @Request() req: any) {
    const session = await this.sessionsService.findOne(id);
    const user = req.user;

    // Check permissions
    if (
      user.userType !== "platform_admin" &&
      session.companyId !== user.companyId &&
      session.coachId !== user.id &&
      session.employeeId !== user.id
    ) {
      throw new ForbiddenException("You don't have access to this session");
    }

    return session;
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() updateSessionDto: any,
    @Request() req: any,
  ) {
    const session = await this.sessionsService.findOne(id);
    const user = req.user;

    // Check permissions - only company admin, coach, or platform admin can update
    if (
      user.userType !== "platform_admin" &&
      session.companyId !== user.companyId &&
      session.coachId !== user.id
    ) {
      throw new ForbiddenException(
        "You don't have permission to update this session",
      );
    }

    return this.sessionsService.update(id, updateSessionDto);
  }

  @Delete(":id")
  async remove(@Param("id") id: string, @Request() req: any) {
    const session = await this.sessionsService.findOne(id);
    const user = req.user;

    // Check permissions - only company admin or platform admin can delete
    if (
      user.userType !== "platform_admin" &&
      (user.userType !== "company_admin" ||
        session.companyId !== user.companyId)
    ) {
      throw new ForbiddenException(
        "You don't have permission to delete this session",
      );
    }

    return this.sessionsService.remove(id);
  }

  /**
   * Generate sessions for a program
   */
  @Post("generate-for-program")
  async generateSessionsForProgram(
    @Body() generateSessionsDto: any,
    @Request() req: any,
  ) {
    const user = req.user;

    // Only company admins can generate sessions for their programs
    if (
      user.userType !== "company_admin" &&
      user.userType !== "platform_admin"
    ) {
      throw new ForbiddenException(
        "Only company administrators can generate program sessions",
      );
    }

    return this.sessionsService.generateSessionsForProgram(generateSessionsDto);
  }

  /**
   * Get sessions for a specific program
   */
  @Get("program/:programId")
  async getSessionsForProgram(
    @Param("programId") programId: string,
    @Request() req: any,
  ) {
    const sessions =
      await this.sessionsService.getSessionsForProgram(programId);
    const user = req.user;

    // Check if user has access to any of these sessions
    if (
      user.userType !== "platform_admin" &&
      sessions.length > 0 &&
      sessions[0].companyId !== user.companyId &&
      !sessions.some((s) => s.coachId === user.id || s.employeeId === user.id)
    ) {
      throw new ForbiddenException(
        "You don't have access to these program sessions",
      );
    }

    return sessions;
  }

  /**
   * Coach accepts a session
   */
  @Post(":id/accept")
  async acceptSession(@Param("id") id: string, @Request() req: any) {
    const user = req.user;

    if (user.userType !== "coach") {
      throw new ForbiddenException("Only coaches can accept sessions");
    }

    return this.sessionsService.acceptSession(id, user.id);
  }

  /**
   * Coach declines a session
   */
  @Post(":id/decline")
  async declineSession(
    @Param("id") id: string,
    @Body() body: { reason?: string },
    @Request() req: any,
  ) {
    const user = req.user;

    if (user.userType !== "coach") {
      throw new ForbiddenException("Only coaches can decline sessions");
    }

    return this.sessionsService.declineSession(id, user.id, body.reason);
  }

  /**
   * Get sessions awaiting coach acceptance
   */
  @Get("coach/awaiting-acceptance")
  async getSessionsAwaitingAcceptance(@Request() req: any) {
    const user = req.user;

    if (user.userType !== "coach") {
      throw new ForbiddenException("Only coaches can view pending sessions");
    }

    return this.sessionsService.getSessionsAwaitingAcceptance(user.id);
  }
}
