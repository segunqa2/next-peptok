import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Coach, CoachStatus } from "./entities/coach.entity";

@Injectable()
export class CoachesService {
  constructor(
    @InjectRepository(Coach)
    private readonly coachRepository: Repository<Coach>,
  ) {}

  async create(createCoachDto: any, userId: string): Promise<Coach> {
    const coach = this.coachRepository.create({
      ...createCoachDto,
      userId,
    });
    return this.coachRepository.save(coach) as unknown as Promise<Coach>;
  }

  async findAll(query: any): Promise<{ coaches: Coach[]; total: number }> {
    const {
      skip = 0,
      take = 10,
      status,
      expertise,
      industry,
      minRating,
      maxRate,
      available,
    } = query;

    const queryBuilder = this.coachRepository
      .createQueryBuilder("coach")
      .leftJoinAndSelect("coach.user", "user");

    if (status) {
      queryBuilder.andWhere("coach.status = :status", { status });
    }

    if (expertise) {
      queryBuilder.andWhere(":expertise = ANY(coach.expertise)", {
        expertise,
      });
    }

    if (industry) {
      queryBuilder.andWhere(":industry = ANY(coach.industries)", {
        industry,
      });
    }

    if (minRating) {
      queryBuilder.andWhere("coach.rating >= :minRating", { minRating });
    }

    if (maxRate) {
      queryBuilder.andWhere("coach.hourlyRate <= :maxRate", { maxRate });
    }

    if (available !== undefined) {
      queryBuilder.andWhere("coach.isAvailable = :available", { available });
    }

    const [coaches, total] = await queryBuilder
      .skip(skip)
      .take(take)
      .getManyAndCount();

    return { coaches, total };
  }

  async search(searchDto: any): Promise<Coach[]> {
    const { skills, industry, budget, availability } = searchDto;

    const queryBuilder = this.coachRepository
      .createQueryBuilder("coach")
      .leftJoinAndSelect("coach.user", "user")
      .where("coach.status = :status", { status: CoachStatus.APPROVED })
      .andWhere("coach.isAvailable = :available", { available: true });

    if (skills?.length > 0) {
      queryBuilder.andWhere("coach.expertise && :skills", { skills });
    }

    if (industry) {
      queryBuilder.andWhere(":industry = ANY(coach.industries)", {
        industry,
      });
    }

    if (budget?.max) {
      queryBuilder.andWhere("coach.hourlyRate <= :maxBudget", {
        maxBudget: budget.max,
      });
    }

    return queryBuilder.orderBy("coach.rating", "DESC").limit(10).getMany();
  }

  async findOne(id: string): Promise<Coach> {
    const coach = await this.coachRepository.findOne({
      where: { id },
      relations: ["user"],
    });

    if (!coach) {
      throw new NotFoundException(`Coach with ID ${id} not found`);
    }

    return coach;
  }

  async update(id: string, updateCoachDto: any): Promise<Coach> {
    const coach = await this.findOne(id);
    Object.assign(coach, updateCoachDto);
    return this.coachRepository.save(coach) as unknown as Promise<Coach>;
  }

  async remove(id: string): Promise<void> {
    const result = await this.coachRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Coach with ID ${id} not found`);
    }
  }

  async updateStatus(id: string, status: string): Promise<Coach> {
    const coach = await this.findOne(id);
    coach.status = status as CoachStatus;
    return this.coachRepository.save(coach) as unknown as Promise<Coach>;
  }

  async applyToProgram(coachId: string, applicationDto: any): Promise<any> {
    const coach = await this.findOne(coachId);

    // Create coaching program application
    const application = {
      coachId,
      programId: applicationDto.programId,
      proposedRate: applicationDto.proposedRate,
      message: applicationDto.message,
      availability: applicationDto.availability,
      status: "pending",
      createdAt: new Date(),
    };

    // In a real implementation, this would save to a dedicated applications table
    // For now, we'll return the application object
    return { success: true, application };
  }
}
