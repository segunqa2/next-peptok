import { User, UserType } from "@/models/User.js";

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  phone?: string;
  companyName?: string;
  role?: string;
}

export interface OAuthData {
  provider: "google" | "microsoft";
  oauthId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

export interface AuthResult {
  user: User;
  token: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface TokenPayload {
  userId: string;
  email: string;
  userType: UserType;
  iat: number;
  exp: number;
}

export interface IAuthService {
  /**
   * Authenticate user with email and password
   */
  login(credentials: LoginCredentials): Promise<AuthResult>;

  /**
   * Register a new user
   */
  register(data: RegisterData): Promise<AuthResult>;

  /**
   * Authenticate or register user via OAuth
   */
  authenticateOAuth(data: OAuthData): Promise<AuthResult>;

  /**
   * Verify JWT token and return user
   */
  verifyToken(token: string): Promise<User>;

  /**
   * Generate new access token from refresh token
   */
  refreshToken(refreshToken: string): Promise<AuthResult>;

  /**
   * Send password reset email
   */
  requestPasswordReset(email: string): Promise<void>;

  /**
   * Reset password with token
   */
  resetPassword(token: string, newPassword: string): Promise<void>;

  /**
   * Send email verification
   */
  sendEmailVerification(userId: string): Promise<void>;

  /**
   * Verify email with token
   */
  verifyEmail(token: string): Promise<void>;

  /**
   * Logout user (invalidate token)
   */
  logout(token: string): Promise<void>;
}
