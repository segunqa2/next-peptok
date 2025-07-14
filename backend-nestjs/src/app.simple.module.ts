import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { CoachingRequestsController } from "./coaching-requests.controller";
import { CoachesController } from "./coaches.controller";
import { MatchingController } from "./matching.controller";
import { DatabaseService } from "./database.service";
import { MatchingService } from "./matching.service";

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
  ],
  controllers: [
    AppController,
    CoachingRequestsController,
    CoachesController,
    MatchingController,
  ],
  providers: [AppService, DatabaseService, MatchingService],
})
export class AppModule {}
