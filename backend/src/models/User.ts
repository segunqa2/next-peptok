import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from "class-validator";
import { Transform } from "class-transformer";

export enum UserType {
  ADMIN = "admin",
  ENTERPRISE = "enterprise",
  COACH = "coach",
}

export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
  PENDING_VERIFICATION = "pending_verification",
}

export enum OAuthProvider {
  EMAIL = "email",
  GOOGLE = "google",
  MICROSOFT = "microsoft",
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: UserType;
  avatarUrl?: string;
  phone?: string;
}

export class User {
  @IsUUID()
  id: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @MinLength(8)
  passwordHash?: string;

  @IsString()
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @IsString()
  @Transform(({ value }) => value?.trim())
  lastName: string;

  @IsEnum(UserType)
  userType: UserType;

  @IsEnum(UserStatus)
  status: UserStatus = UserStatus.PENDING_VERIFICATION;

  @IsEnum(OAuthProvider)
  oauthProvider: OAuthProvider = OAuthProvider.EMAIL;

  @IsOptional()
  @IsString()
  oauthId?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  timezone?: string = "UTC";

  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  emailVerifiedAt?: Date;

  constructor(data: Partial<User>) {
    Object.assign(this, data);
    this.createdAt = this.createdAt || new Date();
    this.updatedAt = this.updatedAt || new Date();
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get isVerified(): boolean {
    return !!this.emailVerifiedAt;
  }

  get isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  public getProfile(): UserProfile {
    return {
      id: this.id,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      userType: this.userType,
      avatarUrl: this.avatarUrl,
      phone: this.phone,
    };
  }

  public updateProfile(
    updates: Partial<
      Pick<User, "firstName" | "lastName" | "phone" | "timezone" | "avatarUrl">
    >,
  ): void {
    Object.assign(this, updates);
    this.updatedAt = new Date();
  }

  public markAsVerified(): void {
    this.status = UserStatus.ACTIVE;
    this.emailVerifiedAt = new Date();
    this.updatedAt = new Date();
  }

  public updateLastLogin(): void {
    this.lastLoginAt = new Date();
    this.updatedAt = new Date();
  }

  public static fromDatabase(row: any): User {
    return new User({
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      firstName: row.first_name,
      lastName: row.last_name,
      userType: row.user_type as UserType,
      status: row.status as UserStatus,
      oauthProvider: row.oauth_provider as OAuthProvider,
      oauthId: row.oauth_id,
      avatarUrl: row.avatar_url,
      phone: row.phone,
      timezone: row.timezone,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastLoginAt: row.last_login_at,
      emailVerifiedAt: row.email_verified_at,
    });
  }

  public toDatabaseInsert(): Record<string, any> {
    return {
      id: this.id,
      email: this.email,
      password_hash: this.passwordHash,
      first_name: this.firstName,
      last_name: this.lastName,
      user_type: this.userType,
      status: this.status,
      oauth_provider: this.oauthProvider,
      oauth_id: this.oauthId,
      avatar_url: this.avatarUrl,
      phone: this.phone,
      timezone: this.timezone,
    };
  }
}
