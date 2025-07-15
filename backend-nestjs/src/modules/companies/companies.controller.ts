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
import { CompaniesService } from "./companies.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";

@Controller("companies")
@UseGuards(JwtAuthGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @UseGuards(RolesGuard)
  create(@Body() createCompanyDto: any) {
    return this.companiesService.create(createCompanyDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  findAll(@Query() query: any) {
    return this.companiesService.findAll(query);
  }

  @Get(":id")
  async findOne(@Param("id") id: string, @Request() req: any) {
    // Only allow company admins to view their own company or platform admins to view any
    const user = req.user;
    if (
      user.userType !== "platform_admin" &&
      (user.userType !== "company_admin" || user.companyId !== id)
    ) {
      throw new ForbiddenException(
        "You can only access your own company information",
      );
    }
    return this.companiesService.findOne(id);
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() updateCompanyDto: any,
    @Request() req: any,
  ) {
    // Only allow company admins to update their own company or platform admins to update any
    const user = req.user;
    if (
      user.userType !== "platform_admin" &&
      (user.userType !== "company_admin" || user.companyId !== id)
    ) {
      throw new ForbiddenException(
        "You can only update your own company information",
      );
    }
    return this.companiesService.update(id, updateCompanyDto);
  }

  @Delete(":id")
  @UseGuards(RolesGuard)
  remove(@Param("id") id: string) {
    return this.companiesService.remove(id);
  }

  /**
   * Get comprehensive dashboard metrics for a company
   * Accessible by company admins for their own company or platform admins for any company
   */
  @Get(":id/dashboard-metrics")
  async getDashboardMetrics(@Param("id") id: string, @Request() req: any) {
    const user = req.user;
    if (
      user.userType !== "platform_admin" &&
      (user.userType !== "company_admin" || user.companyId !== id)
    ) {
      throw new ForbiddenException(
        "You can only access your own company metrics",
      );
    }
    return this.companiesService.getDashboardMetrics(id);
  }

  /**
   * Get program statistics for a company
   */
  @Get(":id/program-stats")
  async getProgramStats(@Param("id") id: string, @Request() req: any) {
    const user = req.user;
    if (
      user.userType !== "platform_admin" &&
      (user.userType !== "company_admin" || user.companyId !== id)
    ) {
      throw new ForbiddenException(
        "You can only access your own company program statistics",
      );
    }
    return this.companiesService.getProgramStats(id);
  }

  /**
   * Get session statistics for a company
   */
  @Get(":id/session-stats")
  async getSessionStats(@Param("id") id: string, @Request() req: any) {
    const user = req.user;
    if (
      user.userType !== "platform_admin" &&
      (user.userType !== "company_admin" || user.companyId !== id)
    ) {
      throw new ForbiddenException(
        "You can only access your own company session statistics",
      );
    }
    return this.companiesService.getSessionStats(id);
  }
}
