import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { User, UserType, UserStatus, OAuthProvider } from "@/models/User.js";
import { IUserRepository } from "@/repositories/interfaces/IUserRepository.js";
import {
  IAuthService,
  LoginCredentials,
  RegisterData,
  OAuthData,
  AuthResult,
  TokenPayload,
} from "./interfaces/IAuthService.js";
import { logger } from "@/config/logger.js";

export class AuthService implements IAuthService {
  private readonly saltRounds = 12;
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;
  private readonly refreshTokenExpiresIn: string;

  constructor(private readonly userRepository: IUserRepository) {
    this.jwtSecret =
      process.env.JWT_SECRET || "default-secret-change-in-production";
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || "24h";
    this.refreshTokenExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

    if (
      process.env.NODE_ENV === "production" &&
      this.jwtSecret === "default-secret-change-in-production"
    ) {
      throw new Error("JWT_SECRET must be set in production environment");
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const { email, password } = credentials;

      // Find user by email
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        throw new Error("Invalid email or password");
      }

      // Check if user is active
      if (user.status !== UserStatus.ACTIVE) {
        throw new Error(
          "Account is not active. Please verify your email or contact support.",
        );
      }

      // Verify password
      if (!user.passwordHash) {
        throw new Error("Please login using your OAuth provider");
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new Error("Invalid email or password");
      }

      // Update last login
      await this.userRepository.updateLastLogin(user.id);

      // Generate tokens
      const token = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      logger.info("User logged in successfully", {
        userId: user.id,
        email: user.email,
      });

      return {
        user,
        token,
        refreshToken,
        expiresIn: this.getTokenExpirationTime(),
      };
    } catch (error) {
      logger.error("Login failed", {
        email: credentials.email,
        error: error.message,
      });
      throw error;
    }
  }

  async register(data: RegisterData): Promise<AuthResult> {
    try {
      const { email, password, firstName, lastName, userType, phone } = data;

      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        throw new Error("User with this email already exists");
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, this.saltRounds);

      // Create user
      const user = new User({
        id: uuidv4(),
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        userType,
        phone,
        status: UserStatus.PENDING_VERIFICATION,
        oauthProvider: OAuthProvider.EMAIL,
      });

      const createdUser = await this.userRepository.create(user);

      // Send verification email (implement this based on your email service)
      await this.sendEmailVerification(createdUser.id);

      // Generate tokens
      const token = this.generateAccessToken(createdUser);
      const refreshToken = this.generateRefreshToken(createdUser);

      logger.info("User registered successfully", {
        userId: createdUser.id,
        email: createdUser.email,
      });

      return {
        user: createdUser,
        token,
        refreshToken,
        expiresIn: this.getTokenExpirationTime(),
      };
    } catch (error) {
      logger.error("Registration failed", {
        email: data.email,
        error: error.message,
      });
      throw error;
    }
  }

  async authenticateOAuth(data: OAuthData): Promise<AuthResult> {
    try {
      const { provider, oauthId, email, firstName, lastName, avatarUrl } = data;

      // Try to find existing user by OAuth
      let user = await this.userRepository.findByOAuth(provider, oauthId);

      if (!user) {
        // Try to find user by email (for linking accounts)
        user = await this.userRepository.findByEmail(email);

        if (user) {
          // Link OAuth account to existing user
          user.oauthProvider = provider as OAuthProvider;
          user.oauthId = oauthId;
          if (avatarUrl) user.avatarUrl = avatarUrl;
          user = await this.userRepository.update(user.id, user);
        } else {
          // Create new user from OAuth data
          user = new User({
            id: uuidv4(),
            email: email.toLowerCase(),
            firstName,
            lastName,
            userType: UserType.ENTERPRISE, // Default, can be changed later
            status: UserStatus.ACTIVE, // OAuth users are auto-verified
            oauthProvider: provider as OAuthProvider,
            oauthId,
            avatarUrl,
            emailVerifiedAt: new Date(),
          });

          user = await this.userRepository.create(user);
        }
      }

      // Update last login
      await this.userRepository.updateLastLogin(user.id);

      // Generate tokens
      const token = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      logger.info("OAuth authentication successful", {
        userId: user.id,
        provider,
      });

      return {
        user,
        token,
        refreshToken,
        expiresIn: this.getTokenExpirationTime(),
      };
    } catch (error) {
      logger.error("OAuth authentication failed", {
        provider: data.provider,
        email: data.email,
        error: error.message,
      });
      throw error;
    }
  }

  async verifyToken(token: string): Promise<User> {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as TokenPayload;
      const user = await this.userRepository.findById(payload.userId);

      if (!user) {
        throw new Error("User not found");
      }

      if (user.status !== UserStatus.ACTIVE) {
        throw new Error("User account is not active");
      }

      return user;
    } catch (error) {
      logger.error("Token verification failed", { error: error.message });
      throw new Error("Invalid or expired token");
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      const payload = jwt.verify(refreshToken, this.jwtSecret) as TokenPayload;
      const user = await this.userRepository.findById(payload.userId);

      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new Error("Invalid refresh token");
      }

      // Generate new tokens
      const newToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      return {
        user,
        token: newToken,
        refreshToken: newRefreshToken,
        expiresIn: this.getTokenExpirationTime(),
      };
    } catch (error) {
      logger.error("Refresh token failed", { error: error.message });
      throw new Error("Invalid or expired refresh token");
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    try {
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not
        logger.info("Password reset requested for non-existent email", {
          email,
        });
        return;
      }

      // Generate reset token (implement this based on your requirements)
      const resetToken = this.generatePasswordResetToken(user);

      // Send password reset email (implement this based on your email service)
      // await this.emailService.sendPasswordResetEmail(user.email, resetToken);

      logger.info("Password reset requested", { userId: user.id, email });
    } catch (error) {
      logger.error("Password reset request failed", {
        email,
        error: error.message,
      });
      throw error;
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      // Verify reset token and get user ID
      const payload = jwt.verify(token, this.jwtSecret) as any;
      const user = await this.userRepository.findById(payload.userId);

      if (!user) {
        throw new Error("Invalid reset token");
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, this.saltRounds);

      // Update user password
      await this.userRepository.update(user.id, { passwordHash });

      logger.info("Password reset successful", { userId: user.id });
    } catch (error) {
      logger.error("Password reset failed", { error: error.message });
      throw new Error("Invalid or expired reset token");
    }
  }

  async sendEmailVerification(userId: string): Promise<void> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Generate verification token
      const verificationToken = this.generateEmailVerificationToken(user);

      // Send verification email (implement this based on your email service)
      // await this.emailService.sendEmailVerification(user.email, verificationToken);

      logger.info("Email verification sent", { userId, email: user.email });
    } catch (error) {
      logger.error("Send email verification failed", {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  async verifyEmail(token: string): Promise<void> {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as any;
      await this.userRepository.markAsVerified(payload.userId);

      logger.info("Email verified successfully", { userId: payload.userId });
    } catch (error) {
      logger.error("Email verification failed", { error: error.message });
      throw new Error("Invalid or expired verification token");
    }
  }

  async logout(token: string): Promise<void> {
    try {
      // In a production app, you would add the token to a blacklist
      // For now, we'll just log the logout
      const payload = jwt.verify(token, this.jwtSecret) as TokenPayload;
      logger.info("User logged out", { userId: payload.userId });
    } catch (error) {
      logger.error("Logout failed", { error: error.message });
      throw error;
    }
  }

  private generateAccessToken(user: User): string {
    const payload: Omit<TokenPayload, "iat" | "exp"> = {
      userId: user.id,
      email: user.email,
      userType: user.userType,
    };

    return jwt.sign(payload, this.jwtSecret, { expiresIn: this.jwtExpiresIn });
  }

  private generateRefreshToken(user: User): string {
    const payload = {
      userId: user.id,
      type: "refresh",
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.refreshTokenExpiresIn,
    });
  }

  private generatePasswordResetToken(user: User): string {
    const payload = {
      userId: user.id,
      type: "password_reset",
    };

    return jwt.sign(payload, this.jwtSecret, { expiresIn: "1h" });
  }

  private generateEmailVerificationToken(user: User): string {
    const payload = {
      userId: user.id,
      type: "email_verification",
    };

    return jwt.sign(payload, this.jwtSecret, { expiresIn: "24h" });
  }

  private getTokenExpirationTime(): number {
    // Convert JWT expiration to seconds
    const match = this.jwtExpiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 3600; // Default 1 hour

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case "s":
        return value;
      case "m":
        return value * 60;
      case "h":
        return value * 3600;
      case "d":
        return value * 86400;
      default:
        return 3600;
    }
  }
}
