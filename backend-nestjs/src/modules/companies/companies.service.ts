import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Company } from "./entities/company.entity";
import { Session, SessionStatus } from "../sessions/entities/session.entity";
import {
  MatchingRequest,
  MatchingRequestStatus,
} from "../matching/entities/matching-request.entity";

export interface CompanyDashboardMetrics {
  // Core metrics
  activeSessions: number;
  activeCoaching: number; // Same as active programs/requests
  goalsProgress: number; // Percentage of completed sessions vs total
  totalHours: number;

  // Additional metrics
  totalPrograms: number;
  completedPrograms: number;
  pendingPrograms: number;
  totalParticipants: number;
  averageRating: number;
  monthlySpend: number;
  completedSessions: number;
  scheduledSessions: number;

  // Engagement metrics
  engagementRate: number;
  successRate: number;
  retentionRate: number;
}

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(MatchingRequest)
    private readonly matchingRequestRepository: Repository<MatchingRequest>,
  ) {}

  async create(createCompanyDto: any): Promise<Company> {
    const company = this.companyRepository.create(createCompanyDto);
    return await this.companyRepository.save(company);
  }

  async findAll(query: any): Promise<Company[]> {
    const { skip = 0, take = 10, status } = query;
    const queryBuilder = this.companyRepository.createQueryBuilder("company");

    if (status) {
      queryBuilder.where("company.status = :status", { status });
    }

    return queryBuilder.skip(skip).take(take).getMany();
  }

  async findOne(id: string): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { id },
      relations: ["users", "sessions", "matchingRequests"],
    });
    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }
    return company;
  }

  async update(id: string, updateCompanyDto: any): Promise<Company> {
    const company = await this.findOne(id);
    Object.assign(company, updateCompanyDto);
    return this.companyRepository.save(company);
  }

  async remove(id: string): Promise<void> {
    const result = await this.companyRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }
  }

  /**
   * Get comprehensive dashboard metrics for a company
   */
  async getDashboardMetrics(
    companyId: string,
  ): Promise<CompanyDashboardMetrics> {
    // Verify company exists
    const company = await this.findOne(companyId);

    // Get all sessions for this company
    const sessions = await this.sessionRepository
      .createQueryBuilder("session")
      .leftJoinAndSelect("session.reviews", "reviews")
      .where("session.companyId = :companyId", { companyId })
      .getMany();

    // Get all coaching requests/programs for this company
    const matchingRequests = await this.matchingRequestRepository
      .createQueryBuilder("request")
      .where("request.companyId = :companyId", { companyId })
      .getMany();

    // Calculate metrics
    const activeSessions = sessions.filter(
      (s) =>
        s.status === SessionStatus.SCHEDULED ||
        s.status === SessionStatus.CONFIRMED ||
        s.status === SessionStatus.IN_PROGRESS,
    ).length;

    const completedSessions = sessions.filter(
      (s) => s.status === SessionStatus.COMPLETED,
    ).length;

    const scheduledSessions = sessions.filter(
      (s) =>
        s.status === SessionStatus.SCHEDULED ||
        s.status === SessionStatus.CONFIRMED,
    ).length;

    const activeCoaching = matchingRequests.filter(
      (r) =>
        r.status === MatchingRequestStatus.PROCESSING ||
        r.status === MatchingRequestStatus.PENDING,
    ).length;

    const completedPrograms = matchingRequests.filter(
      (r) => r.status === MatchingRequestStatus.COMPLETED,
    ).length;

    const totalPrograms = matchingRequests.length;
    const pendingPrograms = matchingRequests.filter(
      (r) => r.status === MatchingRequestStatus.PENDING,
    ).length;

    // Calculate total hours from completed sessions
    const totalHours = sessions
      .filter((s) => s.status === SessionStatus.COMPLETED)
      .reduce((total, session) => {
        return total + session.durationMinutes / 60;
      }, 0);

    // Calculate goals progress (percentage of completed sessions vs total)
    const goalsProgress =
      sessions.length > 0
        ? Math.round((completedSessions / sessions.length) * 100)
        : 0;

    // Calculate average rating from session reviews
    const allReviews = sessions.flatMap((s) => s.reviews || []);
    const averageRating =
      allReviews.length > 0
        ? allReviews.reduce((sum, review) => sum + review.rating, 0) /
          allReviews.length
        : 0;

    // Calculate monthly spend (sum of session costs for current month)
    const currentMonth = new Date();
    const firstDayOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1,
    );
    const lastDayOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0,
    );

    const monthlySpend = sessions
      .filter(
        (s) =>
          s.createdAt >= firstDayOfMonth &&
          s.createdAt <= lastDayOfMonth &&
          (s.status === SessionStatus.COMPLETED ||
            s.status === SessionStatus.IN_PROGRESS),
      )
      .reduce((total, session) => total + Number(session.totalAmount), 0);

    // Calculate engagement rate (active users vs total company employees)
    const uniqueParticipants = new Set(sessions.map((s) => s.employeeId)).size;
    const engagementRate =
      company.employeeCount > 0
        ? Math.round((uniqueParticipants / company.employeeCount) * 100)
        : 0;

    // Calculate success rate (completed vs total sessions)
    const successRate =
      sessions.length > 0
        ? Math.round((completedSessions / sessions.length) * 100)
        : 0;

    // Calculate retention rate (active participants vs total participants)
    const activeParticipants = sessions
      .filter(
        (s) =>
          s.status === SessionStatus.SCHEDULED ||
          s.status === SessionStatus.IN_PROGRESS,
      )
      .map((s) => s.employeeId);
    const uniqueActiveParticipants = new Set(activeParticipants).size;

    const retentionRate =
      uniqueParticipants > 0
        ? Math.round((uniqueActiveParticipants / uniqueParticipants) * 100)
        : 0;

    return {
      activeSessions,
      activeCoaching,
      goalsProgress,
      totalHours: Math.round(totalHours * 10) / 10, // Round to 1 decimal place
      totalPrograms,
      completedPrograms,
      pendingPrograms,
      totalParticipants: uniqueParticipants,
      averageRating: Math.round(averageRating * 10) / 10,
      monthlySpend: Math.round(monthlySpend),
      completedSessions,
      scheduledSessions,
      engagementRate,
      successRate,
      retentionRate,
    };
  }

  /**
   * Get program/request statistics for a company
   */
  async getProgramStats(companyId: string) {
    await this.findOne(companyId); // Verify company exists

    const requests = await this.matchingRequestRepository
      .createQueryBuilder("request")
      .where("request.companyId = :companyId", { companyId })
      .getMany();

    return {
      total: requests.length,
      pending: requests.filter(
        (r) => r.status === MatchingRequestStatus.PENDING,
      ).length,
      processing: requests.filter(
        (r) => r.status === MatchingRequestStatus.PROCESSING,
      ).length,
      completed: requests.filter(
        (r) => r.status === MatchingRequestStatus.COMPLETED,
      ).length,
      failed: requests.filter((r) => r.status === MatchingRequestStatus.FAILED)
        .length,
    };
  }

  /**
   * Get session statistics for a company
   */
  async getSessionStats(companyId: string) {
    await this.findOne(companyId); // Verify company exists

    const sessions = await this.sessionRepository
      .createQueryBuilder("session")
      .where("session.companyId = :companyId", { companyId })
      .getMany();

    const totalHours = sessions
      .filter((s) => s.status === SessionStatus.COMPLETED)
      .reduce((total, session) => total + session.durationMinutes / 60, 0);

    return {
      total: sessions.length,
      scheduled: sessions.filter((s) => s.status === SessionStatus.SCHEDULED)
        .length,
      confirmed: sessions.filter((s) => s.status === SessionStatus.CONFIRMED)
        .length,
      inProgress: sessions.filter((s) => s.status === SessionStatus.IN_PROGRESS)
        .length,
      completed: sessions.filter((s) => s.status === SessionStatus.COMPLETED)
        .length,
      cancelled: sessions.filter((s) => s.status === SessionStatus.CANCELLED)
        .length,
      noShow: sessions.filter((s) => s.status === SessionStatus.NO_SHOW).length,
      totalHours: Math.round(totalHours * 10) / 10,
    };
  }
}
