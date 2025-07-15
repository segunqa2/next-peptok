import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User, UserStatus } from "../users/entities/user.entity";
import { Coach } from "../coaches/entities/coach.entity";
import { Company } from "../companies/entities/company.entity";
import { Session, SessionStatus } from "../sessions/entities/session.entity";
import { Review } from "../reviews/entities/review.entity";

@Injectable()
export class PlatformService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Coach)
    private readonly coachRepository: Repository<Coach>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
  ) {}

  async getPublicStatistics() {
    try {
      // Get basic counts for public display
      const [totalCoaches, totalSessions, totalCompanies, averageRatingResult] =
        await Promise.all([
          this.coachRepository.count({ where: { isActive: true } }),
          this.sessionRepository.count(),
          this.companyRepository.count({ where: { isActive: true } }),
          this.reviewRepository
            .createQueryBuilder("review")
            .select("AVG(review.rating)", "averageRating")
            .getRawOne(),
        ]);

      // Calculate average rating
      const averageRating = averageRatingResult?.averageRating
        ? parseFloat(parseFloat(averageRatingResult.averageRating).toFixed(1))
        : 0;

      return {
        totalCoaches,
        totalSessions,
        totalCompanies,
        averageRating,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error calculating public platform statistics:", error);
      // Return default statistics if calculation fails
      return {
        totalCoaches: 0,
        totalSessions: 0,
        totalCompanies: 0,
        averageRating: 0,
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  async getStatistics() {
    try {
      // Get total counts
      const [
        totalCoaches,
        totalSessions,
        totalCompanies,
        totalUsers,
        activeSessions,
        averageRatingResult,
      ] = await Promise.all([
        this.coachRepository.count({ where: { isActive: true } }),
        this.sessionRepository.count(),
        this.companyRepository.count({ where: { isActive: true } }),
        this.userRepository.count({ where: { status: UserStatus.ACTIVE } }),
        this.sessionRepository.count({
          where: { status: SessionStatus.IN_PROGRESS },
        }),
        this.reviewRepository
          .createQueryBuilder("review")
          .select("AVG(review.rating)", "averageRating")
          .getRawOne(),
      ]);

      // Calculate average rating
      const averageRating = averageRatingResult?.averageRating
        ? parseFloat(parseFloat(averageRatingResult.averageRating).toFixed(1))
        : 0;

      return {
        totalCoaches,
        totalSessions,
        totalCompanies,
        averageRating,
        totalUsers,
        activeSessions,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error calculating platform statistics:", error);
      // Return default statistics if calculation fails
      return {
        totalCoaches: 0,
        totalSessions: 0,
        totalCompanies: 0,
        averageRating: 0,
        totalUsers: 0,
        activeSessions: 0,
        lastUpdated: new Date().toISOString(),
      };
    }
  }
}
