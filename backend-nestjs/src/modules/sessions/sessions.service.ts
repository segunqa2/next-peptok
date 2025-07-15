import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Session, SessionStatus, SessionType } from "./entities/session.entity";
import { MatchingRequest } from "../matching/entities/matching-request.entity";

interface CreateSessionDto {
  title: string;
  description?: string;
  type?: SessionType;
  scheduledAt: Date;
  durationMinutes: number;
  coachId: string;
  employeeId: string;
  companyId: string;
  matchingRequestId?: string;
  objectives?: string[];
  agenda?: string;
  coachRate: number;
  totalAmount: number;
  serviceCharge: number;
  commission: number;
}

interface GenerateSessionsForProgramDto {
  programId: string; // MatchingRequest ID
  startDate: Date;
  endDate: Date;
  frequency: "weekly" | "bi-weekly" | "monthly";
  hoursPerSession: number;
  coachId: string;
  coachRate: number;
}

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(MatchingRequest)
    private readonly matchingRequestRepository: Repository<MatchingRequest>,
  ) {}

  async create(createSessionDto: CreateSessionDto): Promise<Session> {
    const session = this.sessionRepository.create({
      ...createSessionDto,
      status: SessionStatus.SCHEDULED,
    });
    return this.sessionRepository.save(session);
  }

  async findAll(query: any): Promise<Session[]> {
    const {
      skip = 0,
      take = 10,
      companyId,
      coachId,
      employeeId,
      status,
    } = query;
    const queryBuilder = this.sessionRepository
      .createQueryBuilder("session")
      .leftJoinAndSelect("session.coach", "coach")
      .leftJoinAndSelect("session.employee", "employee")
      .leftJoinAndSelect("session.company", "company")
      .leftJoinAndSelect("session.reviews", "reviews");

    if (companyId) {
      queryBuilder.andWhere("session.companyId = :companyId", { companyId });
    }
    if (coachId) {
      queryBuilder.andWhere("session.coachId = :coachId", { coachId });
    }
    if (employeeId) {
      queryBuilder.andWhere("session.employeeId = :employeeId", { employeeId });
    }
    if (status) {
      queryBuilder.andWhere("session.status = :status", { status });
    }

    return queryBuilder
      .orderBy("session.scheduledAt", "DESC")
      .skip(skip)
      .take(take)
      .getMany();
  }

  async findOne(id: string): Promise<Session> {
    const session = await this.sessionRepository.findOne({
      where: { id },
      relations: ["coach", "employee", "company", "reviews"],
    });
    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }
    return session;
  }

  async update(id: string, updateSessionDto: any): Promise<Session> {
    const session = await this.findOne(id);
    Object.assign(session, updateSessionDto);
    return this.sessionRepository.save(session);
  }

  async remove(id: string): Promise<void> {
    const result = await this.sessionRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }
  }

  /**
   * Generate sessions for a program based on start date, end date, and frequency
   */
  async generateSessionsForProgram(
    generateSessionsDto: GenerateSessionsForProgramDto,
  ): Promise<Session[]> {
    const {
      programId,
      startDate,
      endDate,
      frequency,
      hoursPerSession,
      coachId,
      coachRate,
    } = generateSessionsDto;

    // Validate the program exists
    const program = await this.matchingRequestRepository.findOne({
      where: { id: programId },
      relations: ["company", "requester"],
    });

    if (!program) {
      throw new NotFoundException(`Program with ID ${programId} not found`);
    }

    // Validate dates
    if (startDate >= endDate) {
      throw new BadRequestException("Start date must be before end date");
    }

    // Calculate session dates based on frequency
    const sessionDates = this.calculateSessionDates(
      startDate,
      endDate,
      frequency,
    );

    if (sessionDates.length === 0) {
      throw new BadRequestException(
        "No valid session dates found for the given parameters",
      );
    }

    // Calculate pricing
    const durationMinutes = hoursPerSession * 60;
    const totalAmount = coachRate * hoursPerSession;
    const serviceCharge = totalAmount * 0.1; // 10% service charge
    const commission = totalAmount * 0.05; // 5% commission

    // Create sessions
    const sessions: Session[] = [];
    for (let i = 0; i < sessionDates.length; i++) {
      const sessionDate = sessionDates[i];

      const sessionDto: CreateSessionDto = {
        title: `${program.goals || "Coaching Session"} - Session ${i + 1}`,
        description: `Coaching session ${i + 1} of ${sessionDates.length} for program: ${program.description || ""}`,
        type: SessionType.ONE_ON_ONE,
        scheduledAt: sessionDate,
        durationMinutes,
        coachId,
        employeeId: program.requesterId, // Assuming requester is the primary participant
        companyId: program.companyId,
        objectives: program.requiredSkills,
        coachRate,
        totalAmount,
        serviceCharge,
        commission,
      };

      const session = await this.create(sessionDto);
      sessions.push(session);
    }

    return sessions;
  }

  /**
   * Calculate session dates based on frequency
   */
  private calculateSessionDates(
    startDate: Date,
    endDate: Date,
    frequency: "weekly" | "bi-weekly" | "monthly",
  ): Date[] {
    const dates: Date[] = [];
    const current = new Date(startDate);

    // Calculate interval in days
    let intervalDays: number;
    switch (frequency) {
      case "weekly":
        intervalDays = 7;
        break;
      case "bi-weekly":
        intervalDays = 14;
        break;
      case "monthly":
        intervalDays = 30; // Approximate monthly interval
        break;
      default:
        throw new BadRequestException(`Invalid frequency: ${frequency}`);
    }

    while (current <= endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + intervalDays);
    }

    return dates;
  }

  /**
   * Get sessions for a specific program/matching request
   */
  async getSessionsForProgram(programId: string): Promise<Session[]> {
    return this.sessionRepository
      .createQueryBuilder("session")
      .leftJoinAndSelect("session.coach", "coach")
      .leftJoinAndSelect("session.employee", "employee")
      .leftJoinAndSelect("session.reviews", "reviews")
      .where("session.matchingRequestId = :programId", { programId })
      .orderBy("session.scheduledAt", "ASC")
      .getMany();
  }

  /**
   * Allow coach to accept a session
   */
  async acceptSession(sessionId: string, coachId: string): Promise<Session> {
    const session = await this.findOne(sessionId);

    if (session.coachId !== coachId) {
      throw new BadRequestException(
        "You can only accept sessions assigned to you",
      );
    }

    if (session.status !== SessionStatus.SCHEDULED) {
      throw new BadRequestException("Only scheduled sessions can be accepted");
    }

    session.status = SessionStatus.CONFIRMED;
    return this.sessionRepository.save(session);
  }

  /**
   * Allow coach to decline a session
   */
  async declineSession(
    sessionId: string,
    coachId: string,
    reason?: string,
  ): Promise<Session> {
    const session = await this.findOne(sessionId);

    if (session.coachId !== coachId) {
      throw new BadRequestException(
        "You can only decline sessions assigned to you",
      );
    }

    if (session.status !== SessionStatus.SCHEDULED) {
      throw new BadRequestException("Only scheduled sessions can be declined");
    }

    session.status = SessionStatus.CANCELLED;
    session.cancellationReason = reason || "Declined by coach";
    session.cancelledAt = new Date();
    session.cancelledBy = coachId;

    return this.sessionRepository.save(session);
  }

  /**
   * Get sessions that need coach acceptance
   */
  async getSessionsAwaitingAcceptance(coachId: string): Promise<Session[]> {
    return this.sessionRepository
      .createQueryBuilder("session")
      .leftJoinAndSelect("session.company", "company")
      .leftJoinAndSelect("session.employee", "employee")
      .where("session.coachId = :coachId", { coachId })
      .andWhere("session.status = :status", { status: SessionStatus.SCHEDULED })
      .orderBy("session.scheduledAt", "ASC")
      .getMany();
  }
}
