import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CacheModule } from "@nestjs/cache-manager";
import { ThrottlerModule } from "@nestjs/throttler";
import { ScheduleModule } from "@nestjs/schedule";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { WinstonModule } from "nest-winston";
import * as redisStore from "cache-manager-redis-store";
import { typeOrmConfig } from "./config/typeorm.config";
import { winstonConfig } from "./config/winston.config";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { CoachesModule } from "./modules/coaches/coaches.module";
import { SessionsModule } from "./modules/sessions/sessions.module";
import { AdminModule } from "./modules/admin/admin.module";
import { ChatModule } from "./modules/chat/chat.module";
import { ReviewsModule } from "./modules/reviews/reviews.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { MatchingModule } from "./modules/matching/matching.module";
import { OnboardingModule } from "./modules/onboarding/onboarding.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),

    // Database
    TypeOrmModule.forRoot(typeOrmConfig),

    // Cache with Redis
    CacheModule.register({
      isGlobal: true,
      store: redisStore,
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD,
      ttl: 600, // 10 minutes default TTL
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Scheduling
    ScheduleModule.forRoot(),

    // Event emitter
    EventEmitterModule.forRoot(),

    // Logging
    WinstonModule.forRoot(winstonConfig),

    // Feature modules
    AuthModule,
    UsersModule,
    CoachesModule,
    SessionsModule,
    AdminModule,
    ChatModule,
    ReviewsModule,
    PaymentsModule,
    MatchingModule,
    OnboardingModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
