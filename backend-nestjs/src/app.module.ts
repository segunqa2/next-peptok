import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { CoachesModule } from "./modules/coaches/coaches.module";
import { createTypeOrmConfig } from "./config/typeorm.config";

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: createTypeOrmConfig,
      inject: [ConfigService],
    }),

    // Feature modules
    AuthModule,
    UsersModule,
    CoachesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
