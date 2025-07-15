import { toast } from "sonner";
import { User } from "../types";
import api, { setAuthToken } from "./api";
import { setCurrentUser } from "./apiEnhanced";
import { findDemoUser, getDemoDataForUser } from "../data/demoUsers";

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
  isNewUser?: boolean;
}

class AuthService {
  private currentUser: User | null = null;
  private authToken: string | null = null;

  constructor() {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage() {
    try {
      const storedUser = localStorage.getItem("peptok_user");
      const storedToken = localStorage.getItem("peptok_token");

      if (storedUser && storedToken) {
        this.currentUser = JSON.parse(storedUser);
        this.authToken = storedToken;
        setAuthToken(storedToken);
        console.log(`✅ User loaded from storage: ${this.currentUser?.email}`);
      }
    } catch (error) {
      console.error("Failed to load user from storage:", error);
      this.clearAuth();
    }
  }

  private saveUserToStorage(user: User, token: string) {
    try {
      localStorage.setItem("peptok_user", JSON.stringify(user));
      localStorage.setItem("peptok_token", token);
      this.currentUser = user;
      this.authToken = token;
      setAuthToken(token);
      setCurrentUser(user); // Set user for apiEnhanced authorization
      console.log(`✅ User saved to storage: ${user.email}`);
    } catch (error) {
      console.error("Failed to save user to storage:", error);
      throw error;
    }
  }

  private clearAuth() {
    try {
      localStorage.removeItem("peptok_user");
      localStorage.removeItem("peptok_token");
      localStorage.removeItem("peptok_demo_data");
      this.currentUser = null;
      this.authToken = null;
      setAuthToken(null);
      console.log("🧹 Authentication data cleared");
    } catch (error) {
      console.error("Failed to clear auth:", error);
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  async isAuthenticated(): Promise<boolean> {
    if (this.currentUser && this.authToken) {
      try {
        // Check if it's a demo token
        if (this.authToken.startsWith("demo_token_")) {
          console.log("✅ Demo token verified");
          return true;
        }

        // Verify token with backend for real users
        await api.auth.getProfile();
        return true;
      } catch (error) {
        console.warn("Token verification failed:", error);
        this.clearAuth();
        return false;
      }
    }
    return false;
  }

  async loginWithEmail(email: string, password: string): Promise<AuthResponse> {
    try {
      console.log(`🔐 Login attempt for email: ${email}`);

      // Check for demo users first
      const demoUser = findDemoUser(email, password);
      if (demoUser) {
        console.log(`🎭 Demo login for: ${email}`);

        const user: User = {
          id: demoUser.id,
          name: demoUser.name,
          email: demoUser.email,
          firstName: demoUser.firstName,
          lastName: demoUser.lastName,
          picture: demoUser.picture,
          provider: demoUser.provider,
          userType: demoUser.userType,
          companyId: demoUser.companyId,
          company: demoUser.company,
          status: demoUser.status,
          joinedAt: demoUser.joinedAt,
          lastActive: demoUser.lastActive,
          isAuthenticated: true,
        };

        // Generate a demo token
        const demoToken = `demo_token_${demoUser.id}_${Date.now()}`;

        console.log(
          `✅ Demo login successful for "${email}", user type: ${user.userType}`,
        );

        this.saveUserToStorage(user, demoToken);

        // Store demo data in localStorage for easy access
        const demoData = getDemoDataForUser(demoUser);
        if (demoData) {
          localStorage.setItem("peptok_demo_data", JSON.stringify(demoData));
        }

        return {
          success: true,
          user,
          token: demoToken,
        };
      }

      // Fallback to backend API for non-demo users
      const response = await api.auth.login(email, password);

      const user: User = {
        ...response.user,
        isAuthenticated: true,
      };

      console.log(
        `✅ Login successful for "${email}", user type: ${user.userType}`,
      );

      this.saveUserToStorage(user, response.access_token);

      return {
        success: true,
        user,
        token: response.access_token,
      };
    } catch (error: any) {
      console.error(`❌ Login failed for ${email}:`, error);
      return {
        success: false,
        error: error.message || "Login failed. Please check your credentials.",
      };
    }
  }

  async signupWithEmail(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    company?: string;
    role?: string;
    userType: "company_admin" | "coach";
    businessDetails?: {
      companyName: string;
      industry: string;
      employeeCount: number;
      website?: string;
      phone?: string;
    };
  }): Promise<AuthResponse> {
    try {
      const response = await api.auth.register({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        userType: userData.userType,
        businessDetails: userData.businessDetails,
      });

      const user: User = {
        ...response.user,
        isAuthenticated: true,
        isNewUser: true,
      };

      this.saveUserToStorage(user, response.access_token);

      return {
        success: true,
        user,
        token: response.access_token,
        isNewUser: true,
      };
    } catch (error: any) {
      console.error("Signup failed:", error);
      return {
        success: false,
        error: error.message || "Signup failed. Please try again.",
      };
    }
  }

  async loginWithGoogle(): Promise<void> {
    try {
      // Redirect to backend Google OAuth endpoint
      window.location.href = `${api.getApiBaseUrl()}/auth/google`;
    } catch (error) {
      console.error("Google OAuth error:", error);
      toast.error("Failed to connect with Google. Please try again.");
    }
  }

  async loginWithMicrosoft(): Promise<void> {
    try {
      // For now, show a message that Microsoft OAuth is not implemented
      toast.error(
        "Microsoft OAuth is not yet implemented. Please use email/password login.",
      );
    } catch (error) {
      console.error("Microsoft OAuth error:", error);
      toast.error("Failed to connect with Microsoft. Please try again.");
    }
  }

  async handleOAuthCallback(
    provider: string,
    code: string,
    state: string,
  ): Promise<AuthResponse> {
    try {
      // This would typically be handled by a backend callback URL
      // For now, return an error as OAuth flow is handled server-side
      return {
        success: false,
        error: "OAuth callback should be handled by the backend",
      };
    } catch (error) {
      return {
        success: false,
        error: "OAuth callback failed",
      };
    }
  }

  async logout(): Promise<void> {
    try {
      // Call backend logout endpoint
      await api.auth.logout();

      this.clearAuth();
      toast.success("Successfully signed out");

      // Redirect to home page
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear local auth even if server call fails
      this.clearAuth();
      window.location.href = "/";
    }
  }

  async resetPassword(
    email: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // This would call the backend forgot-password endpoint
      // For now, return a success message
      return {
        success: true,
        message:
          "Password reset functionality will be implemented with backend integration.",
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to send password reset email. Please try again.",
      };
    }
  }

  // Get current user profile from backend
  async refreshUserProfile(): Promise<User | null> {
    try {
      if (!this.authToken) return null;

      const user = await api.auth.getProfile();
      this.currentUser = { ...user, isAuthenticated: true };
      localStorage.setItem("peptok_user", JSON.stringify(this.currentUser));

      return this.currentUser;
    } catch (error) {
      console.error("Failed to refresh user profile:", error);
      this.clearAuth();
      return null;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();

// Export utility functions
export const isAuthenticated = () => authService.isAuthenticated();
export const getCurrentUser = () => authService.getCurrentUser();
export const logout = () => authService.logout();
