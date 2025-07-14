import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcryptjs";
import { ConfigService } from "@nestjs/config";
import {
  User,
  UserRole,
  UserStatus,
  AuthProvider,
} from "../users/entities/user.entity";

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: any): Promise<AuthResult> {
    const { email, password, firstName, lastName, username } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: [{ email }, { username }],
    });

    if (existingUser) {
      throw new ConflictException(
        "User with this email or username already exists",
      );
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      username,
      role: UserRole.EMPLOYEE,
      status: UserStatus.PENDING,
      authProvider: AuthProvider.LOCAL,
    });

    const savedUser = await this.userRepository.save(user);

    // Generate access token
    const accessToken = this.generateAccessToken(savedUser);

    return {
      user: savedUser,
      accessToken,
    };
  }

  async login(user: User): Promise<AuthResult> {
    // Check if user is active
    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException("Account is suspended");
    }

    // Update last login
    await this.userRepository.update(user.id, {
      lastLoginAt: new Date(),
    });

    // Generate access token
    const accessToken = this.generateAccessToken(user);

    return {
      user,
      accessToken,
    };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: [{ email }, { username: email }],
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }

    return null;
  }

  async validateJwtPayload(payload: JwtPayload): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      relations: ["company"],
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException("Account is suspended");
    }

    return user;
  }

  async forgotPassword(dto: { email: string }): Promise<void> {
    const { email } = dto;

    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists
      return;
    }

    // Generate reset token
    const resetToken = this.generateResetToken();
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await this.userRepository.update(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
    });

    // TODO: Send email with reset token
    // await this.emailService.sendPasswordReset(user.email, resetToken);
  }

  async resetPassword(resetPasswordDto: any): Promise<void> {
    const { token, newPassword } = resetPasswordDto;

    const user = await this.userRepository.findOne({
      where: {
        passwordResetToken: token,
      },
    });

    if (!user || user.passwordResetExpires < new Date()) {
      throw new BadRequestException("Invalid or expired reset token");
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear reset token
    await this.userRepository.update(user.id, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    });
  }

  private generateAccessToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }

  private generateResetToken(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}
