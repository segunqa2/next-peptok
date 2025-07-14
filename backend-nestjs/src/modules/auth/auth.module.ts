import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersModule } from "../users/users.module";
import { User } from "../users/entities/user.entity";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { LocalStrategy } from "./strategies/local.strategy";
import { GoogleStrategy } from "./strategies/google.strategy";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { GoogleAuthGuard } from "./guards/google-auth.guard";
import { RolesGuard } from "./guards/roles.guard";

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: configService.get<string>("JWT_EXPIRES_IN", "7d"),
        },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    GoogleStrategy,
    JwtAuthGuard,
    LocalAuthGuard,
    GoogleAuthGuard,
    RolesGuard,
  ],
  exports: [
    AuthService,
    JwtAuthGuard,
    LocalAuthGuard,
    GoogleAuthGuard,
    RolesGuard,
  ],
})
export class AuthModule {}
