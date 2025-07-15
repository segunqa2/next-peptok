import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  MatchingRequest,
  MatchingRequestStatus,
  MatchingRequestPriority,
} from "./entities/matching-request.entity";

interface CreateMatchingRequestDto {
  requesterId: string;
  companyId?: string;
  requiredSkills: string[];
  preferredIndustries?: string[];
  languages?: string[];
  preferences?: any;
  description?: string;
  goals?: string;
  priority?: MatchingRequestPriority;
  maxCoaches?: number;
  deadline?: Date;
}

@Injectable()
export class MatchingService {
  constructor(
    @InjectRepository(MatchingRequest)
    private readonly matchingRequestRepository: Repository<MatchingRequest>,
  ) {}

  async create(
    createMatchingRequestDto: CreateMatchingRequestDto,
  ): Promise<MatchingRequest> {
    const matchingRequest = this.matchingRequestRepository.create({
      ...createMatchingRequestDto,
      status: MatchingRequestStatus.PENDING,
    });
    return this.matchingRequestRepository.save(matchingRequest);
  }

  async findAll(query: any): Promise<MatchingRequest[]> {
    const {
      skip = 0,
      take = 10,
      companyId,
      requesterId,
      status,
      priority,
    } = query;
    const queryBuilder = this.matchingRequestRepository
      .createQueryBuilder("request")
      .leftJoinAndSelect("request.requester", "requester")
      .leftJoinAndSelect("request.company", "company");

    if (companyId) {
      queryBuilder.andWhere("request.companyId = :companyId", { companyId });
    }
    if (requesterId) {
      queryBuilder.andWhere("request.requesterId = :requesterId", {
        requesterId,
      });
    }
    if (status) {
      queryBuilder.andWhere("request.status = :status", { status });
    }
    if (priority) {
      queryBuilder.andWhere("request.priority = :priority", { priority });
    }

    return queryBuilder
      .orderBy("request.createdAt", "DESC")
      .skip(skip)
      .take(take)
      .getMany();
  }

  async findOne(id: string): Promise<MatchingRequest> {
    const matchingRequest = await this.matchingRequestRepository.findOne({
      where: { id },
      relations: ["requester", "company"],
    });
    if (!matchingRequest) {
      throw new NotFoundException(`Matching request with ID ${id} not found`);
    }
    return matchingRequest;
  }

  async update(
    id: string,
    updateMatchingRequestDto: any,
    userId: string,
    userType: string,
    userCompanyId?: string,
  ): Promise<MatchingRequest> {
    const matchingRequest = await this.findOne(id);

    // Authorization check - only the requester, their company admin, or platform admin can update
    if (
      userType !== "platform_admin" &&
      matchingRequest.requesterId !== userId &&
      (userType !== "company_admin" ||
        matchingRequest.companyId !== userCompanyId)
    ) {
      throw new ForbiddenException(
        "You don't have permission to update this request",
      );
    }

    Object.assign(matchingRequest, updateMatchingRequestDto);
    return this.matchingRequestRepository.save(matchingRequest);
  }

  async remove(
    id: string,
    userId: string,
    userType: string,
    userCompanyId?: string,
  ): Promise<void> {
    const matchingRequest = await this.findOne(id);

    // Authorization check - only the requester, their company admin, or platform admin can delete
    if (
      userType !== "platform_admin" &&
      matchingRequest.requesterId !== userId &&
      (userType !== "company_admin" ||
        matchingRequest.companyId !== userCompanyId)
    ) {
      throw new ForbiddenException(
        "You don't have permission to delete this request",
      );
    }

    const result = await this.matchingRequestRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Matching request with ID ${id} not found`);
    }
  }

  /**
   * Get matching requests for a specific company
   */
  async getCompanyRequests(companyId: string): Promise<MatchingRequest[]> {
    return this.matchingRequestRepository
      .createQueryBuilder("request")
      .leftJoinAndSelect("request.requester", "requester")
      .leftJoinAndSelect("request.company", "company")
      .where("request.companyId = :companyId", { companyId })
      .orderBy("request.createdAt", "DESC")
      .getMany();
  }

  /**
   * Get matching requests for a specific user
   */
  async getUserRequests(userId: string): Promise<MatchingRequest[]> {
    return this.matchingRequestRepository
      .createQueryBuilder("request")
      .leftJoinAndSelect("request.requester", "requester")
      .leftJoinAndSelect("request.company", "company")
      .where("request.requesterId = :userId", { userId })
      .orderBy("request.createdAt", "DESC")
      .getMany();
  }

  /**
   * Update request status
   */
  async updateStatus(
    id: string,
    status: MatchingRequestStatus,
    userId: string,
    userType: string,
  ): Promise<MatchingRequest> {
    const matchingRequest = await this.findOne(id);

    // Only platform admins can update status to most statuses
    // Company admins can only cancel their own requests
    if (
      userType !== "platform_admin" &&
      !(
        userType === "company_admin" &&
        status === MatchingRequestStatus.FAILED &&
        matchingRequest.companyId
      )
    ) {
      throw new ForbiddenException(
        "You don't have permission to update this request status",
      );
    }

    matchingRequest.status = status;

    switch (status) {
      case MatchingRequestStatus.PROCESSING:
        matchingRequest.processedAt = new Date();
        break;
      case MatchingRequestStatus.COMPLETED:
        matchingRequest.completedAt = new Date();
        break;
      case MatchingRequestStatus.FAILED:
        // Could add failure reason here
        break;
    }

    return this.matchingRequestRepository.save(matchingRequest);
  }

  /**
   * Get requests by status
   */
  async getRequestsByStatus(
    status: MatchingRequestStatus,
  ): Promise<MatchingRequest[]> {
    return this.matchingRequestRepository
      .createQueryBuilder("request")
      .leftJoinAndSelect("request.requester", "requester")
      .leftJoinAndSelect("request.company", "company")
      .where("request.status = :status", { status })
      .orderBy("request.createdAt", "DESC")
      .getMany();
  }

  /**
   * Get pending requests that need attention
   */
  async getPendingRequests(): Promise<MatchingRequest[]> {
    return this.getRequestsByStatus(MatchingRequestStatus.PENDING);
  }

  /**
   * Get processing requests
   */
  async getProcessingRequests(): Promise<MatchingRequest[]> {
    return this.getRequestsByStatus(MatchingRequestStatus.PROCESSING);
  }
}
