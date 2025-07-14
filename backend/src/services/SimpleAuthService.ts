import { logger } from "../config/logger.js";

export interface AuthResult {
  user: {
    id: string;
    email: string;
    name: string;
    firstName: string;
    lastName: string;
    userType: string;
    picture?: string;
    provider: string;
  };
  token: string;
  refreshToken: string;
}

export class AuthService {
  async login(email: string, password: string): Promise<AuthResult> {
    logger.info(`Login attempt for: ${email}`);

    const mockUsers = [
      {
        id: "platform-admin-1",
        email: "platform@peptok.com",
        name: "Platform Admin",
        firstName: "Platform",
        lastName: "Admin",
        userType: "platform_admin",
      },
      {
        id: "company-admin-1",
        email: "admin@company.com",
        name: "Company Admin",
        firstName: "Company",
        lastName: "Admin",
        userType: "company_admin",
      },
    ];

    const user = mockUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    );

    if (!user) {
      throw new Error("User not found");
    }

    const token = `mock_jwt_token_${user.id}_${Date.now()}`;

    return {
      user: {
        ...user,
        picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.firstName}`,
        provider: "email",
      },
      token,
      refreshToken: `mock_refresh_token_${user.id}_${Date.now()}`,
    };
  }

  async register(userData: any): Promise<AuthResult> {
    logger.info(`Registration for: ${userData.email}`);

    const newUser = {
      id: `user_${Date.now()}`,
      email: userData.email,
      name: `${userData.firstName} ${userData.lastName}`,
      firstName: userData.firstName,
      lastName: userData.lastName,
      userType: userData.userType || "team_member",
    };

    const token = `mock_jwt_token_${newUser.id}_${Date.now()}`;

    return {
      user: {
        ...newUser,
        picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newUser.firstName}`,
        provider: "email",
      },
      token,
      refreshToken: `mock_refresh_token_${newUser.id}_${Date.now()}`,
    };
  }

  async loginWithGoogle(token: string): Promise<AuthResult> {
    logger.info(`Google OAuth login`);

    const mockGoogleUser = {
      id: "google_user_" + Date.now(),
      email: "google@example.com",
      name: "Google User",
      firstName: "Google",
      lastName: "User",
      userType: "team_member",
    };

    const jwtToken = `mock_jwt_token_${mockGoogleUser.id}_${Date.now()}`;

    return {
      user: {
        ...mockGoogleUser,
        picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=google",
        provider: "google",
      },
      token: jwtToken,
      refreshToken: `mock_refresh_token_${mockGoogleUser.id}_${Date.now()}`,
    };
  }

  async loginWithMicrosoft(token: string): Promise<AuthResult> {
    logger.info(`Microsoft OAuth login`);

    const mockMicrosoftUser = {
      id: "microsoft_user_" + Date.now(),
      email: "microsoft@example.com",
      name: "Microsoft User",
      firstName: "Microsoft",
      lastName: "User",
      userType: "team_member",
    };

    const jwtToken = `mock_jwt_token_${mockMicrosoftUser.id}_${Date.now()}`;

    return {
      user: {
        ...mockMicrosoftUser,
        picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=microsoft",
        provider: "microsoft",
      },
      token: jwtToken,
      refreshToken: `mock_refresh_token_${mockMicrosoftUser.id}_${Date.now()}`,
    };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    logger.info(`Forgot password for: ${email}`);
    return { message: "Password reset email sent (mock)" };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    logger.info(`Password reset`);
    return { message: "Password reset successfully (mock)" };
  }
}

export const authService = new AuthService();
