import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PlatformController } from "./platform.controller";
import { PlatformService } from "./platform.service";
import { User } from "../users/entities/user.entity";
import { Coach } from "../coaches/entities/coach.entity";
import { Company } from "../companies/entities/company.entity";
import { Session } from "../sessions/entities/session.entity";
import { Review } from "../reviews/entities/review.entity";

@Module({
  imports: [TypeOrmModule.forFeature([User, Coach, Company, Session, Review])],
  controllers: [PlatformController],
  providers: [PlatformService],
  exports: [PlatformService],
})
export class PlatformModule {}
